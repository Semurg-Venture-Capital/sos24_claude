import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  ListTicketsQueryDto,
  MessagesQueryDto,
  SendMessageDto,
  UpdateTicketDto,
} from './dto/support.dto';
import { SupportGuard } from './support.guard';
import { SupportService } from './support.service';

@ApiTags('admin-support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SupportGuard)
@Controller('admin/support')
export class SupportAdminController {
  constructor(private readonly support: SupportService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Счётчики обращений (открытые/в ожидании/без оператора).' })
  stats() {
    return this.support.agentStats();
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Все обращения (фильтры: status, mine=true; пагинация курсором).' })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListTicketsQueryDto) {
    return this.support.listTickets(query, user.sub);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Детали обращения.' })
  get(@Param('id') id: string) {
    return this.support.getTicket(id);
  }

  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'Сообщения обращения (пагинация курсором).' })
  messages(@Param('id') id: string, @Query() query: MessagesQueryDto) {
    return this.support.listMessages(id, query);
  }

  @Post('tickets/:id/reply')
  @ApiOperation({ summary: 'Ответить пользователю (claim тикета при первом ответе).' })
  reply(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.support.agentReply(user.sub, id, dto);
  }

  @Post('tickets/:id/read')
  @ApiOperation({ summary: 'Отметить сообщения пользователя прочитанными.' })
  read(@Param('id') id: string) {
    return this.support.markAgentRead(id);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Сменить статус / назначить себе (assignToMe=true).' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.support.updateTicket(user.sub, id, dto);
  }
}
