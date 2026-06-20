import { Module } from '@nestjs/common';
import { InsuranceAdminController } from './insurance-admin.controller';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';

// Каталог страховых компаний, продуктов и тарифных планов.
// Prisma и MinIO доступны глобально (PrismaModule, FilesModule — @Global).
@Module({
  controllers: [InsuranceController, InsuranceAdminController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
