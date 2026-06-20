import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type SendResponse } from 'firebase-admin/messaging';
import apn from '@parse/node-apn';

export interface PushTarget {
  token: string;
  platform: 'IOS' | 'ANDROID';
}
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Прямая отправка push: Android → FCM (firebase-admin), iOS → APNs (.p8).
// Конфигурируется через env; без ключей сервис ничего не шлёт (no-op) —
// in-app уведомления при этом продолжают работать. Возвращает список «мёртвых»
// токенов, которые вызывающий код удаляет из БД.
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private fcm: App | null = null;
  private apns: apn.Provider | null = null;
  private apnsTopic = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.initFcm();
    this.initApns();
    if (!this.fcm && !this.apns) {
      this.logger.warn('Push не настроен (нет FCM/APNs ключей) — уведомления только in-app.');
    }
  }

  get enabled(): boolean {
    return !!this.fcm || !!this.apns;
  }

  private initFcm(): void {
    const raw = this.config.get<string>('FCM_SERVICE_ACCOUNT');
    if (!raw) return;
    try {
      const cred = JSON.parse(raw) as ServiceAccount;
      this.fcm = getApps().length ? getApp() : initializeApp({ credential: cert(cred) });
      this.logger.log('FCM инициализирован');
    } catch (e) {
      this.logger.error(`FCM init: ${(e as Error).message}`);
    }
  }

  private initApns(): void {
    const key = this.config.get<string>('APNS_KEY');
    const keyId = this.config.get<string>('APNS_KEY_ID');
    const teamId = this.config.get<string>('APNS_TEAM_ID');
    const bundleId = this.config.get<string>('APNS_BUNDLE_ID');
    if (!key || !keyId || !teamId || !bundleId) return;
    try {
      this.apns = new apn.Provider({
        token: { key: key.replace(/\\n/g, '\n'), keyId, teamId },
        production: (this.config.get<string>('APNS_PRODUCTION') ?? 'false') === 'true',
      });
      this.apnsTopic = bundleId;
      this.logger.log('APNs инициализирован');
    } catch (e) {
      this.logger.error(`APNs init: ${(e as Error).message}`);
    }
  }

  /** Отправляет push на цели. Возвращает токены, которые надо удалить (невалидны). */
  async send(targets: PushTarget[], payload: PushPayload): Promise<{ invalidTokens: string[] }> {
    const invalid: string[] = [];
    if (!this.enabled || targets.length === 0) return { invalidTokens: invalid };

    const android = targets.filter((t) => t.platform === 'ANDROID').map((t) => t.token);
    const ios = targets.filter((t) => t.platform === 'IOS').map((t) => t.token);

    if (this.fcm && android.length) invalid.push(...(await this.sendFcm(android, payload)));
    if (this.apns && ios.length) invalid.push(...(await this.sendApns(ios, payload)));

    return { invalidTokens: invalid };
  }

  private async sendFcm(tokens: string[], p: PushPayload): Promise<string[]> {
    const dead: string[] = [];
    try {
      const res = await getMessaging(this.fcm!).sendEachForMulticast({
        tokens,
        notification: { title: p.title, body: p.body },
        data: p.data ?? {},
      });
      res.responses.forEach((r: SendResponse, i: number) => {
        if (!r.success) {
          const code = r.error?.code ?? '';
          if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
            dead.push(tokens[i]);
          } else {
            this.logger.warn(`FCM ошибка для токена: ${code}`);
          }
        }
      });
    } catch (e) {
      this.logger.error(`FCM send: ${(e as Error).message}`);
    }
    return dead;
  }

  private async sendApns(tokens: string[], p: PushPayload): Promise<string[]> {
    const dead: string[] = [];
    try {
      const note = new apn.Notification();
      note.topic = this.apnsTopic;
      note.alert = { title: p.title, body: p.body };
      note.sound = 'default';
      note.payload = p.data ?? {};
      const res = await this.apns!.send(note, tokens);
      for (const f of res.failed) {
        // 410 (Unregistered) / BadDeviceToken — токен мёртв.
        const reason = f.response?.reason;
        if (String(f.status) === '410' || reason === 'BadDeviceToken' || reason === 'Unregistered') {
          if (f.device) dead.push(f.device);
        } else {
          this.logger.warn(`APNs ошибка: ${f.response?.reason ?? f.status ?? f.error?.message}`);
        }
      }
    } catch (e) {
      this.logger.error(`APNs send: ${(e as Error).message}`);
    }
    return dead;
  }
}
