import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { PartnersModule } from '../partners/partners.module';
import { PartnerPortalController } from './partner-portal.controller';
import { PartnerPortalService } from './partner-portal.service';

// B2B-кабинет (partner.sos24.uz). Переиспользует InsuranceService и PartnersService.
// PrismaModule, FilesModule (MinIO) — глобальные.
@Module({
  imports: [PrismaModule, InsuranceModule, PartnersModule],
  controllers: [PartnerPortalController],
  providers: [PartnerPortalService],
})
export class PartnerPortalModule {}
