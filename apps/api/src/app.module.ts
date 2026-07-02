import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FaviconController } from './common/favicon.controller';
import { BullModule } from '@nestjs/bullmq';
import { AdminModule } from './admin/admin.module';
import { AdjusterModule } from './adjuster/adjuster.module';
import { AuthModule } from './auth/auth.module';
import { PartnersModule } from './partners/partners.module';
import { PartnerPortalModule } from './partner-portal/partner-portal.module';
import { CallCenterModule } from './call-center/call-center.module';
import { CardsModule } from './cards/cards.module';
import { DocumentsModule } from './documents/documents.module';
import { DriversModule } from './drivers/drivers.module';
import { EuroprotocolModule } from './europrotocol/europrotocol.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { InsuranceModule } from './insurance/insurance.module';
import { MyidModule } from './myid/myid.module';
import { NappModule } from './napp/napp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PoliciesModule } from './policies/policies.module';
import { PrismaModule } from './prisma/prisma.module';
import { PromoModule } from './promo/promo.module';
import { SupportModule } from './support/support.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379' },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 1000,
          removeOnFail: 5000, // держим упавшие задачи (разбор/DLQ)
        },
      }),
    }),
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
    PartnerPortalModule,
    EuroprotocolModule,
    SupportModule,
    CallCenterModule,
    HealthModule,
  ],
  controllers: [FaviconController],
})
export class AppModule {}
