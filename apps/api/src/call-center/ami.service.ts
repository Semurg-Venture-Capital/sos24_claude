import * as net from 'node:net';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AmiMsg = Record<string, string>;
interface Pending {
  resolve: (v: AmiMsg | AmiMsg[]) => void;
  reject: (e: Error) => void;
  events: AmiMsg[];
  collectUntil?: string;
  timer: NodeJS.Timeout;
}

// Тонкий AMI-клиент (Asterisk Manager Interface) для операций с очередью:
// статус (QueueSummary) и пауза оператора (QueuePause). ARI очереди app_queue не отдаёт,
// поэтому отдельный AMI. Безопасно «выключается» без ASTERISK_AMI_*; авто-реконнект.
@Injectable()
export class AmiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmiService.name);
  private socket: net.Socket | null = null;
  private buffer = '';
  private connected = false;
  private loggedIn = false;
  private stopped = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 2000;
  private seq = 0;
  private readonly pending = new Map<string, Pending>();

  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.host = config.get<string>('ASTERISK_AMI_HOST') ?? '';
    this.port = Number(config.get<string>('ASTERISK_AMI_PORT') ?? 5038);
    this.user = config.get<string>('ASTERISK_AMI_USER') ?? '';
    this.pass = config.get<string>('ASTERISK_AMI_PASSWORD') ?? '';
    this.enabled = Boolean(this.host && this.user && this.pass);
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('AMI выключен (нет ASTERISK_AMI_*) — функции очереди недоступны');
      return;
    }
    this.connect();
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.destroy();
  }

  isEnabled() {
    return this.enabled;
  }
  isConnected() {
    return this.connected && this.loggedIn;
  }

  private connect() {
    if (this.stopped) return;
    const socket = net.connect(this.port, this.host);
    this.socket = socket;
    socket.setEncoding('utf8');
    socket.on('connect', () => this.login());
    socket.on('data', (d: string) => this.onData(d));
    socket.on('close', () => {
      this.connected = false;
      this.loggedIn = false;
      this.scheduleReconnect();
    });
    socket.on('error', (e: Error) => this.logger.warn(`AMI ошибка: ${e.message}`));
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private login() {
    this.socket?.write(
      `Action: Login\r\nUsername: ${this.user}\r\nSecret: ${this.pass}\r\nEvents: off\r\n\r\n`,
    );
  }

  private onData(chunk: string) {
    this.buffer += chunk;
    let idx: number;
    while ((idx = this.buffer.indexOf('\r\n\r\n')) >= 0) {
      const block = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 4);
      if (block.trim()) this.handleBlock(block);
    }
  }

  private handleBlock(block: string) {
    const msg: AmiMsg = {};
    for (const line of block.split('\r\n')) {
      const i = line.indexOf(':');
      if (i > 0) msg[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }

    if (!this.loggedIn && msg.response === 'Success' && /authentication accepted/i.test(msg.message ?? '')) {
      this.loggedIn = true;
      this.connected = true;
      this.reconnectDelay = 2000;
      this.logger.log('AMI: авторизован');
      return;
    }

    const aid = msg.actionid;
    if (!aid || !this.pending.has(aid)) return;
    const p = this.pending.get(aid)!;

    if (p.collectUntil) {
      if (msg.event === p.collectUntil) {
        this.finish(aid, p.events);
      } else if (msg.event) {
        p.events.push(msg);
      } else if (msg.response === 'Error') {
        clearTimeout(p.timer);
        this.pending.delete(aid);
        p.reject(new Error(msg.message ?? 'AMI error'));
      }
    } else {
      this.finish(aid, msg);
    }
  }

  private finish(aid: string, value: AmiMsg | AmiMsg[]) {
    const p = this.pending.get(aid);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(aid);
    p.resolve(value);
  }

  private sendAction(action: string, params: AmiMsg = {}, collectUntil?: string): Promise<AmiMsg | AmiMsg[]> {
    if (!this.isConnected()) return Promise.reject(new Error('AMI не подключён'));
    const aid = `sos24-${++this.seq}`;
    let raw = `Action: ${action}\r\nActionID: ${aid}\r\n`;
    for (const [k, v] of Object.entries(params)) raw += `${k}: ${v}\r\n`;
    raw += '\r\n';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(aid);
        reject(new Error(`AMI ${action} таймаут`));
      }, 8000);
      this.pending.set(aid, { resolve, reject, events: [], collectUntil, timer });
      this.socket?.write(raw);
    });
  }

  // ── Очередь ──

  // Сводка очереди: ожидающие/доступные операторы.
  async queueSummary(queue: string): Promise<{ waiting: number; available: number; loggedIn: number }> {
    const events = (await this.sendAction('QueueSummary', { Queue: queue }, 'QueueSummaryComplete')) as AmiMsg[];
    const q = events.find((e) => e.event === 'QueueSummary' && e.queue === queue) ?? events[0];
    return {
      waiting: Number(q?.callers ?? 0),
      available: Number(q?.available ?? 0),
      loggedIn: Number(q?.loggedin ?? 0),
    };
  }

  // Пауза/снятие паузы оператора в очереди (interface, напр. PJSIP/102).
  async queuePause(iface: string, paused: boolean, queue?: string): Promise<void> {
    await this.sendAction('QueuePause', {
      Interface: iface,
      Paused: paused ? 'true' : 'false',
      ...(queue ? { Queue: queue } : {}),
      Reason: paused ? 'break' : '',
    });
  }
}
