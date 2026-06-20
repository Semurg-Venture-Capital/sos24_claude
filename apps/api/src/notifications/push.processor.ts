import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PushService, type PushPayload } from './push.service';

export const PUSH_QUEUE = 'push';

export interface PushJobData {
  userId: string;
  payload: PushPayload;
}

// Воркер очереди push: резолвит токены пользователя на момент отправки и шлёт.
// Ошибки бросаем → BullMQ повторит (attempts + exponential backoff из defaultJobOptions).
@Processor(PUSH_QUEUE)
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {
    super();
  }

  async process(job: Job<PushJobData>): Promise<void> {
    if (!this.push.enabled) return; // нет ключей — in-app уже в БД, push пропускаем
    const { userId, payload } = job.data;

    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const { invalidTokens } = await this.push.send(
      tokens.map((t) => ({ token: t.token, platform: t.platform })),
      payload,
    );
    if (invalidTokens.length) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  }
}
