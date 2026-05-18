import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Азиз' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ example: 'Каримов' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  surname?: string;

  @ApiPropertyOptional({ example: 'Эркинович' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  patronymic?: string;

  @ApiPropertyOptional({ example: '1995-05-14', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Locale, example: Locale.ru })
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
