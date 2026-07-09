import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Запрос транскрипции голосового «Изоҳ»: ключ уже загруженного в MinIO аудио.
export class TranscribeRemarksDto {
  @ApiProperty({ description: 'Ключ аудиофайла в хранилище (MinIO)' })
  @IsString()
  @MaxLength(300)
  audioKey!: string;

  @ApiPropertyOptional({ description: 'MIME-тип аудио (напр. audio/mp4, audio/m4a, audio/wav)' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  mimeType?: string;
}
