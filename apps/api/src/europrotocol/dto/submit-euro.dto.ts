import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const IMPACT_ZONES = ['front', 'rear', 'left', 'right', 'front-left', 'front-right', 'rear-left', 'rear-right'];

// Полезная нагрузка визарда европротокола (сбор данных, без PDF).
export class SubmitEuroDto {
  @ApiProperty({ example: '2026-06-10' }) @IsString() @MaxLength(10) incidentDate!: string;
  @ApiProperty({ example: '14:30' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'incidentTime: формат HH:MM' }) incidentTime!: string;
  @ApiProperty() @IsString() @MaxLength(300) place!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lng?: number;

  // Сторона A
  @ApiPropertyOptional() @IsOptional() @IsString() vehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() selfVerified?: boolean;

  // Сторона B
  @ApiPropertyOptional() @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(15) otherGov?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) otherPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() otherVehicleRaw?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5) otherPolicySeria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12) otherPolicyNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() otherPolicyValid?: boolean;

  // Схема / описание / фото
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(16) schemeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) schemeImageKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional({ type: 'array' }) @IsOptional() @IsArray() @ArrayMaxSize(50) photos?: unknown[];

  // --- Общая часть (4–6) ---
  @ApiPropertyOptional() @IsOptional() @IsBoolean() medCheck?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) witnesses?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() officialRegistered?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) officerBadgeNo?: string;

  // --- Обстоятельства: 22 boolean на сторону ---
  @ApiPropertyOptional({ type: [Boolean] }) @IsOptional() @IsArray() @ArrayMaxSize(22) @IsBoolean({ each: true }) circumstancesA?: boolean[];
  @ApiPropertyOptional({ type: [Boolean] }) @IsOptional() @IsArray() @ArrayMaxSize(22) @IsBoolean({ each: true }) circumstancesB?: boolean[];

  // --- Сторона A: доп. ---
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) ownershipDocA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) damageDescA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) objectionsA?: string;
  @ApiPropertyOptional({ enum: IMPACT_ZONES }) @IsOptional() @IsIn(IMPACT_ZONES) impactZoneA?: string;

  // --- Сторона B: ручной ввод ---
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) otherOwnerAddr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5) otherDlSeria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12) otherDlNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) otherDlCategories?: string;
  @ApiPropertyOptional({ example: '2025-03-01' }) @IsOptional() @IsString() @MaxLength(10) otherDlIssue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) otherOwnershipDoc?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) otherInsurer?: string;
  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsString() @MaxLength(10) otherPolicyValidUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) damageDescB?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) objectionsB?: string;
  @ApiPropertyOptional({ enum: IMPACT_ZONES }) @IsOptional() @IsIn(IMPACT_ZONES) impactZoneB?: string;

  // --- Оборот ---
  @ApiPropertyOptional({ enum: ['owner', 'other'] }) @IsOptional() @IsIn(['owner', 'other']) driverRole?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() canMove?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) cannotMovePlace?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) remarks?: string;
}
