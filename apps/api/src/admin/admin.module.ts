import { Module } from '@nestjs/common';
import { NappModule } from '../napp/napp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, NappModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
