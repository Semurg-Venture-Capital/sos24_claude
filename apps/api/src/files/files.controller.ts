import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MinioService } from './minio.service';

const MAX_BYTES = 80 * 1024 * 1024; // 80 МБ (фото/видео ДТП)
const ALLOWED = /^(image\/(png|jpe?g|webp|heic)|video\/(mp4|quicktime|webm))$/i;

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly minio: MinioService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить файл (фото/видео) в MinIO. multipart/form-data, поле "file".' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    if (!ALLOWED.test(file.mimetype)) {
      throw new BadRequestException(`Недопустимый тип: ${file.mimetype}. Только изображения и видео.`);
    }
    const kind = file.mimetype.startsWith('video/') ? 'video' : 'image';
    const key = await this.minio.put(file.buffer, file.mimetype, undefined, `europrotocol/${kind}`);
    return { key, contentType: file.mimetype, size: file.size };
  }
}
