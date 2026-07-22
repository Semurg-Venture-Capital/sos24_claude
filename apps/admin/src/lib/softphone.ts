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

  constructor(
    private readonly audioEl: HTMLAudioElement,
    private readonly handlers: SoftphoneHandlers = {},
  ) {}

  async start(creds: SipCreds) {
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
