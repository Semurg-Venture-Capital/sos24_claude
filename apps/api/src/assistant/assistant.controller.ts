import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AssistantService } from './assistant.service';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  // Категория из тапнутого чипа (биас; в v1 не влияет на логику, но принимаем).
  @IsOptional()
  @IsString()
  category?: string;
}

// SOS-ассистент (ИИ-роутер). См. docs/SOS_ASSISTANT_SPEC.md.
@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Get('session')
  @ApiOperation({ summary: 'Восстановить последнюю сессию SOS-ассистента.' })
  session(@CurrentUser() user: JwtPayload) {
    return this.service.getSession(user.sub);
  }

  @Post('message')
  @ApiOperation({ summary: 'Отправить сообщение ассистенту → ответ + предложенные действия.' })
  message(@CurrentUser() user: JwtPayload, @Body() dto: SendMessageDto) {
    return this.service.sendMessage(user.sub, dto.text, dto.sessionId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Начать сначала — новая сессия.' })
  reset(@CurrentUser() user: JwtPayload) {
    return this.service.reset(user.sub);
  }
}
