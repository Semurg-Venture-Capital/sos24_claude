import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiPropertyOptional({ description: 'Продукт выбранной страховой компании' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Тарифный план (для продуктов с планами)' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ description: 'Обязателен для OSAGO/KASKO' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ enum: [3, 6, 12], example: 12 })
  @IsOptional()
  @IsIn([3, 6, 12])
  periodMonths?: number;

  @ApiPropertyOptional({ enum: ['LIMITED', 'UNLIMITED'] })
  @IsOptional()
  @IsIn(['LIMITED', 'UNLIMITED'])
  driverLimit?: 'LIMITED' | 'UNLIMITED';

  @ApiPropertyOptional({ description: 'Водители из /me/drivers', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  driverIds?: string[];

  @ApiPropertyOptional({ description: 'YYYY-MM-DD, по умолчанию — сегодня' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: 'SOS10' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}
