import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt.strategy';

const OPERATORS_ROOM = 'cc:operators';

// Namespace /calls — realtime для операторов колл-центра (входящий звонок, screen pop,
// обновление статуса звонка). Авторизация по JWT в handshake. Масштабируется через
// Redis-адаптер (см. main.ts). Только SUPPORT/ADMIN попадают в комнату операторов.
@WebSocketGateway({ namespace: '/calls', cors: { origin: true, credentials: true } })
export class CallCenterGateway implements OnGatewayConnection {
  private readonly logger = new Logger(CallCenterGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
      if (payload.role !== 'SUPPORT' && payload.role !== 'ADMIN') throw new Error('not an operator');
      client.data = { userId: payload.sub, role: payload.role };
      client.join(OPERATORS_ROOM);
      client.join(`cc:op:${payload.sub}`);
    } catch (e) {
      this.logger.debug(`socket auth failed: ${(e as Error).message}`);
      client.disconnect(true);
    }
  }

  // Всем операторам: новый входящий звонок + данные для screen pop.
  emitIncoming(payload: unknown) {
    this.server?.to(OPERATORS_ROOM).emit('call:incoming', payload);
  }

  // Обновление состояния звонка (принят/завершён/запись готова).
  emitUpdate(payload: unknown) {
    this.server?.to(OPERATORS_ROOM).emit('call:update', payload);
  }

  // Адресно конкретному оператору.
  emitToOperator(operatorId: string, event: string, payload: unknown) {
    this.server?.to(`cc:op:${operatorId}`).emit(event, payload);
  }
}
