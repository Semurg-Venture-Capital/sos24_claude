import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { NotificationsService } from './notifications.service';

class BroadcastDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  body!: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

@ApiTags('admin-notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/notifications')
export class NotificationsAdminController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('broadcast')
  @ApiOperation({ summary: 'Отправить уведомление всем пользователям (in-app + push).' })
  broadcast(@Body() dto: BroadcastDto) {
    return this.notifications.broadcast(dto);
  }
}
