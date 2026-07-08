import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { HealthAdminController } from './health-admin.controller';
import { HealthService } from './health.service';
import { WHOOP_SYNC_QUEUE } from './wearables/whoop/whoop.config';
import { WhoopController, WhoopCallbackController } from './wearables/whoop/whoop.controller';
import { WhoopService } from './wearables/whoop/whoop.service';
import { WhoopWebhookController, WhoopSyncProcessor } from './wearables/whoop/whoop.webhook';

// Модуль «Здоровье» (M14). PrismaModule, FilesModule (MinIO) — глобальные.
@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: WHOOP_SYNC_QUEUE })],
  controllers: [HealthController, HealthAdminController, WhoopController, WhoopCallbackController, WhoopWebhookController],
  providers: [HealthService, WhoopService, WhoopSyncProcessor],
  exports: [HealthService],
})
export class HealthModule {}
