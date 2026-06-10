import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MyidModule } from '../myid/myid.module';
import { NappModule } from '../napp/napp.module';
import { EuroprotocolController } from './europrotocol.controller';
import { EuroprotocolService } from './europrotocol.service';

@Module({
  imports: [PrismaModule, MyidModule, NappModule],
  controllers: [EuroprotocolController],
  providers: [EuroprotocolService],
})
export class EuroprotocolModule {}
