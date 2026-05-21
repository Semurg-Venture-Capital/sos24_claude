import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Баланс + последние транзакции.' })
  async get(@CurrentUser() user: JwtPayload) {
    const w = await this.wallet.getOrCreate(user.sub);
    const transactions = await this.wallet.getTransactions(w.id);
    return { id: w.id, balance: w.balance, transactions };
  }

  @Post('topup')
  @ApiOperation({ summary: 'Пополнить кошелёк (mock — без реальной оплаты).' })
  topup(@CurrentUser() user: JwtPayload, @Body() dto: TopupWalletDto) {
    return this.wallet.topup(user.sub, dto.amount);
  }
}
