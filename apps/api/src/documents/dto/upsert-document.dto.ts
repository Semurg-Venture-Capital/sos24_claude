import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpsertDocumentDto {
  @ApiProperty({ example: 'AA' })
  @IsString()
  @Length(1, 4)
  series!: string;

  @ApiProperty({ example: '1234567' })
  @IsString()
  @Length(1, 16)
  number!: string;

  @ApiProperty({ example: '2018-04-12', description: 'YYYY-MM-DD' })
  @IsDateString()
  issuedAt!: string;

  @ApiPropertyOptional({ example: 'УВД Мирабадского района г. Ташкента' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuedBy?: string;

  @ApiPropertyOptional({ example: '12345678901234', description: '14 цифр ПИНФЛ (только для PASSPORT)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'pinfl must be 14 digits' })
  pinfl?: string;

  @ApiPropertyOptional({ example: '2028-04-12', description: 'Срок действия (только для DRIVER_LICENSE)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'B,C', description: 'Категории ВУ через запятую (только для DRIVER_LICENSE)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  categories?: string;
}
