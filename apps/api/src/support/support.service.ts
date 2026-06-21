import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  Prisma,
  SupportMessage,
  SupportMessageType,
  SupportTicket,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupportGateway } from './support.gateway';
import type {
  CreateTicketDto,
  ListTicketsQueryDto,
  MessagesQueryDto,
  SendMessageDto,
  UpdateTicketDto,
} from './dto/support.dto';

const MESSAGE_PAGE = 30;
const TICKET_PAGE = 30;
const ATTACHMENT_TTL = 3600; // 1 час

const CATEGORY_LABEL: Record<string, string> = {
  POLICY: 'Полисы',
  PAYMENT: 'Оплата',
  ACCIDENT: 'ДТП',
  ACCOUNT: 'Аккаунт',
  OTHER: 'Другое',
};

function attachmentType(mime?: string | null): SupportMessageType {
  if (!mime) return 'TEXT';
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
}

function preview(msg: { type: SupportMessageType; body?: string | null }): string {
  if (msg.body?.trim()) return msg.body.trim().slice(0, 120);
  switch (msg.type) {
    case 'IMAGE':
      return '📷 Фото';
    case 'AUDIO':
      return '🎤 Голосовое сообщение';
    case 'FILE':
      return '📎 Файл';
    default:
      return '';
  }
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => SupportGateway))
    private readonly gateway: SupportGateway,
  ) {}

  // ── Сериализация ──
  private async serializeMessage(m: SupportMessage & { sender?: { id: string; name: string | null } | null }) {
    let attachmentUrl: string | null = null;
    if (m.attachmentKey) {
      try {
        attachmentUrl = await this.minio.presignedGetUrl(m.attachmentKey, ATTACHMENT_TTL);
      } catch (e) {
        this.logger.warn(`presign attachment ${m.attachmentKey}: ${(e as Error).message}`);
      }
    }
    return {
      id: m.id,
      ticketId: m.ticketId,
      senderId: m.senderId,
      senderRole: m.senderRole,
      type: m.type,
      body: m.body,
      attachment: m.attachmentKey
        ? {
            key: m.attachmentKey,
            name: m.attachmentName,
            mime: m.attachmentMime,
            size: m.attachmentSize,
            duration: m.audioDuration,
            url: attachmentUrl,
          }
        : null,
      readAt: m.readAt,
      createdAt: m.createdAt,
    };
  }

  private serializeMessages(msgs: SupportMessage[]) {
    return Promise.all(msgs.map((m) => this.serializeMessage(m)));
  }

  private serializeTicket(
    t: SupportTicket & {
      user?: { id: string; name: string | null; surname: string | null; phone: string } | null;
      agent?: { id: string; name: string | null } | null;
    },
  ) {
    return {
      id: t.id,
      subject: t.subject,
      category: t.category,
      categoryLabel: CATEGORY_LABEL[t.category] ?? t.category,
      status: t.status,
      agentId: t.agentId,
      agentName: t.agent?.name ?? null,
      lastMessageAt: t.lastMessageAt,
      lastMessagePreview: t.lastMessagePreview,
      unreadForUser: t.unreadForUser,
      unreadForAgent: t.unreadForAgent,
      createdAt: t.createdAt,
      closedAt: t.closedAt,
      user: t.user
        ? {
            id: t.user.id,
            name: [t.user.name, t.user.surname].filter(Boolean).join(' ') || t.user.phone,
            phone: t.user.phone,
          }
        : undefined,
    };
  }

  // ════════════════════════ USER ════════════════════════

  async listMyTickets(userId: string, query: ListTicketsQueryDto) {
    const where: Prisma.SupportTicketWhereInput = { userId };
    if (query.status) where.status = query.status;
    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: TICKET_PAGE,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { agent: { select: { id: true, name: true } } },
    });
    return {
      tickets: tickets.map((t) => this.serializeTicket(t)),
      nextCursor: tickets.length === TICKET_PAGE ? tickets[tickets.length - 1].id : null,
    };
  }

  private async ownedTicket(userId: string, ticketId: string) {
    const t = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!t || t.userId !== userId) throw new NotFoundException('Обращение не найдено');
    return t;
  }

  async getMyTicket(userId: string, ticketId: string) {
    const t = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
      include: { agent: { select: { id: true, name: true } } },
    });
    if (!t) throw new NotFoundException('Обращение не найдено');
    return this.serializeTicket(t);
  }

  async createTicket(userId: string, dto: CreateTicketDto) {
    const now = new Date();
    const type = attachmentType(dto.attachment?.mime);
    const firstPreview = dto.body?.trim()
      ? dto.body.trim().slice(0, 120)
      : dto.attachment
        ? preview({ type, body: null })
        : 'Новое обращение';

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject.trim(),
        category: dto.category,
        status: 'OPEN',
        lastMessageAt: now,
        lastMessagePreview: firstPreview,
        unreadForAgent: dto.body || dto.attachment ? 1 : 0,
        messages: {
          create: [
            { senderRole: 'SYSTEM', type: 'SYSTEM', body: 'Обращение создано' },
            ...(dto.body?.trim() || dto.attachment
              ? [
                  {
                    senderId: userId,
                    senderRole: 'USER' as const,
                    type,
                    body: dto.body?.trim() || null,
                    attachmentKey: dto.attachment?.key ?? null,
                    attachmentName: dto.attachment?.name ?? null,
                    attachmentMime: dto.attachment?.mime ?? null,
                    attachmentSize: dto.attachment?.size ?? null,
                    audioDuration: dto.attachment?.duration ?? null,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, surname: true, phone: true } },
      },
    });

    const serialized = this.serializeTicket(ticket);
    this.gateway.emitTicketUpdated(serialized, ticket.userId);
    if (dto.body?.trim() || dto.attachment) this.gateway.notifyAgents(serialized); // новое обращение с сообщением
    return serialized;
  }

  async listMyMessages(userId: string, ticketId: string, query: MessagesQueryDto) {
    await this.ownedTicket(userId, ticketId);
    return this.pageMessages(ticketId, query);
  }

  async sendUserMessage(userId: string, ticketId: string, dto: SendMessageDto) {
    const ticket = await this.ownedTicket(userId, ticketId);
    if (!dto.body?.trim() && !dto.attachment) {
      throw new BadRequestException('Пустое сообщение');
    }
    const type = attachmentType(dto.attachment?.mime);
    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderRole: 'USER',
        type,
        body: dto.body?.trim() || null,
        attachmentKey: dto.attachment?.key ?? null,
        attachmentName: dto.attachment?.name ?? null,
        attachmentMime: dto.attachment?.mime ?? null,
        attachmentSize: dto.attachment?.size ?? null,
        audioDuration: dto.attachment?.duration ?? null,
      },
    });

    // Пользователь написал → обращение снова ждёт оператора (OPEN), +непрочитанное оператору.
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'OPEN',
        lastMessageAt: message.createdAt,
        lastMessagePreview: preview({ type, body: message.body }),
        unreadForAgent: { increment: 1 },
        ...(ticket.closedAt ? { closedAt: null } : {}),
      },
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, surname: true, phone: true } },
      },
    });

    const msg = await this.serializeMessage(message);
    const tk = this.serializeTicket(updated);
    this.gateway.emitNewMessage(tk, msg);
    this.gateway.notifyAgents(tk); // звук/уведомление операторам
    return msg;
  }

  async markMyRead(userId: string, ticketId: string) {
    await this.ownedTicket(userId, ticketId);
    await this.prisma.$transaction([
      this.prisma.supportMessage.updateMany({
        where: { ticketId, senderRole: 'SUPPORT', readAt: null },
        data: { readAt: new Date() },
      }),
      this.prisma.supportTicket.update({ where: { id: ticketId }, data: { unreadForUser: 0 } }),
    ]);
    this.gateway.emitRead(ticketId, 'user', userId);
    return { ok: true };
  }

  async myUnreadCount(userId: string): Promise<{ count: number }> {
    const agg = await this.prisma.supportTicket.aggregate({
      where: { userId },
      _sum: { unreadForUser: true },
    });
    return { count: agg._sum.unreadForUser ?? 0 };
  }

  // ════════════════════════ AGENT ════════════════════════

  async listTickets(query: ListTicketsQueryDto, agentId: string) {
    const where: Prisma.SupportTicketWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.mine === 'true') where.agentId = agentId;
    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: TICKET_PAGE,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, surname: true, phone: true } },
      },
    });
    return {
      tickets: tickets.map((t) => this.serializeTicket(t)),
      nextCursor: tickets.length === TICKET_PAGE ? tickets[tickets.length - 1].id : null,
    };
  }

  async getTicket(ticketId: string) {
    const t = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, surname: true, phone: true } },
      },
    });
    if (!t) throw new NotFoundException('Обращение не найдено');
    return this.serializeTicket(t);
  }

  async listMessages(ticketId: string, query: MessagesQueryDto) {
    const exists = await this.prisma.supportTicket.count({ where: { id: ticketId } });
    if (!exists) throw new NotFoundException('Обращение не найдено');
    return this.pageMessages(ticketId, query);
  }

  async agentReply(agentId: string, ticketId: string, dto: SendMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Обращение не найдено');
    if (!dto.body?.trim() && !dto.attachment) throw new BadRequestException('Пустое сообщение');

    const type = attachmentType(dto.attachment?.mime);
    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: agentId,
        senderRole: 'SUPPORT',
        type,
        body: dto.body?.trim() || null,
        attachmentKey: dto.attachment?.key ?? null,
        attachmentName: dto.attachment?.name ?? null,
        attachmentMime: dto.attachment?.mime ?? null,
        attachmentSize: dto.attachment?.size ?? null,
        audioDuration: dto.attachment?.duration ?? null,
      },
    });

    // Оператор ответил → claim (если не назначен), статус PENDING (ждём пользователя),
    // оператор прочитал всё (unreadForAgent=0), пользователю +непрочитанное.
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'PENDING',
        agentId: ticket.agentId ?? agentId,
        lastMessageAt: message.createdAt,
        lastMessagePreview: preview({ type, body: message.body }),
        unreadForUser: { increment: 1 },
        unreadForAgent: 0,
      },
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, surname: true, phone: true } },
      },
    });

    const msg = await this.serializeMessage(message);
    const tk = this.serializeTicket(updated);
    this.gateway.emitNewMessage(tk, msg);

    // Уведомление (push + in-app) шлём, только если пользователь сейчас НЕ в этом чате.
    // Если чат открыт — он уже получил сообщение в реальном времени (как в Telegram).
    const inChat = await this.gateway.isUserInTicketRoom(ticket.userId, ticketId);
    if (!inChat) {
      try {
        await this.notifications.send(ticket.userId, {
          type: 'SUPPORT_REPLY',
          title: 'Поддержка SOS24',
          body: preview({ type, body: message.body }) || 'Новый ответ оператора',
          data: { screen: 'SupportChat', ticketId },
        });
      } catch (e) {
        this.logger.warn(`push поддержки для ${ticket.userId}: ${(e as Error).message}`);
      }
    }
    return msg;
  }

  async markAgentRead(ticketId: string) {
    const exists = await this.prisma.supportTicket.count({ where: { id: ticketId } });
    if (!exists) throw new NotFoundException('Обращение не найдено');
    await this.prisma.$transaction([
      this.prisma.supportMessage.updateMany({
        where: { ticketId, senderRole: 'USER', readAt: null },
        data: { readAt: new Date() },
      }),
      this.prisma.supportTicket.update({ where: { id: ticketId }, data: { unreadForAgent: 0 } }),
    ]);
    this.gateway.emitRead(ticketId, 'agent');
    return { ok: true };
  }

  async updateTicket(agentId: string, ticketId: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Обращение не найдено');

    const data: Prisma.SupportTicketUpdateInput = {};
    let systemText: string | null = null;
    if (dto.assignToMe === 'true') {
      data.agent = { connect: { id: agentId } };
    }
    if (dto.status && dto.status !== ticket.status) {
      data.status = dto.status;
      if (dto.status === 'CLOSED') {
        data.closedAt = new Date();
        systemText = 'Обращение закрыто';
      } else if (ticket.status === 'CLOSED') {
        data.closedAt = null;
        systemText = 'Обращение возобновлено';
      }
    }

    if (systemText) {
      const sys = await this.prisma.supportMessage.create({
        data: { ticketId, senderRole: 'SYSTEM', type: 'SYSTEM', body: systemText },
      });
      data.lastMessageAt = sys.createdAt;
      data.lastMessagePreview = systemText;
      const msg = await this.serializeMessage(sys);
      const updated = await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data,
        include: {
          agent: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, surname: true, phone: true } },
        },
      });
      const tk = this.serializeTicket(updated);
      this.gateway.emitNewMessage(tk, msg);
      return tk;
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data,
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, surname: true, phone: true } },
      },
    });
    const tk = this.serializeTicket(updated);
    this.gateway.emitTicketUpdated(tk, updated.userId);
    return tk;
  }

  async agentStats() {
    const [open, pending, unassigned] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'PENDING' } }),
      this.prisma.supportTicket.count({ where: { status: { not: 'CLOSED' }, agentId: null } }),
    ]);
    return { open, pending, unassigned };
  }

  // ── Доступ для gateway (проверка членства в комнате тикета) ──
  async userOwnsTicket(userId: string, ticketId: string): Promise<boolean> {
    const c = await this.prisma.supportTicket.count({ where: { id: ticketId, userId } });
    return c > 0;
  }

  // ── Пагинация сообщений (последние сверху-вниз хронологически) ──
  private async pageMessages(ticketId: string, query: MessagesQueryDto) {
    const rows = await this.prisma.supportMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_PAGE,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length === MESSAGE_PAGE;
    const nextCursor = hasMore ? rows[rows.length - 1].id : null;
    const chronological = [...rows].reverse();
    return { messages: await this.serializeMessages(chronological), nextCursor, hasMore };
  }
}
