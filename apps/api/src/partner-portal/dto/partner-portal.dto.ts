import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PricingMode, ProductType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// ── Страховая: профиль компании (то, что владелец может менять сам) ──
// slug, active, sortOrder — атрибуты маркетплейса, остаются за админом.
export class UpdateMyCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

// ── Страховая: продукт (companyId подставляется из кабинета, его в DTO нет) ──
export class PortalCreateProductDto {
  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ example: 'ОСАГО' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Уникальный slug в рамках компании', example: 'osago' })
  @IsString()
  @MaxLength(60)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  longDescription?: string;

  @ApiProperty({ enum: PricingMode })
  @IsEnum(PricingMode)
  pricingMode!: PricingMode;

  @ApiPropertyOptional({ description: 'Базовая ставка (для COEFFICIENT), сум' })
  @IsOptional()
  @IsInt()
  @Min(0)
  baseRate?: number;

  @ApiPropertyOptional({ description: 'Контент карточки: covers/exceptions/steps/faqs' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class PortalUpdateProductDto extends PartialType(PortalCreateProductDto) {}

// ── Страховая: тарифный план ──
export class PortalCreatePlanDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: 'Базовый' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Цена, сум', example: 1200000 })
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'Страховая сумма (покрытие), сум' })
  @IsOptional()
  @IsInt()
  @Min(0)
  coverageAmount?: number;

  @ApiPropertyOptional({ description: 'Что входит — массив строк', type: [String] })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class PortalUpdatePlanDto extends PartialType(PortalCreatePlanDto) {}

// ── Сервис-партнёр: профиль точки (без active/sortOrder/categoryId — это за админом) ──
export class UpdateMyPartnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'График: { mon:{open,close}|null, ... }' })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, { open: string; close: string } | null>;
}
