import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportCategory, SupportTicketStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Описание вложения (после presigned-загрузки в MinIO клиент присылает ключ).
export class AttachmentDto {
  @ApiProperty({ description: 'Ключ объекта в MinIO (из presign-upload)' })
  @IsString()
  @MaxLength(200)
  key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ description: 'MIME-тип, напр. image/jpeg' })
  @IsString()
  @MaxLength(100)
  mime!: string;

  @ApiPropertyOptional({ description: 'Размер в байтах' })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({ description: 'Длительность аудио в секундах' })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}

export class CreateTicketDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ enum: SupportCategory })
  @IsEnum(SupportCategory)
  category!: SupportCategory;

  @ApiPropertyOptional({ description: 'Первое сообщение (текст)' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ type: AttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;
}

export class SendMessageDto {
  @ApiPropertyOptional({ description: 'Текст сообщения' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ type: AttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;
}

export class ListTicketsQueryDto {
  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({ description: 'Только назначенные мне (для оператора)' })
  @IsOptional()
  @IsString()
  mine?: string;

  @ApiPropertyOptional({ description: 'Курсор: id последнего тикета предыдущей страницы' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class MessagesQueryDto {
  @ApiPropertyOptional({ description: 'Курсор: id самого старого загруженного сообщения (грузим более старые)' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({ description: 'Назначить себе (claim)' })
  @IsOptional()
  @IsString()
  assignToMe?: string;
}
