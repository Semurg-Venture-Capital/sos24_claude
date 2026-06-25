import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupportGuard } from '../support/support.guard';
import { AttachTicketDto, CreateCallTicketDto, PauseDto } from './dto/call-center.dto';
import { CallCenterService } from './call-center.service';

// Рабочее место оператора колл-центра в админке. Доступ: SUPPORT или ADMIN.
@ApiTags('admin-call-center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SupportGuard)
@Controller('admin/call-center')
export class CallCenterController {
  constructor(private readonly service: CallCenterService) {}

  @Get('health')
  @ApiOperation({ summary: 'Состояние ARI-подключения (enabled/connected).' })
  health() {
    return this.service.health();
  }

  @Get('sip-credentials')
  @ApiOperation({ summary: 'SIP-креды для браузерного софтфона оператора (WebRTC/WSS).' })
  sipCredentials(@CurrentUser() user: JwtPayload) {
    return this.service.sipCredentials(user.sub);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Статус очереди: ожидающие/доступные операторы (AMI).' })
  queue() {
    return this.service.queueStatus();
  }

  @Post('operator/pause')
  @ApiOperation({ summary: 'Поставить оператора на перерыв / снять (пауза в очереди).' })
  pause(@CurrentUser() user: JwtPayload, @Body() dto: PauseDto) {
    return this.service.setOperatorPaused(user.sub, dto.paused);
  }

  @Get('calls')
  @ApiOperation({ summary: 'Журнал звонков (фильтры status, operatorId).' })
  list(@Query('status') status?: string, @Query('operatorId') operatorId?: string) {
    return this.service.list({ status, operatorId });
  }

  @Get('calls/:id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get('calls/:id/recording')
  @ApiOperation({ summary: 'Временная ссылка на запись разговора.' })
  recording(@Param('id') id: string) {
    return this.service.recordingUrl(id);
  }

  @Patch('calls/:id/ticket')
  @ApiOperation({ summary: 'Привязать звонок к существующей заявке + заметка оператора.' })
  attachTicket(@Param('id') id: string, @Body() dto: AttachTicketDto) {
    return this.service.attachTicket(id, dto.ticketId ?? null, dto.note);
  }

  @Post('calls/:id/ticket')
  @ApiOperation({ summary: 'Создать новую заявку поддержки по звонку (омниканальность).' })
  createTicket(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateCallTicketDto,
  ) {
    return this.service.createTicketFromCall(id, user.sub, dto);
  }
}
