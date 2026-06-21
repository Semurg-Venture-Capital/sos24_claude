import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { ServerOptions } from 'socket.io';

// Socket.IO-адаптер с Redis pub/sub — чтобы события доходили между репликами API.
// Без Redis (или если он недоступен) gracefully падаем на in-memory адаптер.
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connect(redisUrl: string): Promise<void> {
    try {
      const pub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: null });
      const sub = pub.duplicate();
      await pub.connect();
      await sub.connect();
      this.adapterConstructor = createAdapter(pub, sub);
      this.logger.log('Socket.IO Redis-адаптер подключён');
    } catch (e) {
      this.logger.warn(`Redis-адаптер недоступен, in-memory режим: ${(e as Error).message}`);
    }
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      (server as { adapter: (a: unknown) => void }).adapter(this.adapterConstructor);
    }
    return server;
  }
}
