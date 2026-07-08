import { Controller, Delete, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import type { JwtPayload } from '../../../auth/jwt.strategy';
import { WhoopService } from './whoop.service';

// Защищённые операции носимого устройства (под JWT).
@ApiTags('health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health/wearable')
export class WhoopController {
  constructor(private readonly service: WhoopService) {}

  @Get()
  @ApiOperation({ summary: 'Статус подключения носимого устройства + последние метрики.' })
  status(@CurrentUser() user: JwtPayload) {
    return this.service.getStatus(user.sub);
  }

  @Post('whoop/connect')
  @ApiOperation({ summary: 'Начать подключение WHOOP — вернуть OAuth-ссылку.' })
  connect(@CurrentUser() user: JwtPayload) {
    return this.service.startConnect(user.sub);
  }

  @Post('whoop/sync')
  @ApiOperation({ summary: 'Синхронизировать метрики WHOOP сейчас.' })
  sync(@CurrentUser() user: JwtPayload) {
    return this.service.sync(user.sub);
  }

  @Delete('whoop')
  @ApiOperation({ summary: 'Отключить WHOOP.' })
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.service.disconnect(user.sub);
  }
}

// Публичный callback OAuth (браузер, без JWT — авторизация внутри state).
@ApiTags('health')
@Controller('health/wearable/whoop')
export class WhoopCallbackController {
  constructor(private readonly service: WhoopService) {}

  @Get('callback')
  @ApiExcludeEndpoint()
  async callback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    const deeplink = await this.service.handleCallback(code, state, error);
    res.redirect(deeplink);
  }
}
