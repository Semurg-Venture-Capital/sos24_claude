import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

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

  // Схема / описание / фото-метаданные
  @ApiPropertyOptional() @IsOptional() @IsString() schemeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: 'array' }) @IsOptional() photos?: unknown[];
}
