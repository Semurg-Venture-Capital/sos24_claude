import { Module } from '@nestjs/common';
import { NappAuthService } from './napp-auth.service';
import { NappReferenceService } from './napp-reference.service';
import { NappController } from './napp.controller';
import { NappService } from './napp.service';

@Module({
  controllers: [NappController],
  providers: [NappService, NappAuthService, NappReferenceService],
  exports: [NappService, NappAuthService, NappReferenceService],
})
export class NappModule {}
