import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { PoliciesModule } from '../policies/policies.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [WalletModule, PoliciesModule, CardsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
