import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MinioService } from './minio.service';

const MAX_BYTES = 80 * 1024 * 1024; // 80 МБ (фото/видео ДТП)
const ALLOWED = /^(image\/(png|jpe?g|webp|heic)|video\/(mp4|quicktime|webm)|audio\/(mp4|m4a|x-m4a|aac|wav|x-wav|mpeg|ogg|webm)|application\/pdf)$/i;

// kind → префикс в бакете.
const KIND_PREFIX: Record<string, string> = {
  image: 'europrotocol/image',
  video: 'europrotocol/video',
  audio: 'europrotocol/audio',
  pdf: 'documents/pdf',
  doc: 'documents/doc',
  passport: 'documents/passport', // скан паспорта (фото или PDF)
};

function extFromContentType(ct: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
    'audio/mp4': '.m4a',
    'audio/m4a': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/aac': '.aac',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
    'audio/webm': '.weba',
    'application/pdf': '.pdf',
  };
  return map[ct.toLowerCase()] ?? '';
}

class PresignUploadDto {
  @IsIn(['image', 'video', 'audio', 'pdf', 'doc', 'passport'])
  kind!: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'passport';

  @IsString()
  @Matches(ALLOWED, { message: 'Недопустимый content-type (только изображения, видео, pdf)' })
  contentType!: string;
}

class PresignDownloadDto {
  // Ключи, которые мы сами генерируем: <prefix>/<uuid><ext>. Защита от обхода путей.
  @IsString()
  @Matches(/^[\w./-]{3,200}$/, { message: 'Некорректный ключ' })
  key!: string;
}

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly minio: MinioService) {}

  // ── Прямая загрузка через API (small files / dev). Файл проксируется через сервер. ──
  @Post('upload')
  @ApiOperation({ summary: 'Загрузить файл (фото/видео) в MinIO. multipart/form-data, поле "file".' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    if (!ALLOWED.test(file.mimetype)) {
      throw new BadRequestException(`Недопустимый тип: ${file.mimetype}. Только изображения, видео и pdf.`);
    }
    const kind = file.mimetype.startsWith('video/') ? 'video' : file.mimetype.startsWith('audio/') ? 'audio' : 'image';
    const key = await this.minio.put(file.buffer, file.mimetype, undefined, `europrotocol/${kind}`);
    return { key, contentType: file.mimetype, size: file.size };
  }

  // ── Безопасная прямая загрузка в s3.sos24.uz: presigned POST-policy. ──
  // Клиент НЕ получает ключей MinIO; политику (тип, размер, ключ, TTL) задаёт сервер.
  @Post('presign-upload')
  @ApiOperation({ summary: 'Получить presigned POST для прямой загрузки в MinIO (s3.sos24.uz).' })
  async presignUpload(@Body() dto: PresignUploadDto) {
    const prefix = KIND_PREFIX[dto.kind];
    const key = `${prefix}/${randomUUID()}${extFromContentType(dto.contentType)}`;
    const presigned = await this.minio.presignedUpload({
      key,
      contentType: dto.contentType,
      maxBytes: MAX_BYTES,
      expirySeconds: 600, // 10 минут
    });
    return { ...presigned, contentType: dto.contentType, maxBytes: MAX_BYTES };
  }

  // ── Временная ссылка на скачивание/чтение (presigned GET, 5 минут). ──
  @Get('presign-download')
  @ApiOperation({ summary: 'Получить presigned GET-URL для скачивания объекта (TTL 5 мин).' })
  async presignDownload(@Query() dto: PresignDownloadDto) {
    const url = await this.minio.presignedGetUrl(dto.key, 300);
    return { url, key: dto.key, expiresIn: 300 };
  }
}
