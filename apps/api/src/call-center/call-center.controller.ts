import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupportGuard } from '../support/support.guard';
import { AttachTicketDto } from './dto/call-center.dto';
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
  @ApiOperation({ summary: 'Привязать звонок к заявке + заметка оператора.' })
  attachTicket(@Param('id') id: string, @Body() dto: AttachTicketDto) {
    return this.service.attachTicket(id, dto.ticketId ?? null, dto.note);
  }
}
