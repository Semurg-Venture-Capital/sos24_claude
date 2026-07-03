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

// Экстренный контакт (M14.11).
export class CreateContactDto {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiPropertyOptional({ description: 'Отношение: супруга, брат …' }) @IsOptional() @IsString() @MaxLength(60) relation?: string;
  @ApiProperty({ example: '+998 90 234-56-78' }) @IsString() @MaxLength(30) phone!: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) relation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
}

// Сообщение в ИИ-триаж (M14.2).
export class TriageMessageDto {
  @ApiProperty({ description: 'Текст пользователя' })
  @IsString()
  @MaxLength(1000)
  text!: string;
}

// ── Админка: врачи (M14) ──
export class DoctorInputDto {
  @ApiProperty() @IsString() @MaxLength(120) fullName!: string;
  @ApiProperty({ example: 'ЛОР' }) @IsString() @MaxLength(60) specialty!: string;
  @ApiPropertyOptional({ description: 'ID клиники-партнёра' }) @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(70) experienceY?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) pricePrimary?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceRepeat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceVideo?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() videoEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() verified?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateDoctorDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) specialty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(70) experienceY?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) pricePrimary?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceRepeat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceVideo?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() videoEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() verified?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class SetAppointmentStatusDto {
  @ApiProperty({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] })
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

// Диспетчер: принять/закрыть SOS-тревогу.
export class UpdateSosAlertDto {
  @ApiProperty({ enum: ['acknowledge', 'resolve'] })
  @IsIn(['acknowledge', 'resolve'])
  action!: 'acknowledge' | 'resolve';

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

// Тревога ЧП/SOS (M14.12): координаты необязательны (могут прийти позже).
export class SosTriggerDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) lat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) lng?: number;
  @ApiPropertyOptional({ description: 'Читаемый адрес (reverse-geocode с устройства)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}
