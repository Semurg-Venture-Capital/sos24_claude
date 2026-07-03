import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsAdminController } from './notifications-admin.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushProcessor, PUSH_QUEUE } from './push.processor';
import { PushService } from './push.service';
import { SmsService } from './sms.service';

// @Global — NotificationsService/SmsService инжектятся в любой модуль (полисы,
// европротокол, поддержка, health и т.д.) без повторного импорта.
@Global()
@Module({
  imports: [BullModule.registerQueue({ name: PUSH_QUEUE })],
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService, PushService, PushProcessor, SmsService],
  exports: [NotificationsService, SmsService],
})
export class NotificationsModule {}
