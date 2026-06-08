import { Module } from '@nestjs/common';
import { NappModule } from '../napp/napp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NappToolsController } from './napp-tools.controller';

@Module({
  imports: [PrismaModule, NappModule],
  controllers: [AdminController, NappToolsController],
  providers: [AdminService],
})
export class AdminModule {}
