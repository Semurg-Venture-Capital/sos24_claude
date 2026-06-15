import { Global, Module } from '@nestjs/common';
import { MinioService } from './minio.service';

// Глобальный модуль файлового хранилища (MinIO) — доступен всем модулям без повторного импорта.
@Global()
@Module({
  providers: [MinioService],
  exports: [MinioService],
})
export class FilesModule {}
