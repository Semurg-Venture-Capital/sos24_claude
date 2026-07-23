import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { Client as MinioClient } from 'minio';
import { AriService, type AriChannel, type AriEvent } from './ari.service';
import { AmiService } from './ami.service';
import { CallCenterGateway } from './call-center.gateway';

// Префикс ключа записей разговоров в MinIO. Аплоадер на Asterisk кладёт файлы сюда же.
const REC_PREFIX = 'call-recordings';

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
    private readonly ami: AmiService,
    private readonly gateway: CallCenterGateway,
    private readonly config: ConfigService,
  ) {}

  // ── Очередь (ACD) через AMI ──

  async queueStatus() {
    const queue = this.config.get<string>('ASTERISK_QUEUE');
    if (!queue || !this.ami.isConnected()) {
      return { enabled: this.ami.isEnabled(), connected: this.ami.isConnected(), waiting: 0, available: 0, loggedIn: 0 };
    }
    try {
      const s = await this.ami.queueSummary(queue);
      return { enabled: true, connected: true, ...s };
    } catch {
      return { enabled: true, connected: this.ami.isConnected(), waiting: 0, available: 0, loggedIn: 0 };
    }
  }

  // Пауза/снятие паузы оператора в очереди. dev: общий тестовый extension;
  // прод: extension оператора по operatorId.
  async setOperatorPaused(operatorId: string, paused: boolean) {
    const ext = await this.operatorExt(operatorId);
    const queue = this.config.get<string>('ASTERISK_QUEUE') || undefined;
    if (!ext) throw new BadRequestException('Extension оператора не настроен');
    // FreePBX регистрирует члена очереди как Local/<ext>@from-queue/n (не PJSIP/<ext>).
    const iface = `Local/${ext}@from-queue/n`;
    await this.ami.queuePause(iface, paused, queue);
    return { iface, paused };
  }

  // SIP-креды для браузерного софтфона оператора (WebRTC через WSS).
  // Персональный extension оператора (User.sipExtension/sipSecret), заданный админом.
  // Фолбэк на общий тестовый extension из env (ASTERISK_TEST_SIP_*) — для dev/демо.
  async sipCredentials(operatorId: string) {
    const wsServer = this.config.get<string>('ASTERISK_WSS_URL');
    const domain = this.config.get<string>('ASTERISK_SIP_DOMAIN');
    if (!wsServer || !domain) return { configured: false as const };

    const op = await this.prisma.user.findUnique({
      where: { id: operatorId },
      select: { sipExtension: true, sipSecret: true, name: true, surname: true },
    });
    let ext = op?.sipExtension || undefined;
    let password = op?.sipSecret || undefined;
    let personal = true;
    if (!ext || !password) {
      // фолбэк: общий тестовый extension (dev)
      ext = this.config.get<string>('ASTERISK_TEST_SIP_EXT') || undefined;
      password = this.config.get<string>('ASTERISK_TEST_SIP_SECRET') || undefined;
      personal = false;
    }
    if (!ext || !password) return { configured: false as const, reason: 'no_extension' as const };

    const name = [op?.surname, op?.name].filter(Boolean).join(' ') || `Оператор ${ext}`;
    const iceServers = this.buildIceServers(operatorId);
    const hasTurn = iceServers.some((s) =>
      (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u) => u.startsWith('turn')),
    );
    this.logger.log(
      `SIP-креды оператору ${operatorId}: ext=${ext} personal=${personal} ws=${wsServer} ` +
        `iceServers=${iceServers.length} turn=${hasTurn ? 'да' : 'НЕТ'}`,
    );
    return {
      configured: true as const,
      personal,
      wsServer,
      domain,
      ext,
      password,
      uri: `sip:${ext}@${domain}`,
      displayName: name,
      operatorId,
      // ICE-серверы для WebRTC-медиа: STUN + TURN (coturn на sip.sos24.uz).
      // TURN-креды эфемерные (use-auth-secret): username=<ts>:<op>, credential=HMAC-SHA1.
      iceServers,
    };
  }

  // Список операторов с extension — для перевода звонка (blind transfer) на коллегу.
  // Исключаем самого оператора; только у кого задан sipExtension.
  async listOperators(currentUserId: string) {
    const ops = await this.prisma.user.findMany({
      where: { sipExtension: { not: null }, id: { not: currentUserId } },
      select: { id: true, name: true, surname: true, sipExtension: true },
      orderBy: [{ surname: 'asc' }, { name: 'asc' }],
    });
    return ops.map((o) => ({
      id: o.id,
      name: [o.surname, o.name].filter(Boolean).join(' ') || `Оператор ${o.sipExtension}`,
      ext: o.sipExtension as string,
    }));
  }

  // Формирует iceServers с временными TURN-кредами по схеме coturn use-auth-secret
  // (TURN REST API): username = "<expiryUnix>:<user>", credential = base64(HMAC-SHA1(secret, username)).
  // Без TURN_HOST — пусто; без TURN_SECRET — только STUN.
  private buildIceServers(operatorId: string): Array<{ urls: string | string[]; username?: string; credential?: string }> {
    const host = this.config.get<string>('TURN_HOST');
    if (!host) return [];
    const servers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: `stun:${host}:3478` },
    ];
    const secret = this.config.get<string>('TURN_SECRET');
    if (secret) {
      const ttl = Number(this.config.get<string>('TURN_TTL_SEC') ?? 43200); // 12ч
      const expiry = Math.floor(Date.now() / 1000) + (Number.isFinite(ttl) ? ttl : 43200);
      const username = `${expiry}:${operatorId}`;
      const credential = createHmac('sha1', secret).update(username).digest('base64');
      servers.push({
        urls: [
          `turn:${host}:3478?transport=udp`,
          `turn:${host}:3478?transport=tcp`,
          `turns:${host}:5349?transport=tcp`,
        ],
        username,
        credential,
      });
    }
    return servers;
  }

  // Персональный extension оператора (или общий тестовый из env).
  private async operatorExt(operatorId: string): Promise<string | null> {
    const op = await this.prisma.user.findUnique({
      where: { id: operatorId },
      select: { sipExtension: true },
    });
    return op?.sipExtension || this.config.get<string>('ASTERISK_TEST_SIP_EXT') || null;
  }

  onModuleInit() {
    this.ari.on('event', (e: AriEvent) => {
      this.handleEvent(e).catch((err) =>
        this.logger.warn(`обработка ARI-события ${e.type}: ${(err as Error).message}`),
      );
    });
  }

  // ── Роутинг ARI-событий ──
  // Два источника: (1) Stasis (in-app/тесты — канал заведён в наше приложение),
  // (2) FreePBX-нативный звонок (subscribeAll отдаёт ChannelCreated и пр. для обычных каналов).
  private async handleEvent(e: AriEvent) {
    const ch = e.channel;
    switch (e.type) {
      case 'StasisStart':
        if (ch) await this.registerInbound(ch, this.direction(ch));
        break;
      case 'ChannelCreated':
        // [ВРЕМЕННЫЙ ДИАГ] — подтвердить имя входящего канала с .29 (удалить после проверки).
        if (ch?.name?.startsWith('PJSIP/')) this.logger.log(`[DIAG] ChannelCreated: ${ch.name}`);
        // Нативный входящий с нашего транка (по префиксу имени канала).
        if (ch && this.isInboundTrunk(ch)) await this.registerInbound(ch, 'INBOUND_EXTERNAL');
        // Исходящий оператора: плечо к провайдеру (PJSIP/2050855-…).
        else if (ch && this.isOutboundTrunk(ch)) await this.registerOutbound(ch);
        break;
      case 'ChannelStateChange':
        // [ВРЕМЕННЫЙ ДИАГ] — состояние канала. Удалить после проверки.
        if (ch?.name?.startsWith('PJSIP/')) this.logger.log(`[DIAG] StateChange: ${ch.name} -> ${ch.state}`);
        // Раньше «Up = ответ», но при маршруте через .29 входящий канал (from-29) уходит в Up
        // мгновенно (внутренний транк отвечает сразу) — это не ответ оператора. Ответ ловим по бриджу.
        break;
      case 'ChannelEnteredBridge': {
        // Оператор ответил = наш входящий канал соединён в бридж с оператором (в бридже ≥2 канала).
        const chans = e.bridge?.channels ?? [];
        this.logger.log(`[DIAG] EnteredBridge: ${ch?.name} (в бридже ${chans.length} каналов)`);
        if (chans.length >= 2) {
          for (const cid of chans) await this.onAnswered(cid, chans);
        }
        break;
      }
      case 'StasisEnd':
      case 'ChannelDestroyed':
        if (ch) await this.onCallEnd(ch);
        break;
      default:
        break; // прочие события (subscribeAll) игнорируем
    }
  }

  private direction(ch: AriChannel): 'INBOUND_APP' | 'INBOUND_EXTERNAL' {
    // userId из канала (in-app звонок проставит переменную через dialplan).
    const appUser = ch.channelvars?.SOS24_USER_ID;
    return appUser ? 'INBOUND_APP' : 'INBOUND_EXTERNAL';
  }

  // Канал входящего внешнего звонка = имя начинается с префикса транка (PJSIP/from-29).
  private isInboundTrunk(ch: AriChannel): boolean {
    const prefix = this.config.get<string>('ASTERISK_TRUNK_PREFIX');
    return !!prefix && !!ch.name && ch.name.startsWith(prefix);
  }

  // Канал исходящего звонка оператора = плечо к провайдеру (PJSIP/2050855-…).
  private isOutboundTrunk(ch: AriChannel): boolean {
    const prefix = this.config.get<string>('ASTERISK_OUTBOUND_TRUNK_PREFIX');
    return !!prefix && !!ch.name && ch.name.startsWith(prefix);
  }

  // Регистрирует исходящий звонок оператора в журнале (по плечу к провайдеру).
  // Ответ ловится тем же ChannelEnteredBridge, завершение — ChannelDestroyed.
  private async registerOutbound(ch: AriChannel) {
    const existing = await this.prisma.call.findUnique({ where: { channelId: ch.id }, select: { id: true } });
    if (existing) return;
    // Набранный номер: exten плеча / connected-line (caller.number здесь = CID 2050855, не берём).
    const number = ch.dialplan?.exten || ch.connected?.number || undefined;
    const userId = number ? await this.matchUserByPhone(number) : null;
    const call = await this.prisma.call.create({
      data: {
        channelId: ch.id,
        direction: 'OUTBOUND',
        status: 'RINGING',
        externalNumber: number ?? null,
        userId: userId ?? null,
      },
    });
    this.gateway.emitUpdate({ callId: call.id, status: 'RINGING' });
    this.logger.log(`исходящий ${call.id} на ${number ?? 'неизвестно'} (канал ${ch.name})`);
  }

  // Регистрирует входящий звонок в журнале + screen-pop операторам (идемпотентно по channelId).
  private async registerInbound(ch: AriChannel, direction: 'INBOUND_APP' | 'INBOUND_EXTERNAL') {
    const number = ch.caller?.number || undefined;
    const appUserId = ch.channelvars?.SOS24_USER_ID || undefined;
    const userId = appUserId ?? (number ? await this.matchUserByPhone(number) : null);

    const existing = await this.prisma.call.findUnique({ where: { channelId: ch.id }, select: { id: true } });
    const call = await this.prisma.call.upsert({
      where: { channelId: ch.id },
      create: {
        channelId: ch.id,
        direction,
        status: 'RINGING',
        externalNumber: number ?? null,
        userId: userId ?? null,
      },
      update: { externalNumber: number ?? undefined, userId: userId ?? undefined },
    });
    if (existing) return; // уже зарегистрирован — не дублируем screen-pop

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

  // Ответ фиксируем по channelId зарегистрированного канала (входящий from-29 или
  // исходящее плечо 2050855). bridgeChannels — все каналы бриджа: MixMonitor мог
  // стартовать на любом из них (для исходящего — на канале оператора), поэтому ключ
  // записи ищем по всем.
  private async onAnswered(channelId: string, bridgeChannels?: string[]) {
    const call = await this.prisma.call.findUnique({ where: { channelId } });
    if (!call || call.answeredAt) return;
    const now = new Date();
    // К моменту ответа FreePBX-запись (MixMonitor) уже стартовала → ключ записи доступен.
    const recordingKey =
      call.recordingKey ?? (await this.captureRecordingKeyFrom(bridgeChannels ?? [channelId]));
    const updated = await this.prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'ANSWERED',
        answeredAt: now,
        waitSec: Math.max(0, Math.round((now.getTime() - call.startedAt.getTime()) / 1000)),
        ...(recordingKey ? { recordingKey } : {}),
      },
    });
    this.gateway.emitUpdate({ callId: updated.id, status: updated.status });
  }

  // Имя файла записи разговора: читаем MIXMONITOR_FILENAME с канала через ARI.
  // Ключ в MinIO = REC_PREFIX/<basename> — аплоадер на Asterisk кладёт файл под тем же ключом.
  private async captureRecordingKey(channelId: string): Promise<string | null> {
    const path = await this.ari.getChannelVar(channelId, 'MIXMONITOR_FILENAME');
    if (!path) return null;
    const base = path.split('/').pop();
    return base ? `${REC_PREFIX}/${base}` : null;
  }

  // Пробуем достать ключ записи с любого канала бриджа (MixMonitor мог стартовать
  // не на том канале, по которому зарегистрирован звонок — так на исходящих).
  private async captureRecordingKeyFrom(channelIds: string[]): Promise<string | null> {
    for (const id of channelIds) {
      const key = await this.captureRecordingKey(id);
      if (key) return key;
    }
    return null;
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

  // Временная ссылка на запись разговора. Записи лежат в выделенном хранилище
  // (прод-MinIO s3.sos24.uz, REC_S3_*) — туда же их заливает аплоадер на Asterisk.
  // presign считается локально (сеть к MinIO не нужна), поэтому работает и из dev.
  private recClient: MinioClient | null = null;
  private recBucket = '';

  private getRecClient(): MinioClient | null {
    if (this.recClient) return this.recClient;
    const endPoint = this.config.get<string>('REC_S3_ENDPOINT');
    const accessKey = this.config.get<string>('REC_S3_ACCESS_KEY');
    const secretKey = this.config.get<string>('REC_S3_SECRET_KEY');
    if (!endPoint || !accessKey || !secretKey) return null;
    this.recBucket = this.config.get<string>('REC_S3_BUCKET') ?? 'sos24';
    this.recClient = new MinioClient({
      endPoint,
      port: Number(this.config.get<string>('REC_S3_PORT') ?? 443),
      useSSL: (this.config.get<string>('REC_S3_SSL') ?? 'true') !== 'false',
      accessKey,
      secretKey,
    });
    return this.recClient;
  }

  async recordingUrl(id: string) {
    const call = await this.prisma.call.findUnique({ where: { id }, select: { recordingKey: true } });
    if (!call?.recordingKey) throw new NotFoundException('Записи нет');
    const client = this.getRecClient();
    if (!client) throw new NotFoundException('Хранилище записей не настроено (REC_S3_*)');
    // Файл записи заливает аплоадер на Asterisk (cron ~1/мин) — сразу после звонка
    // объекта в MinIO может ещё не быть. Проверяем наличие: если нет — «обрабатывается» (425),
    // фронт покажет статус вместо тихого провала воспроизведения.
    try {
      await client.statObject(this.recBucket, call.recordingKey);
    } catch {
      // 425 Too Early — запись ещё не залита в MinIO.
      throw new HttpException({ message: 'Запись ещё обрабатывается', code: 'RECORDING_PROCESSING' }, 425);
    }
    const url = await client.presignedGetObject(this.recBucket, call.recordingKey, 3600);
    return { url };
  }

  // Привязать звонок к существующей заявке + заметка оператора.
  async attachTicket(id: string, ticketId: string | null, note?: string) {
    await this.get(id);
    return this.prisma.call.update({
      where: { id },
      data: { ticketId: ticketId ?? null, ...(note !== undefined ? { note } : {}) },
    });
  }

  // Создать НОВУЮ заявку поддержки по звонку (омниканальность). Требует определённого клиента.
  async createTicketFromCall(
    callId: string,
    operatorId: string,
    dto: { category?: string; subject?: string; note?: string },
  ) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, userId: true, externalNumber: true, ticketId: true },
    });
    if (!call) throw new NotFoundException('Звонок не найден');
    if (!call.userId) {
      throw new BadRequestException('Звонок без определённого клиента — заявку создать нельзя (сохраните заметку)');
    }
    if (call.ticketId) throw new BadRequestException('К звонку уже привязана заявка');

    const subject = dto.subject?.trim() || `Обращение по звонку ${call.externalNumber ?? ''}`.trim();
    const category = (dto.category?.trim() || 'OTHER') as never;
    const note = dto.note?.trim();

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: call.userId!,
          subject,
          category,
          status: 'OPEN',
          agentId: operatorId,
          lastMessagePreview: note ?? subject,
          lastMessageAt: new Date(),
        },
      });
      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderRole: 'SYSTEM',
          type: 'SYSTEM',
          body: `Заявка создана по звонку оператором.${note ? '\nЗаметка: ' + note : ''}`,
        },
      });
      await tx.call.update({
        where: { id: callId },
        data: { ticketId: ticket.id, ...(note ? { note } : {}) },
      });
      return ticket;
    });
  }
}
