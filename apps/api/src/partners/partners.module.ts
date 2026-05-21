import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  imports: [PrismaModule],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
