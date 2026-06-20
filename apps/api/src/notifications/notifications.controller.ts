import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // ── Уведомления ──
  @Get('notifications')
  @ApiOperation({ summary: 'Список уведомлений пользователя.' })
  list(@CurrentUser() user: JwtPayload) {
    return this.notifications.list(user.sub);
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Количество непрочитанных (для бейджа).' })
  unread(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user.sub);
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Отметить все как прочитанные.' })
  readAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Отметить уведомление прочитанным.' })
  read(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notifications.markRead(user.sub, id);
  }

  @Delete('notifications/:id')
  @ApiOperation({ summary: 'Удалить уведомление.' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notifications.remove(user.sub, id);
  }

  // ── Push-токены устройств ──
  @Post('devices')
  @ApiOperation({ summary: 'Зарегистрировать push-токен устройства.' })
  register(@CurrentUser() user: JwtPayload, @Body() dto: RegisterDeviceDto) {
    return this.notifications.registerToken(user.sub, dto.token, dto.platform);
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Удалить push-токен устройства (logout).' })
  unregister(@CurrentUser() user: JwtPayload, @Param('token') token: string) {
    return this.notifications.unregisterToken(user.sub, token);
  }
}
