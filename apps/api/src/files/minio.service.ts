import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';

/**
 * MinioService — обёртка над self-hosted S3 (MinIO).
 * Хранит файлы платформы: подписи/схемы/фото Европротокола, документы, PDF и т.д.
 * Бакет создаётся автоматически при старте.
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Client;
  readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'sos24';
    this.client = new Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: Number(this.config.get<string>('MINIO_PORT') ?? 9000),
      useSSL: (this.config.get<string>('MINIO_USE_SSL') ?? 'false') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY') ?? 'sos24',
      secretKey: this.config.get<string>('MINIO_SECRET_KEY') ?? 'sos24minio',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, '');
        this.logger.log(`MinIO bucket "${this.bucket}" создан`);
      }
    } catch (e) {
      // Не валим приложение, если MinIO недоступен на старте (dev без поднятого контейнера).
      this.logger.warn(`MinIO недоступен при старте: ${(e as Error).message}`);
    }
  }

  /**
   * Загрузить объект. key — путь в бакете (напр. "europrotocol/<id>/sign-a.png").
   * Если key не задан — генерируется в prefix/<uuid>.<ext>.
   * Возвращает финальный key.
   */
  async put(buffer: Buffer, contentType: string, key?: string, prefix = 'misc'): Promise<string> {
    const objectKey = key ?? `${prefix}/${randomUUID()}${extFromContentType(contentType)}`;
    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    return objectKey;
  }

  /** Скачать объект в Buffer. */
  async get(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  }

  /** Временная ссылка на скачивание (presigned GET). expiry в секундах (по умолч. 1 час). */
  presignedGetUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  /** Временная ссылка на загрузку напрямую с клиента (presigned PUT). */
  presignedPutUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedPutObject(this.bucket, key, expirySeconds);
  }

  async remove(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}

function extFromContentType(ct: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return map[ct] ?? '';
}
