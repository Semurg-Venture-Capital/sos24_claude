import { EventEmitter } from 'node:events';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

// Тонкий клиент Asterisk ARI: события через WebSocket (/ari/events) + REST (/ari/*).
// Не зависит от прикладной логики — публикует сырые ARI-события через EventEmitter
// (событие 'event'), их слушает CallCenterService. Реализован на ws + global fetch,
// чтобы не тащить устаревший ari-client.
//
// Безопасно «выключается», если ASTERISK_ARI_URL не задан (прод без WG-туннеля
// не падает). Авто-реконнект с backoff; падение Asterisk не роняет приложение.
@Injectable()
export class AriService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AriService.name);
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 2000;
  private stopped = false;
  private connected = false;

  private readonly httpBase: string; // http(s)://host:8088/ari
  private readonly wsBase: string; // ws(s)://host:8088/ari
  private readonly app: string;
  private readonly user: string;
  private readonly pass: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    super();
    const url = (config.get<string>('ASTERISK_ARI_URL') ?? '').replace(/\/+$/, '');
    this.app = config.get<string>('ASTERISK_ARI_APP') ?? 'sos24-callcenter';
    this.user = config.get<string>('ASTERISK_ARI_USER') ?? '';
    this.pass = config.get<string>('ASTERISK_ARI_PASSWORD') ?? '';
    this.enabled = Boolean(url && this.user && this.pass);
    this.httpBase = url ? `${url}/ari` : '';
    this.wsBase = url ? `${url.replace(/^http/, 'ws')}/ari` : '';
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('ARI выключен (нет ASTERISK_ARI_URL/USER/PASSWORD) — колл-центр в пассивном режиме');
      return;
    }
    this.connect();
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ── WebSocket события ──
  private connect() {
    if (this.stopped) return;
    const u = `${this.wsBase}/events?app=${encodeURIComponent(this.app)}&subscribeAll=true&api_key=${encodeURIComponent(this.user)}:${encodeURIComponent(this.pass)}`;
    this.logger.log(`ARI: подключение к ${this.wsBase} (app=${this.app})`);
    const ws = new WebSocket(u);
    this.ws = ws;

    ws.on('open', () => {
      this.connected = true;
      this.reconnectDelay = 2000;
      this.logger.log('ARI: WebSocket подключён');
      this.emit('connected');
    });
    ws.on('message', (raw: WebSocket.RawData) => {
      let event: AriEvent;
      try {
        event = JSON.parse(raw.toString()) as AriEvent;
      } catch {
        return;
      }
      this.emit('event', event);
    });
    ws.on('close', () => {
      this.connected = false;
      this.emit('disconnected');
      this.scheduleReconnect();
    });
    ws.on('error', (e: Error) => {
      this.logger.warn(`ARI WS ошибка: ${e.message}`);
      // 'close' придёт следом и запланирует реконнект
    });
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
    this.logger.debug(`ARI: реконнект через ${delay}мс`);
  }

  // ── REST ──
  async request<T = unknown>(
    method: 'GET' | 'POST' | 'DELETE' | 'PUT',
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    if (!this.enabled) throw new Error('ARI не настроен');
    const qs = query
      ? '?' +
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    const auth = Buffer.from(`${this.user}:${this.pass}`).toString('base64');
    const res = await fetch(`${this.httpBase}${path}${qs}`, {
      method,
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`ARI ${method} ${path} → ${res.status} ${body.slice(0, 200)}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // Часто используемые операции (Фаза 1 расширим).
  getInfo() {
    return this.request('GET', '/asterisk/info');
  }
  listEndpoints() {
    return this.request<unknown[]>('GET', '/endpoints');
  }
  answer(channelId: string) {
    return this.request('POST', `/channels/${encodeURIComponent(channelId)}/answer`);
  }
  hangup(channelId: string) {
    return this.request('DELETE', `/channels/${encodeURIComponent(channelId)}`);
  }

  // Прочитать переменную канала (напр. MIXMONITOR_FILENAME — путь файла записи FreePBX).
  // Возвращает null, если переменной нет или канал уже завершён.
  async getChannelVar(channelId: string, variable: string): Promise<string | null> {
    try {
      const res = await this.request<{ value?: string }>(
        'GET',
        `/channels/${encodeURIComponent(channelId)}/variable`,
        { variable },
      );
      return res?.value || null;
    } catch {
      return null;
    }
  }
}

// Минимальная типизация ARI-события (нужные поля; остальное приходит как есть).
export interface AriEvent {
  type: string;
  application?: string;
  timestamp?: string;
  channel?: AriChannel;
  bridge?: { id: string; channels?: string[] };
  args?: string[];
  [k: string]: unknown;
}

export interface AriChannel {
  id: string;
  name?: string;
  state?: string;
  caller?: { name?: string; number?: string };
  connected?: { name?: string; number?: string };
  dialplan?: { context?: string; exten?: string; priority?: number };
  creationtime?: string;
  language?: string;
  channelvars?: Record<string, string>;
}
