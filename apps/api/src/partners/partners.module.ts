import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnersAdminController } from './partners-admin.controller';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

// PrismaModule, FilesModule (MinIO), NotificationsModule — глобальные.
@Module({
  imports: [PrismaModule],
  controllers: [PartnersController, PartnersAdminController],
  providers: [PartnersService],
})
export class PartnersModule {}
