import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { HealthAdminController } from './health-admin.controller';
import { HealthService } from './health.service';
import { WhoopController, WhoopCallbackController } from './wearables/whoop/whoop.controller';
import { WhoopService } from './wearables/whoop/whoop.service';

// Модуль «Здоровье» (M14). PrismaModule, FilesModule (MinIO) — глобальные.
@Module({
  imports: [PrismaModule],
  controllers: [HealthController, HealthAdminController, WhoopController, WhoopCallbackController],
  providers: [HealthService, WhoopService],
  exports: [HealthService],
})
export class HealthModule {}
