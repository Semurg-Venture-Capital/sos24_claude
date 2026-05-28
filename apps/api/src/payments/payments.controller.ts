import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PayPolicyDto } from './dto/pay-policy.dto';
import { PaymentsService } from './payments.service';

class InitGatewayDto {
  @ApiProperty()
  @IsString()
  policyId!: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('uzcard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Оплата полиса (mock Uzcard / Humo).' })
  pay(@CurrentUser() user: JwtPayload, @Body() dto: PayPolicyDto) {
    return this.payments.payForPolicy(user.sub, dto);
  }

  @Post('payme/init')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Инициализация оплаты через Payme. Возвращает redirect URL.' })
  initPayme(@CurrentUser() user: JwtPayload, @Body() dto: InitGatewayDto) {
    return this.payments.initPayme(user.sub, dto.policyId);
  }

  @Post('click/init')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Инициализация оплаты через Click. Возвращает redirect URL.' })
  initClick(@CurrentUser() user: JwtPayload, @Body() dto: InitGatewayDto) {
    return this.payments.initClick(user.sub, dto.policyId);
  }

  @Post('payme/callback')
  @ApiOperation({ summary: 'Webhook от Payme (JSON-RPC). Публичный — защищён Basic Auth в реале.' })
  paymeCallback(@Body() body: Record<string, unknown>) {
    return this.payments.handlePaymeCallback(body);
  }

  @Post('click/callback')
  @ApiOperation({ summary: 'Webhook от Click. Публичный.' })
  clickCallback(@Body() body: Record<string, string>) {
    return this.payments.handleClickCallback(body);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'История платежей пользователя.' })
  history(@CurrentUser() user: JwtPayload) {
    return this.payments.getUserPayments(user.sub);
  }
}
