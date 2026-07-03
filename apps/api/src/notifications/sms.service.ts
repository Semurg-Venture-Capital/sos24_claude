import { Injectable, Logger } from '@nestjs/common';

// Отправка SMS. Обёртка Playmobile с mock-режимом (no-op + лог), пока нет
// боевых ключей — по аналогии с PushService. Реальная интеграция: HTTP-клиент
// к Playmobile API по env PLAYMOBILE_URL/PLAYMOBILE_LOGIN/PLAYMOBILE_PASSWORD.
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // Боевой режим только если явно заданы креды и SMS_MOCK != 'true'.
  private get enabled(): boolean {
    return process.env.SMS_MOCK !== 'true' && !!process.env.PLAYMOBILE_URL && !!process.env.PLAYMOBILE_LOGIN;
  }

  async send(phone: string, text: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.enabled) {
      // Dev/mock: не шлём реально, но логируем — пайплайн считается «доставленным».
      this.logger.log(`[SMS mock] → ${phone}: ${text}`);
      return { ok: true };
    }
    try {
      // TODO: реальный вызов Playmobile API.
      // const res = await fetch(process.env.PLAYMOBILE_URL!, { method:'POST', ... });
      // if (!res.ok) throw new Error(`Playmobile ${res.status}`);
      this.logger.log(`SMS → ${phone}`);
      return { ok: true };
    } catch (e) {
      this.logger.error(`SMS failed → ${phone}: ${(e as Error).message}`);
      return { ok: false, error: (e as Error).message };
    }
  }
}
