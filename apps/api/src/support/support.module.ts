import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupportAdminController } from './support-admin.controller';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';

// PrismaModule, FilesModule (MinIO), NotificationsModule — глобальные.
// JwtModule нужен gateway для верификации токена в handshake.
@Module({
  imports: [JwtModule.register({})],
  controllers: [SupportController, SupportAdminController],
  providers: [SupportService, SupportGateway],
  exports: [SupportService],
})
export class SupportModule {}
