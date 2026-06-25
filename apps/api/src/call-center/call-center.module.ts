import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AriService } from './ari.service';
import { AmiService } from './ami.service';
import { CallCenterController } from './call-center.controller';
import { CallCenterGateway } from './call-center.gateway';
import { CallCenterService } from './call-center.service';

// Колл-центр (Asterisk ARI + AMI). PrismaModule, FilesModule (MinIO) — глобальные.
// JwtModule нужен gateway для верификации токена оператора в handshake.
@Module({
  imports: [JwtModule.register({})],
  controllers: [CallCenterController],
  providers: [AriService, AmiService, CallCenterGateway, CallCenterService],
  exports: [CallCenterService, AriService],
})
export class CallCenterModule {}
