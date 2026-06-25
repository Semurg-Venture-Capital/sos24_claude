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

export interface SipCreds {
  configured: true;
  wsServer: string;
  domain: string;
  ext: string;
  password: string;
  uri: string;
  displayName: string;
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
    const uri = UserAgent.makeURI(creds.uri);
    if (!uri) {
      this.handlers.onStatus?.('failed');
      return;
    }
    this.ua = new UserAgent({
      uri,
      transportOptions: { server: creds.wsServer },
      authorizationUsername: creds.ext,
      authorizationPassword: creds.password,
      displayName: creds.displayName,
      delegate: {
        onInvite: (invitation) => this.onIncoming(invitation),
      },
    });

    try {
      await this.ua.start();
      this.registerer = new Registerer(this.ua);
      this.registerer.stateChange.addListener((s) => {
        if (s === RegistererState.Registered) this.handlers.onStatus?.('registered');
        else if (s === RegistererState.Unregistered) this.handlers.onStatus?.('unregistered');
      });
      await this.registerer.register();
    } catch {
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
    this.handlers.onCall?.('incoming', {
      number: id.uri.user ?? null,
      displayName: id.displayName || null,
    });
    invitation.stateChange.addListener((state) => this.onSessionState(state));
  }

  private onSessionState(state: SessionState) {
    if (state === SessionState.Established) {
      this.attachMedia();
      this.handlers.onCall?.('in-call');
    } else if (state === SessionState.Terminated) {
      this.cleanupSession();
      this.handlers.onCall?.('ended');
    }
  }

  private attachMedia() {
    const sdh = this.session?.sessionDescriptionHandler as
      | { peerConnection?: RTCPeerConnection }
      | undefined;
    const pc = sdh?.peerConnection;
    if (!pc) return;
    const remote = new MediaStream();
    pc.getReceivers().forEach((r) => {
      if (r.track) remote.addTrack(r.track);
    });
    this.audioEl.srcObject = remote;
    void this.audioEl.play().catch(() => {});
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
      if (inv.state !== SessionState.Initial) return; // состояние могло измениться за время await
      await inv.accept({
        sessionDescriptionHandlerOptions: { constraints: { audio, video: false } },
      });
    } catch {
      /* приём не удался — состояние изменилось / звонок отменён */
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
