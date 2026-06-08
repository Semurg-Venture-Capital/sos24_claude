import { Module } from '@nestjs/common';
import { NappAuthService } from './napp-auth.service';
import { NappController } from './napp.controller';
import { NappService } from './napp.service';

@Module({
  controllers: [NappController],
  providers: [NappService, NappAuthService],
  exports: [NappService, NappAuthService],
})
export class NappModule {}
