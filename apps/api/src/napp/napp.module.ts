import { Module } from '@nestjs/common';
import { NappController } from './napp.controller';
import { NappService } from './napp.service';

@Module({
  controllers: [NappController],
  providers: [NappService],
  exports: [NappService],
})
export class NappModule {}
