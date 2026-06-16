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
  // Внутренний клиент — серверные операции (put/get/remove) через адрес в кластере.
  private readonly client: Client;
  // Публичный клиент — генерация presigned-URL под внешний хост (s3.sos24.uz),
  // чтобы подпись SigV4 совпадала с хостом, к которому реально ходит клиент.
  private readonly publicClient: Client;
  readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'sos24';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY') ?? 'sos24';
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY') ?? 'sos24minio';
    // region задаём явно → presigned-policy считается ЛОКАЛЬНО, без сетевого region-lookup
    // к endpoint (иначе сервер пытается TLS-коннект к публичному s3 и падает на цепочке).
    const region = this.config.get<string>('MINIO_REGION') ?? 'us-east-1';
    this.client = new Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: Number(this.config.get<string>('MINIO_PORT') ?? 9000),
      useSSL: (this.config.get<string>('MINIO_USE_SSL') ?? 'false') === 'true',
      region,
      accessKey,
      secretKey,
    });

    // MINIO_PUBLIC_ENDPOINT, напр. "https://s3.sos24.uz". Если не задан —
    // presigned-URL генерируются на внутренний адрес (ок для dev через API-прокси).
    const pub = this.config.get<string>('MINIO_PUBLIC_ENDPOINT');
    if (pub) {
      const u = new URL(pub);
      this.publicClient = new Client({
        endPoint: u.hostname,
        port: u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80,
        useSSL: u.protocol === 'https:',
        region,
        accessKey,
        secretKey,
      });
    } else {
      this.publicClient = this.client;
    }
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

  /** Временная ссылка на скачивание (presigned GET) под публичным хостом. expiry в секундах. */
  presignedGetUrl(key: string, expirySeconds = 300): Promise<string> {
    return this.publicClient.presignedGetObject(this.bucket, key, expirySeconds);
  }

  /**
   * Безопасная прямая загрузка с клиента: presigned POST-policy.
   * Политику задаёт СЕРВЕР — клиент не может её обойти:
   *   - конкретный объектный key (префикс выбираем сами),
   *   - точный content-type,
   *   - лимит размера [1, maxBytes],
   *   - срок жизни expirySeconds.
   * Возвращает { url, fields, key }: клиент делает multipart POST на url с fields + поле "file".
   */
  async presignedUpload(opts: {
    key: string;
    contentType: string;
    maxBytes: number;
    expirySeconds?: number;
  }): Promise<{ url: string; fields: Record<string, string>; key: string }> {
    const policy = this.publicClient.newPostPolicy();
    policy.setBucket(this.bucket);
    policy.setKey(opts.key);
    policy.setExpires(new Date(Date.now() + (opts.expirySeconds ?? 600) * 1000));
    policy.setContentType(opts.contentType);
    policy.setContentLengthRange(1, opts.maxBytes);
    const { postURL, formData } = await this.publicClient.presignedPostPolicy(policy);
    return { url: postURL, fields: formData as Record<string, string>, key: opts.key };
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
