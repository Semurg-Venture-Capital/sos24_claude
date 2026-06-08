import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

// Пробивка физлица по паспорту + дате рождения (админ-инструмент).
export class NappLookupPassportDto {
  @ApiProperty({ example: 'AC2523171', description: 'Серия+номер паспорта' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  document!: string;

  @ApiProperty({ example: '2001-01-05', description: 'Дата рождения YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birthDate format YYYY-MM-DD' })
  birthDate!: string;
}

// Пробивка физлица по ПИНФЛ (+ любой документ).
export class NappLookupPinflDto {
  @ApiProperty({ example: '50501015120024', description: 'ПИНФЛ субъекта' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  pinfl!: string;

  @ApiProperty({ example: 'AC2523171', description: 'Любой документ субъекта (серия+номер)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  document!: string;
}
