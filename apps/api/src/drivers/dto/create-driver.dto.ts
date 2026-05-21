import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateDriverDto {
  @ApiProperty({ example: 'Каримов Азиз Эркинович' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'AB' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  licenseSeries?: string;

  @ApiPropertyOptional({ example: '2345678' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  experienceYears?: number;

  @ApiPropertyOptional({ example: '1990-05-14', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
