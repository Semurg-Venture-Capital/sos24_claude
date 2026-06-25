import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { AriService, type AriChannel, type AriEvent } from './ari.service';
import { CallCenterGateway } from './call-center.gateway';

// Бизнес-логика колл-центра: слушает ARI-события и ведёт журнал звонков (модель Call),
// определяет звонящего (screen pop) и шлёт события операторам через gateway.
//
// ⚠️ Фаза 1 (dev): обрабатываем звонки, попавшие в наше Stasis-приложение (StasisStart/End).
// Маршрутизацию звонков в Stasis в FreePBX добавим отдельно (аккуратно, не трогая живой
// транк). Запись (MixMonitor) включается осознанно — здесь только метод, без авто-старта.
@Injectable()
export class CallCenterService implements OnModuleInit {
  private readonly logger = new Logger(CallCenterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly ari: AriService,
    private readonly gateway: CallCenterGateway,
  ) {}

  onModuleInit() {
    this.ari.on('event', (e: AriEvent) => {
      this.handleEvent(e).catch((err) =>
        this.logger.warn(`обработка ARI-события ${e.type}: ${(err as Error).message}`),
      );
    });
  }

  // ── Роутинг ARI-событий ──
  private async handleEvent(e: AriEvent) {
    switch (e.type) {
      case 'StasisStart':
        if (e.channel) await this.onCallStart(e.channel);
        break;
      case 'ChannelStateChange':
        if (e.channel?.state === 'Up') await this.onAnswered(e.channel);
        break;
      case 'StasisEnd':
      case 'ChannelDestroyed':
        if (e.channel) await this.onCallEnd(e.channel);
        break;
      default:
        break; // прочие события (subscribeAll) пока игнорируем
    }
  }

  private direction(ch: AriChannel): 'INBOUND_APP' | 'INBOUND_EXTERNAL' {
    // userId из канала (in-app звонок проставит переменную через dialplan).
    const appUser = ch.channelvars?.SOS24_USER_ID;
    return appUser ? 'INBOUND_APP' : 'INBOUND_EXTERNAL';
  }

  private async onCallStart(ch: AriChannel) {
    const number = ch.caller?.number || undefined;
    const appUserId = ch.channelvars?.SOS24_USER_ID || undefined;
    const userId = appUserId ?? (number ? await this.matchUserByPhone(number) : null);

    const call = await this.prisma.call.upsert({
      where: { channelId: ch.id },
      create: {
        channelId: ch.id,
        direction: this.direction(ch),
        status: 'RINGING',
        externalNumber: number ?? null,
        userId: userId ?? null,
      },
      update: { externalNumber: number ?? undefined, userId: userId ?? undefined },
    });

    // Screen pop: данные звонящего операторам.
    const screen = userId ? await this.screenPop(userId) : null;
    this.gateway.emitIncoming({
      callId: call.id,
      direction: call.direction,
      number,
      user: screen,
      at: call.startedAt,
    });
    this.logger.log(`звонок ${call.id} (${call.direction}) от ${screen?.name ?? number ?? 'неизвестно'}`);
  }

  private async onAnswered(ch: AriChannel) {
    const call = await this.prisma.call.findUnique({ where: { channelId: ch.id } });
    if (!call || call.answeredAt) return;
    const now = new Date();
    const updated = await this.prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'ANSWERED',
        answeredAt: now,
        waitSec: Math.max(0, Math.round((now.getTime() - call.startedAt.getTime()) / 1000)),
      },
    });
    this.gateway.emitUpdate({ callId: updated.id, status: updated.status });
  }

  private async onCallEnd(ch: AriChannel) {
    const call = await this.prisma.call.findUnique({ where: { channelId: ch.id } });
    if (!call || call.endedAt) return;
    const now = new Date();
    const answered = !!call.answeredAt;
    const updated = await this.prisma.call.update({
      where: { id: call.id },
      data: {
        status: answered ? 'COMPLETED' : 'MISSED',
        endedAt: now,
        durationSec: answered
          ? Math.max(0, Math.round((now.getTime() - call.answeredAt!.getTime()) / 1000))
          : 0,
      },
    });
    this.gateway.emitUpdate({ callId: updated.id, status: updated.status, durationSec: updated.durationSec });
  }

  // ── Идентификация звонящего ──
  private async matchUserByPhone(rawNumber: string): Promise<string | null> {
    const digits = rawNumber.replace(/\D/g, '');
    if (!digits) return null;
    // Пытаемся сматчить по нормализованному +998XXXXXXXXX (или хвосту номера).
    const candidates = [`+${digits}`, `+998${digits.slice(-9)}`];
    const user = await this.prisma.user.findFirst({
      where: { phone: { in: candidates } },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  private async screenPop(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        phone: true,
        verificationStatus: true,
        _count: { select: { policies: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: [user.surname, user.name].filter(Boolean).join(' ') || null,
      phone: user.phone,
      verified: user.verificationStatus === 'MYID_VERIFIED',
      policies: user._count.policies,
    };
  }

  // ── Запись (метод, без авто-старта на живом PBX) ──
  async startRecording(channelId: string, name: string) {
    return this.ari.request('POST', `/channels/${encodeURIComponent(channelId)}/record`, {
      name,
      format: 'wav',
      ifExists: 'overwrite',
    });
  }

  // ── Админ/оператор REST ──
  async health() {
    return { enabled: this.ari.isEnabled(), connected: this.ari.isConnected() };
  }

  async list(params: { status?: string; operatorId?: string; take?: number }) {
    const where: Prisma.CallWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumCallStatusFilter } : {}),
      ...(params.operatorId ? { operatorId: params.operatorId } : {}),
    };
    const calls = await this.prisma.call.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: Math.min(params.take ?? 100, 500),
      include: {
        user: { select: { id: true, name: true, surname: true, phone: true } },
        operator: { select: { id: true, name: true, surname: true } },
        ticket: { select: { id: true } },
      },
    });
    return { calls };
  }

  async get(id: string) {
    const call = await this.prisma.call.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, surname: true, phone: true } },
        operator: { select: { id: true, name: true, surname: true } },
        ticket: { select: { id: true } },
      },
    });
    if (!call) throw new NotFoundException('Звонок не найден');
    return call;
  }

  // Временная ссылка на запись разговора (MinIO presigned).
  async recordingUrl(id: string) {
    const call = await this.prisma.call.findUnique({ where: { id }, select: { recordingKey: true } });
    if (!call?.recordingKey) throw new NotFoundException('Записи нет');
    return { url: await this.minio.presignedGetUrl(call.recordingKey, 3600) };
  }

  // Привязать звонок к заявке + заметка оператора.
  async attachTicket(id: string, ticketId: string | null, note?: string) {
    await this.get(id);
    return this.prisma.call.update({
      where: { id },
      data: { ticketId: ticketId ?? null, ...(note !== undefined ? { note } : {}) },
    });
  }
}
