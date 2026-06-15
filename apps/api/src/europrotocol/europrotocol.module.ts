import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MyidModule } from '../myid/myid.module';
import { NappModule } from '../napp/napp.module';
import { EuroprotocolAdminController } from './europrotocol-admin.controller';
import { EuroprotocolPdfService } from './europrotocol-pdf.service';
import { EuroprotocolController } from './europrotocol.controller';
import { EuroprotocolService } from './europrotocol.service';

@Module({
  imports: [PrismaModule, MyidModule, NappModule],
  controllers: [EuroprotocolController, EuroprotocolAdminController],
  providers: [EuroprotocolService, EuroprotocolPdfService],
})
export class EuroprotocolModule {}
