import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
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

// Сохранение мед.карты (M14.10). Чувствительные поля шифруются на бэкенде.
export class UpdateMedicalProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional({ description: 'Дата рождения, свободный формат' }) @IsOptional() @IsString() @MaxLength(40) birthDate?: string;
  @ApiPropertyOptional({ enum: ['M', 'F'] }) @IsOptional() @IsIn(['M', 'F']) gender?: 'M' | 'F';
  @ApiPropertyOptional({ example: 'B(III) Rh+' }) @IsOptional() @IsString() @MaxLength(20) bloodType?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(30) @Max(260) heightCm?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(2) @Max(400) weightKg?: number;

  @ApiPropertyOptional({ type: [String], description: 'Аллергии (массив)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ description: 'Хронические заболевания' }) @IsOptional() @IsString() @MaxLength(1000) chronic?: string;
  @ApiPropertyOptional({ description: 'Постоянные лекарства' }) @IsOptional() @IsString() @MaxLength(1000) medications?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() organDonor?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pregnancy?: boolean;
  @ApiPropertyOptional({ description: 'Полис ОМС/ДМС' }) @IsOptional() @IsString() @MaxLength(120) dmsPolicy?: string;
  @ApiPropertyOptional({ description: 'Лечащий врач' }) @IsOptional() @IsString() @MaxLength(120) doctorName?: string;

  @ApiPropertyOptional({ description: 'Согласие на обработку мед-данных (обязательно при первом сохранении)' })
  @IsOptional()
  @IsBoolean()
  consent?: boolean;
}
