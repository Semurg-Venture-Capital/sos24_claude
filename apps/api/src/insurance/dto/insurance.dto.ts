import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PricingMode, ProductType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// ── Компании ──────────────────────────────────────────────────────────────
export class CreateCompanyDto {
  @ApiProperty({ example: 'SOS24 Sugʻurta' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Уникальный slug (латиница)', example: 'sos24' })
  @IsString()
  @MaxLength(60)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiPropertyOptional({ description: 'Ключ логотипа в MinIO' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  logoKey?: string;
}

// ── Продукты ──────────────────────────────────────────────────────────────
export class CreateProductDto {
  @ApiProperty()
  @IsString()
  companyId!: string;

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

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// ── Тарифные планы ────────────────────────────────────────────────────────
export class CreatePlanDto {
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

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
