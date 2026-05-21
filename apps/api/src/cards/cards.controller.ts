import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Карты пользователя.' })
  list(@CurrentUser() user: JwtPayload) {
    return this.cards.list(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить карту (mock-tokenization).' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCardDto) {
    return this.cards.create(user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.cards.remove(user.sub, id);
  }
}
