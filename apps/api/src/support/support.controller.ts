import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  CreateTicketDto,
  ListTicketsQueryDto,
  MessagesQueryDto,
  SendMessageDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Мои обращения (список, пагинация курсором).' })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListTicketsQueryDto) {
    return this.support.listMyTickets(user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Сумма непрочитанных по всем обращениям (бейдж).' })
  unread(@CurrentUser() user: JwtPayload) {
    return this.support.myUnreadCount(user.sub);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Создать обращение (+первое сообщение).' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTicketDto) {
    return this.support.createTicket(user.sub, dto);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Детали обращения.' })
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.support.getMyTicket(user.sub, id);
  }

  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'Сообщения обращения (пагинация курсором, старые при скролле).' })
  messages(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Query() query: MessagesQueryDto) {
    return this.support.listMyMessages(user.sub, id, query);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Отправить сообщение в обращение.' })
  send(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.support.sendUserMessage(user.sub, id, dto);
  }

  @Post('tickets/:id/read')
  @ApiOperation({ summary: 'Отметить сообщения оператора прочитанными.' })
  read(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.support.markMyRead(user.sub, id);
  }
}
