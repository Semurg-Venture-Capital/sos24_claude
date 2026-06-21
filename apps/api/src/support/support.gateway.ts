import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt.strategy';
import { SupportService } from './support.service';

interface SocketData {
  userId: string;
  role: JwtPayload['role'];
}

const AGENTS_ROOM = 'support:agents';
const userRoom = (id: string) => `user:${id}`;
const ticketRoom = (id: string) => `ticket:${id}`;

// Namespace /support. Realtime-доставка сообщений и обновлений тикетов.
// Авторизация по JWT в handshake (auth.token). Масштабируется на несколько
// реплик через Redis-адаптер (см. main.ts).
@WebSocketGateway({ namespace: '/support', cors: { origin: true, credentials: true } })
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SupportGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => SupportService))
    private readonly service: SupportService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.query?.token as string | undefined) ||
        (client.handshake.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');
      if (!token) throw new Error('no token');
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      const data: SocketData = { userId: payload.sub, role: payload.role };
      client.data = data;
      client.join(userRoom(payload.sub));
      if (payload.role === 'SUPPORT' || payload.role === 'ADMIN') {
        client.join(AGENTS_ROOM);
      }
    } catch (e) {
      this.logger.debug(`socket auth failed: ${(e as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // Комнаты очищаются socket.io автоматически.
  }

  @SubscribeMessage('ticket:join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId?: string }) {
    const data = client.data as SocketData;
    const ticketId = body?.ticketId;
    if (!ticketId || !data) return { ok: false };
    const isAgent = data.role === 'SUPPORT' || data.role === 'ADMIN';
    if (!isAgent) {
      const owns = await this.service.userOwnsTicket(data.userId, ticketId);
      if (!owns) return { ok: false };
    }
    client.join(ticketRoom(ticketId));
    return { ok: true };
  }

  @SubscribeMessage('ticket:leave')
  onLeave(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId?: string }) {
    if (body?.ticketId) client.leave(ticketRoom(body.ticketId));
    return { ok: true };
  }

  @SubscribeMessage('typing')
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() body: { ticketId?: string }) {
    const data = client.data as SocketData;
    if (!body?.ticketId || !data) return;
    const who = data.role === 'USER' ? 'user' : 'agent';
    client.to(ticketRoom(body.ticketId)).emit('typing', { ticketId: body.ticketId, who });
  }

  // ── Эмиттеры, вызываемые из сервиса ──

  // Новое сообщение → тем, кто в чате (ticket room) и владельцу (user room).
  // Плюс обновляем списки (ticket:updated) у владельца и операторов.
  emitNewMessage(ticket: { id: string; userId?: string } & Record<string, unknown>, message: unknown) {
    if (!this.server) return;
    const ownerId = (ticket as { user?: { id: string } }).user?.id;
    let chan = this.server.to(ticketRoom(ticket.id));
    if (ownerId) chan = chan.to(userRoom(ownerId));
    chan.emit('message:new', { ticketId: ticket.id, message });
    this.emitTicketUpdated(ticket, ownerId);
  }

  // Сигнал операторам о новом сообщении пользователя (звук/десктоп-уведомление в админке).
  // Шлём всем операторам; клиент сам решает, звучать ли (зависит от открытого тикета/фокуса).
  notifyAgents(ticket: Record<string, unknown> & { id: string }) {
    if (!this.server) return;
    this.server.to(AGENTS_ROOM).emit('agent:notify', { ticket });
  }

  emitTicketUpdated(ticket: Record<string, unknown> & { id: string }, ownerId?: string) {
    if (!this.server) return;
    const uid = ownerId ?? (ticket as { user?: { id: string } }).user?.id;
    let chan = this.server.to(AGENTS_ROOM);
    if (uid) chan = chan.to(userRoom(uid));
    chan.emit('ticket:updated', { ticket });
  }

  emitRead(ticketId: string, by: 'user' | 'agent', _userId?: string) {
    if (!this.server) return;
    this.server.to(ticketRoom(ticketId)).emit('message:read', { ticketId, by });
  }

  // Открыт ли у пользователя сейчас чат этого тикета (он в комнате тикета).
  // Через Redis-адаптер fetchSockets() видит сокеты со всех реплик.
  async isUserInTicketRoom(userId: string, ticketId: string): Promise<boolean> {
    if (!this.server) return false;
    try {
      const sockets = await this.server.in(ticketRoom(ticketId)).fetchSockets();
      return sockets.some((s) => (s.data as SocketData)?.userId === userId);
    } catch {
      return false;
    }
  }
}
