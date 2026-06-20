import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsAdminController } from './notifications-admin.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushProcessor, PUSH_QUEUE } from './push.processor';
import { PushService } from './push.service';

// @Global — NotificationsService инжектится в любой модуль (полисы, европротокол,
// поддержка и т.д.) без повторного импорта, чтобы триггерить уведомления из событий.
@Global()
@Module({
  imports: [BullModule.registerQueue({ name: PUSH_QUEUE })],
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService, PushService, PushProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
