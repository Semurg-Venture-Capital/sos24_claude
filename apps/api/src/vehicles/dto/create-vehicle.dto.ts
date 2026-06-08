import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: '01 A 123 BB' })
  @IsString()
  @MaxLength(16)
  @Matches(/^[0-9A-Za-zА-Яа-я\s\-]{4,16}$/, { message: 'plate format invalid' })
  plate!: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString()
  @MaxLength(40)
  brand!: string;

  @ApiProperty({ example: 'Cobalt' })
  @IsString()
  @MaxLength(40)
  model!: string;

  @ApiProperty({ example: 2021 })
  @IsInt()
  @Min(1950)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ example: '1.5 л' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  engine?: string;

  @ApiPropertyOptional({ example: '105 л.с.' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  power?: string;

  @ApiPropertyOptional({ example: 'KL1JF6862MB123456' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  vin?: string;

  @ApiPropertyOptional({ example: 'белый' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  color?: string;

  // Если переданы серия+номер техпаспорта — backend подтянет полные данные из НАПП
  // (по техпаспорту + госномеру) и сохранит nappRaw + промо-поля + организацию владельца.
  @ApiPropertyOptional({ example: 'AAF', description: 'Серия техпаспорта для дозагрузки данных из НАПП' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  techPassportSeria?: string;

  @ApiPropertyOptional({ example: '2949568', description: 'Номер техпаспорта для дозагрузки данных из НАПП' })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  techPassportNumber?: string;
}
