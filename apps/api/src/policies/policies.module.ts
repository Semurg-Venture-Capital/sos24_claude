import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PromoModule } from '../promo/promo.module';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import {
  POLICY_MAINT_QUEUE,
  PolicyMaintenanceProcessor,
  PolicyMaintenanceScheduler,
} from './policy-maintenance';

@Module({
  imports: [PromoModule, BullModule.registerQueue({ name: POLICY_MAINT_QUEUE })],
  controllers: [PoliciesController],
  providers: [PoliciesService, PolicyMaintenanceProcessor, PolicyMaintenanceScheduler],
  exports: [PoliciesService],
})
export class PoliciesModule {}
