import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Controller, Headers, HttpCode, Logger, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Job } from 'bullmq';
import type { Request } from 'express';
import { WHOOP_SYNC_QUEUE } from './whoop.config';
import { WhoopService, WhoopSyncJob, WhoopWebhookEvent } from './whoop.service';

// Приёмник вебхуков WHOOP (публичный, без JWT — аутентификация по HMAC-подписи).
// Настраивается в дашборде разработчика WHOOP: URL = https://api.sos24.uz/webhooks/whoop
@ApiTags('health')
@Controller('webhooks/whoop')
export class WhoopWebhookController {
  private readonly logger = new Logger('WhoopWebhook');

  constructor(private readonly service: WhoopService) {}

  @Post()
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-whoop-signature') signature?: string,
    @Headers('x-whoop-signature-timestamp') timestamp?: string,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    if (!this.service.verifySignature(raw, signature, timestamp)) {
      this.logger.warn('WHOOP webhook: неверная подпись — отклонено');
      throw new UnauthorizedException('bad signature');
    }
    await this.service.handleWebhook(req.body as WhoopWebhookEvent);
    return { ok: true };
  }
}

// Воркер очереди синхронизации: по событию вебхука подтягивает свежие метрики WHOOP.
// Ошибку бросаем → BullMQ повторит (attempts + backoff из defaultJobOptions).
@Processor(WHOOP_SYNC_QUEUE)
export class WhoopSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(WhoopSyncProcessor.name);

  constructor(private readonly service: WhoopService) {
    super();
  }

  async process(job: Job<WhoopSyncJob>): Promise<void> {
    if (job.name === 'backfill') {
      await this.service.backfill(job.data.userId);
      this.logger.log(`WHOOP backfill выполнен для user=${job.data.userId}`);
      return;
    }
    await this.service.sync(job.data.userId);
    this.logger.log(`WHOOP sync выполнена для user=${job.data.userId}`);
  }
}
