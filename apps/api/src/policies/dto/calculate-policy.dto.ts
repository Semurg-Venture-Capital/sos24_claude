import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CalculatePolicyDto {
  @ApiProperty({ enum: ProductType, example: ProductType.OSAGO })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiPropertyOptional({ description: 'Только для OSAGO/KASKO', example: 'cmpe2lil20002k66vhoi0uy7p' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Только для OSAGO/KASKO', enum: [3, 6, 12], example: 12 })
  @IsOptional()
  @IsIn([3, 6, 12])
  periodMonths?: number;

  @ApiPropertyOptional({ description: 'Только для OSAGO', enum: ['LIMITED', 'UNLIMITED'], example: 'LIMITED' })
  @IsOptional()
  @IsIn(['LIMITED', 'UNLIMITED'])
  driverLimit?: 'LIMITED' | 'UNLIMITED';

  @ApiPropertyOptional({ example: 'SOS10' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}
