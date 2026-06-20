import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

// @Global — NotificationsService инжектится в любой модуль (полисы, европротокол,
// поддержка и т.д.) без повторного импорта, чтобы триггерить уведомления из событий.
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
