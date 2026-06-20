import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AdjusterModule } from './adjuster/adjuster.module';
import { AuthModule } from './auth/auth.module';
import { PartnersModule } from './partners/partners.module';
import { CardsModule } from './cards/cards.module';
import { DocumentsModule } from './documents/documents.module';
import { DriversModule } from './drivers/drivers.module';
import { EuroprotocolModule } from './europrotocol/europrotocol.module';
import { FilesModule } from './files/files.module';
import { InsuranceModule } from './insurance/insurance.module';
import { MyidModule } from './myid/myid.module';
import { NappModule } from './napp/napp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PoliciesModule } from './policies/policies.module';
import { PrismaModule } from './prisma/prisma.module';
import { PromoModule } from './promo/promo.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FilesModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    DocumentsModule,
    DriversModule,
    PromoModule,
    PoliciesModule,
    InsuranceModule,
    CardsModule,
    WalletModule,
    PaymentsModule,
    NappModule,
    MyidModule,
    AdminModule,
    AdjusterModule,
    PartnersModule,
    EuroprotocolModule,
  ],
})
export class AppModule {}
