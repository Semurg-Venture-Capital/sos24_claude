'use client';

import {
  Invitation,
  Inviter,
  Registerer,
  RegistererState,
  Session,
  SessionState,
  UserAgent,
} from 'sip.js';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface SipCreds {
  configured: true;
  wsServer: string;
  domain: string;
  ext: string;
  password: string;
  uri: string;
  displayName: string;
  iceServers?: IceServer[];
}

// Единый префикс логов софтфона — оператор при тесте открывает DevTools → Console
// и фильтрует по «[softphone]», чтобы увидеть весь путь регистрации и установки медиа.
function slog(msg: string) {
  // eslint-disable-next-line no-console
  console.info(`[softphone] ${msg}`);
}

export type PhoneStatus = 'idle' | 'connecting' | 'registered' | 'unregistered' | 'failed';
export type CallState = 'none' | 'incoming' | 'outgoing' | 'in-call' | 'ended';

export interface IncomingInfo {
  number: string | null;
  displayName: string | null;
}

interface SoftphoneHandlers {
  onStatus?: (s: PhoneStatus) => void;
  onCall?: (s: CallState, info?: IncomingInfo) => void;
}

// Браузерный софтфон оператора на SIP.js поверх WSS (WebRTC). Управляет регистрацией
// и одним активным звонком. Звук подключается к переданному <audio>-элементу.
export class Softphone {
  private ua: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private session: Session | null = null;
  private invitation: Invitation | null = null;
  private domain = ''; // SIP-домен для сборки URI исходящего вызова

  constructor(
    private readonly audioEl: HTMLAudioElement,
    private readonly handlers: SoftphoneHandlers = {},
  ) {}

  async start(creds: SipCreds) {
    this.domain = creds.domain;
    this.handlers.onStatus?.('connecting');
    // Диагностика: конфиг софтфона (без паролей) — видно в консоли браузера при тесте.
    slog(`старт: ws=${creds.wsServer} uri=${creds.uri} display="${creds.displayName}"`);
    const ice = creds.iceServers ?? [];
    slog(`ICE-серверов: ${ice.length}`);
    ice.forEach((s, i) => {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      slog(`  iceServer[${i}]: ${urls.join(', ')}${s.username ? ' (с TURN-кредом)' : ''}`);
    });
    if (!ice.some((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u) => u.startsWith('turn')))) {
      slog('⚠️ TURN-серверов нет — за строгим NAT звук может не пойти');
    }
    const uri = UserAgent.makeURI(creds.uri);
    if (!uri) {
      slog('✗ не удалось разобрать SIP URI');
      this.handlers.onStatus?.('failed');
      return;
    }
    this.ua = new UserAgent({
      uri,
      transportOptions: { server: creds.wsServer },
      authorizationUsername: creds.ext,
      authorizationPassword: creds.password,
      displayName: creds.displayName,
      // ICE-серверы (STUN/TURN через coturn на sip.sos24.uz) — чтобы медиа пробивалось
      // из любой сети, а не только там, где есть прямой RTP до Asterisk.
      ...(creds.iceServers?.length
        ? {
            sessionDescriptionHandlerFactoryOptions: {
              peerConnectionConfiguration: { iceServers: creds.iceServers },
            },
          }
        : {}),
      delegate: {
        onInvite: (invitation) => this.onIncoming(invitation),
      },
    });

    try {
      await this.ua.start();
      slog('WSS-транспорт подключён');
      this.registerer = new Registerer(this.ua);
      this.registerer.stateChange.addListener((s) => {
        slog(`регистрация: ${s}`);
        if (s === RegistererState.Registered) this.handlers.onStatus?.('registered');
        else if (s === RegistererState.Unregistered) this.handlers.onStatus?.('unregistered');
      });
      await this.registerer.register();
    } catch (e) {
      slog(`✗ ошибка старта/регистрации: ${(e as Error)?.message ?? e}`);
      this.handlers.onStatus?.('failed');
    }
  }

  private onIncoming(invitation: Invitation) {
    // Один звонок за раз — занятость отклоняем.
    if (this.session) {
      invitation.reject();
      return;
    }
    this.invitation = invitation;
    this.session = invitation;
    const id = invitation.remoteIdentity;
    slog(`входящий звонок от ${id.uri.user ?? '?'} "${id.displayName || ''}"`);
    this.handlers.onCall?.('incoming', {
      number: id.uri.user ?? null,
      displayName: id.displayName || null,
    });
    invitation.stateChange.addListener((state) => this.onSessionState(state));
  }

  private onSessionState(state: SessionState) {
    slog(`сессия: ${state}`);
    if (state === SessionState.Establishing) {
      // pc уже создан (после accept) — навешиваем ICE-диагностику как можно раньше.
      this.wirePcDiagnostics();
    } else if (state === SessionState.Established) {
      this.wirePcDiagnostics();
      this.attachMedia();
      this.handlers.onCall?.('in-call');
    } else if (state === SessionState.Terminated) {
      this.cleanupSession();
      this.handlers.onCall?.('ended');
    }
  }

  // ICE-диагностика: печатает в консоль браузера весь ход установки медиа —
  // кандидаты (host/srflx/relay), состояния ICE и соединения. Главный инструмент
  // при разборе «звонок есть, звука нет». relay-кандидат = TURN работает.
  private pcWired = false;
  private wirePcDiagnostics() {
    const sdh = this.session?.sessionDescriptionHandler as
      | { peerConnection?: RTCPeerConnection }
      | undefined;
    const pc = sdh?.peerConnection;
    if (!pc || this.pcWired) return;
    this.pcWired = true;
    slog(`peerConnection создан (iceConnectionState=${pc.iceConnectionState})`);
    // Ранний/ответный аудио-трек подключаем к <audio> сразу, как он появился —
    // чтобы гудок и автоответы сети (early media из 183) звучали до ответа.
    pc.addEventListener('track', () => {
      slog('получен медиа-трек — подключаю аудио');
      this.attachMedia();
    });
    pc.addEventListener('iceconnectionstatechange', () => {
      slog(`iceConnectionState=${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') slog('✗ ICE FAILED — медиа не установилось (проверь TURN/relay)');
    });
    pc.addEventListener('icegatheringstatechange', () => slog(`iceGatheringState=${pc.iceGatheringState}`));
    pc.addEventListener('connectionstatechange', () => slog(`connectionState=${pc.connectionState}`));
    pc.addEventListener('icecandidateerror', (ev) => {
      const e = ev as RTCPeerConnectionIceErrorEvent;
      slog(`ICE candidate error: code=${e.errorCode} "${e.errorText}" url=${e.url ?? ''}`);
    });
    pc.addEventListener('icecandidate', (ev) => {
      const c = ev.candidate;
      if (!c) {
        slog('ICE-сбор кандидатов завершён');
        return;
      }
      // type: host (свой), srflx (через STUN), relay (через TURN) — relay подтверждает coturn.
      slog(`ICE-кандидат: type=${c.type ?? '?'} ${c.protocol ?? ''} ${c.address ?? c.candidate}:${c.port ?? ''}`);
    });
  }

  private attachMedia() {
    const sdh = this.session?.sessionDescriptionHandler as
      | { peerConnection?: RTCPeerConnection }
      | undefined;
    const pc = sdh?.peerConnection;
    if (!pc) {
      slog('✗ attachMedia: нет peerConnection');
      return;
    }
    const remote = new MediaStream();
    const tracks = pc.getReceivers().filter((r) => r.track);
    tracks.forEach((r) => remote.addTrack(r.track));
    slog(`attachMedia: входящих аудио-треков ${tracks.length}`);
    if (tracks.length === 0) slog('⚠️ входящих треков нет — оператор не услышит абонента');
    this.audioEl.srcObject = remote;
    void this.audioEl.play().catch((e) => slog(`✗ audio.play(): ${(e as Error)?.message ?? e}`));
  }

  // Исходящий вызов, инициируемый браузером (client-originated). Переиспользует
  // уже зарегистрированный UA (ext оператора) и тот же WebRTC/TURN-путь, что и на
  // входящих. number: внутренний ext («101», «7000») или внешний («+998…» → цифры).
  async call(number: string) {
    if (!this.ua) {
      slog('✗ вызов невозможен: UA не запущен');
      return;
    }
    if (this.session) {
      slog('✗ вызов невозможен: уже есть активный звонок');
      return;
    }
    // Оставляем только цифры и служебные * # (плюс и форматирование убираем).
    let clean = number.replace(/[^\d*#]/g, '');
    // УЗ-провайдер (транк 2050855 → 10.10.0.3) принимает НАЦИОНАЛЬНЫЙ формат без
    // кода страны 998. Номера в журнале/от CallerID часто приходят как 998XXXXXXXXX
    // или +998… — срезаем ведущие 998 (полный межнар. номер = 998 + 9 цифр = 12).
    // Внутренние ext (101, 7000) короче и не начинаются на 998 — их не трогаем.
    if (clean.startsWith('998') && clean.length > 9) clean = clean.slice(3);
    if (!clean) {
      slog('✗ пустой номер');
      return;
    }
    const target = UserAgent.makeURI(`sip:${clean}@${this.domain}`);
    if (!target) {
      slog(`✗ неверный номер: ${clean}`);
      return;
    }
    // Для исходящего ВСЕГДА запрашиваем микрофон (audio:true): оффер строим мы,
    // и без аудио-дорожки SIP.js шлёт SDP без m=audio → Asterisk отвечает 488
    // Not Acceptable Here. Проверку enumerateDevices НЕ используем — до выдачи
    // прав на микрофон браузер отдаёт устройства с пустым kind, и она ложно
    // возвращает «микрофона нет» → пустой оффер. Нет микрофона → getUserMedia
    // бросит, звонок не состоится (для исходящего это ожидаемо: нечем говорить).
    slog(`исходящий вызов на ${clean}`);
    const inviter = new Inviter(this.ua, target, {
      // Early media: применять SDP из ответа 183 Session Progress, чтобы оператор
      // слышал гудок вызова и автоответы сети («абонент недоступен», «неверный
      // номер») ещё ДО ответа (200 OK). Без этого до ответа тишина.
      earlyMedia: true,
      sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } },
    });
    this.session = inviter;
    this.handlers.onCall?.('outgoing', { number: clean, displayName: null });
    inviter.stateChange.addListener((state) => this.onSessionState(state));
    try {
      await inviter.invite();
      slog('INVITE отправлен');
    } catch (e) {
      slog(`✗ исходящий не удался: ${(e as Error)?.message ?? e}`);
      this.cleanupSession();
      this.handlers.onCall?.('ended');
    }
  }

  private answering = false;

  async answer() {
    const inv = this.invitation;
    // Принять можно один раз и только из начального состояния — иначе SIP.js бросает
    // "Invalid session state Establishing" (двойной клик / повторный вызов).
    if (!inv || this.answering || inv.state !== SessionState.Initial) return;
    this.answering = true;
    try {
      // Если на машине нет микрофона (напр. Mac mini) — отвечаем в режиме «только приём»
      // (recvonly): слышим собеседника, но не передаём. Иначе getUserMedia падает NotFoundError.
      let audio = true;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audio = devices.some((d) => d.kind === 'audioinput');
      } catch {
        audio = true;
      }
      slog(`приём звонка: микрофон=${audio ? 'есть (двусторонний)' : 'нет → recvonly (только слушаем)'}`);
      if (inv.state !== SessionState.Initial) return; // состояние могло измениться за время await
      await inv.accept({
        sessionDescriptionHandlerOptions: { constraints: { audio, video: false } },
      });
      slog('accept() отправлен');
    } catch (e) {
      slog(`✗ приём не удался: ${(e as Error)?.message ?? e}`);
    } finally {
      this.answering = false;
    }
  }

  async hangup() {
    try {
      if (this.invitation && this.session?.state === SessionState.Initial) {
        await this.invitation.reject();
      } else if (this.session) {
        if (this.session.state === SessionState.Established) await this.session.bye();
        else if (this.session instanceof Inviter) this.session.cancel();
        else if (this.invitation) await this.invitation.reject();
      }
    } catch {
      /* состояние могло измениться */
    }
    this.cleanupSession();
  }

  // Перевод активного разговора на другой extension (слепой перевод, SIP REFER).
  // ВАЖНО: как только АТС приняла REFER (202) и соединяет абонента с целью, мы
  // завершаем СВОЮ ногу — иначе переводящий оператор остаётся «занят» и на него
  // нельзя перевести обратно (АТС отвечает 503). Так работает обычный телефон:
  // нажал «перевести» → твой звонок кончился, двое соединились.
  async transfer(number: string) {
    if (!this.session || this.session.state !== SessionState.Established) {
      slog('✗ перевод: нет активного разговора');
      return;
    }
    const clean = number.replace(/[^\d*#]/g, '');
    const target = UserAgent.makeURI(`sip:${clean}@${this.domain}`);
    if (!target) {
      slog(`✗ перевод: неверный номер ${clean}`);
      return;
    }
    slog(`перевод звонка на ${clean}`);
    try {
      await this.session.refer(target, {
        requestDelegate: {
          onAccept: () => {
            slog('REFER принят (202) — завершаю свою ногу, оператор свободен');
            void this.hangup();
          },
          onReject: (response) => {
            slog(`✗ перевод отклонён: ${response.message.statusCode} — разговор продолжается`);
          },
        },
      });
    } catch (e) {
      slog(`✗ перевод не удался: ${(e as Error)?.message ?? e}`);
    }
  }

  // Отправить DTMF-тон в активном разговоре (клавиатура во время звонка — IVR).
  sendDtmf(tone: string) {
    const sdh = this.session?.sessionDescriptionHandler as
      | { sendDtmf?: (tones: string) => boolean }
      | undefined;
    if (sdh?.sendDtmf) {
      slog(`DTMF: ${tone}`);
      sdh.sendDtmf(tone);
    }
  }

  setMuted(muted: boolean) {
    const sdh = this.session?.sessionDescriptionHandler as
      | { peerConnection?: RTCPeerConnection }
      | undefined;
    sdh?.peerConnection?.getSenders().forEach((s) => {
      if (s.track && s.track.kind === 'audio') s.track.enabled = !muted;
    });
  }

  private cleanupSession() {
    this.session = null;
    this.invitation = null;
    this.pcWired = false;
    if (this.audioEl) this.audioEl.srcObject = null;
  }

  async stop() {
    try {
      await this.hangup();
      await this.registerer?.unregister();
      await this.ua?.stop();
    } catch {
      /* при размонтировании ошибки не важны */
    }
    this.ua = null;
    this.registerer = null;
  }
}
