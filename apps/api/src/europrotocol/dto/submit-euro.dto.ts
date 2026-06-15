import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

// Полезная нагрузка визарда европротокола (сбор данных, без PDF).
export class SubmitEuroDto {
  @ApiProperty({ example: '2026-06-10' }) @IsString() incidentDate!: string;
  @ApiProperty({ example: '14:30' }) @IsString() incidentTime!: string;
  @ApiProperty() @IsString() place!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lng?: number;

  // Сторона A
  @ApiPropertyOptional() @IsOptional() @IsString() vehicleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() selfVerified?: boolean;

  // Сторона B
  @ApiPropertyOptional() @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherGov?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() otherVehicleRaw?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() otherPolicySeria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherPolicyNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() otherPolicyValid?: boolean;

  // Схема / описание / фото
  @ApiPropertyOptional() @IsOptional() @IsString() schemeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() schemeImageKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: 'array' }) @IsOptional() @IsArray() photos?: unknown[];

  // --- Общая часть (4–6) ---
  @ApiPropertyOptional() @IsOptional() @IsBoolean() medCheck?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() witnesses?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() officialRegistered?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() officerBadgeNo?: string;

  // --- Обстоятельства: 22 boolean на сторону ---
  @ApiPropertyOptional({ type: [Boolean] }) @IsOptional() @IsArray() @IsBoolean({ each: true }) circumstancesA?: boolean[];
  @ApiPropertyOptional({ type: [Boolean] }) @IsOptional() @IsArray() @IsBoolean({ each: true }) circumstancesB?: boolean[];

  // --- Сторона A: доп. ---
  @ApiPropertyOptional() @IsOptional() @IsString() ownershipDocA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() damageDescA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() objectionsA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() impactZoneA?: string;

  // --- Сторона B: ручной ввод ---
  @ApiPropertyOptional() @IsOptional() @IsString() otherOwnerAddr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherDlSeria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherDlNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherDlCategories?: string;
  @ApiPropertyOptional({ example: '2025-03-01' }) @IsOptional() @IsString() otherDlIssue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherOwnershipDoc?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() otherInsurer?: string;
  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsString() otherPolicyValidUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() damageDescB?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() objectionsB?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() impactZoneB?: string;

  // --- Оборот ---
  @ApiPropertyOptional({ enum: ['owner', 'other'] }) @IsOptional() @IsString() driverRole?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() canMove?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() cannotMovePlace?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
