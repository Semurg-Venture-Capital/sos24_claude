import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { HealthAdminController } from './health-admin.controller';
import { HealthService } from './health.service';

// Модуль «Здоровье» (M14). PrismaModule, FilesModule (MinIO) — глобальные.
@Module({
  imports: [PrismaModule],
  controllers: [HealthController, HealthAdminController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
