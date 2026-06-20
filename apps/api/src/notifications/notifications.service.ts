import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { DevicePlatform, NotificationType, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';
import { PUSH_QUEUE, type PushJobData } from './push.processor';

export interface SendNotificationInput {
  type?: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>; // { screen, ...params } для deep link
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    @InjectQueue(PUSH_QUEUE) private readonly pushQueue: Queue<PushJobData>,
  ) {}

  // ── Уведомления (in-app) ──
  list(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { ok: true };
  }

  // ── Рассылка всем (админ) ──
  async broadcast(input: { type?: NotificationType; title: string; body: string; data?: Record<string, string> }) {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    if (!users.length) return { recipients: 0 };

    // In-app: пишем всем (источник истины).
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: input.type ?? 'SYSTEM',
        title: input.title,
        body: input.body,
        data: (input.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      })),
    });

    // Push кладём в очередь по каждому пользователю (processor пропустит тех, у кого нет токенов).
    const payload = { title: input.title, body: input.body, data: input.data ?? {} };
    try {
      await this.pushQueue.addBulk(users.map((u) => ({ name: 'send', data: { userId: u.id, payload } })));
    } catch (e) {
      this.logger.warn(`broadcast: очередь push недоступна: ${(e as Error).message}`);
    }
    return { recipients: users.length };
  }

  // ── Push-токены устройств ──
  async registerToken(userId: string, token: string, platform: DevicePlatform) {
    // token уникален: если был привязан к другому пользователю — переназначаем.
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });
    return { ok: true };
  }

  async unregisterToken(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token, userId } });
    return { ok: true };
  }

  // ── Отправка: запись в БД + push на все устройства пользователя ──
  async send(userId: string, input: SendNotificationInput) {
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        type: input.type ?? 'SYSTEM',
        title: input.title,
        body: input.body,
        data: (input.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });

    // Push кладём в очередь (BullMQ) — ретраи/backoff, вне критического пути.
    // Уведомление уже в БД, поэтому даже если очередь недоступна — история не теряется.
    const payload = {
      title: input.title,
      body: input.body,
      data: { ...(input.data ?? {}), notificationId: notif.id },
    };
    try {
      await this.pushQueue.add('send', { userId, payload });
    } catch (e) {
      // Очередь/Redis недоступны → фолбэк на прямую отправку (best-effort).
      this.logger.warn(`очередь push недоступна, fallback inline: ${(e as Error).message}`);
      try {
        const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
        if (tokens.length) {
          const { invalidTokens } = await this.push.send(
            tokens.map((t) => ({ token: t.token, platform: t.platform })),
            payload,
          );
          if (invalidTokens.length) {
            await this.prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
          }
        }
      } catch (err) {
        this.logger.error(`push для ${userId}: ${(err as Error).message}`);
      }
    }

    return notif;
  }
}
