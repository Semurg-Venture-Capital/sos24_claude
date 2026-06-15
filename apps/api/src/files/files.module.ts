import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MinioService } from './minio.service';

// Глобальный модуль файлового хранилища (MinIO) — доступен всем модулям без повторного импорта.
@Global()
@Module({
  controllers: [FilesController],
  providers: [MinioService],
  exports: [MinioService],
})
export class FilesModule {}
