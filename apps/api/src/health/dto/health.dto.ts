import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

// Поиск/фильтр врачей (M14.4).
export class DoctorsQueryDto {
  @ApiPropertyOptional({ description: 'Поиск по ФИО/специальности' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Фильтр по специальности (точное совпадение)' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  specialty?: string;

  @ApiPropertyOptional({ description: 'Лимит результатов', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

// Слоты врача на дату (M14.5/14.6).
export class DoctorSlotsQueryDto {
  @ApiProperty({ example: '2026-07-15', description: 'Дата YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date должна быть в формате YYYY-MM-DD' })
  date!: string;
}

// Создание записи к врачу (M14.6). Поверх PartnerBooking.
export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  doctorId!: string;

  @ApiProperty({ description: 'ISO-время слота', example: '2026-07-15T09:30:00.000Z' })
  @IsString()
  scheduledAt!: string;

  @ApiPropertyOptional({ description: 'Причина обращения / комментарий' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
