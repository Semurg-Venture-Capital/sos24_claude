import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PayPolicyDto } from './dto/pay-policy.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('uzcard')
  @ApiOperation({
    summary: 'Оплата полиса (mock Uzcard).',
    description:
      'Имитирует платёжный шлюз. 1.5с задержка, ~90% — успех (полис → ACTIVE), ~10% — отказ. ' +
      'При method=WALLET списывает с баланса кошелька (insufficient → fail).',
  })
  pay(@CurrentUser() user: JwtPayload, @Body() dto: PayPolicyDto) {
    return this.payments.payForPolicy(user.sub, dto);
  }
}
