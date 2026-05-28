import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdjusterController } from './adjuster.controller';
import { AdjusterService } from './adjuster.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdjusterController],
  providers: [AdjusterService],
})
export class AdjusterModule {}
