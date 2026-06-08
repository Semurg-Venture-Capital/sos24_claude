import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

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

// Авто по техпаспорту + госномеру.
export class NappLookupVehicleDto {
  @ApiProperty({ example: 'AAF' })
  @IsString() @IsNotEmpty() @MaxLength(5)
  techPassportSeria!: string;

  @ApiProperty({ example: '2949568' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  techPassportNumber!: string;

  @ApiProperty({ example: '01357YHA' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  govNumber!: string;
}

// Организация по ИНН.
export class NappLookupInnDto {
  @ApiProperty({ example: '307281137' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  inn!: string;
}

// ВУ по ПИНФЛ (+ опционально паспорт).
export class NappLookupDriverLicenseDto {
  @ApiProperty({ example: '50501015120024' })
  @IsString() @IsNotEmpty() @MaxLength(14)
  pinfl!: string;

  @ApiPropertyOptional({ example: 'AC' })
  @IsOptional() @IsString() @MaxLength(5)
  passportSeries?: string;

  @ApiPropertyOptional({ example: '2523171' })
  @IsOptional() @IsString() @MaxLength(12)
  passportNumber?: string;
}

// Сводка по водителю (ВУ + КБМ) по ПИНФЛ + документ.
export class NappLookupDriverSummaryDto {
  @ApiProperty({ example: '50501015120024' })
  @IsString() @IsNotEmpty() @MaxLength(14)
  pinfl!: string;

  @ApiProperty({ example: 'AC2523171' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  document!: string;
}

// КБМ по ПИНФЛ.
export class NappLookupPinflOnlyDto {
  @ApiProperty({ example: '50501015120024' })
  @IsString() @IsNotEmpty() @MaxLength(14)
  pinfl!: string;
}

// Пенсионер: ПИНФЛ + паспорт.
export class NappLookupPensionerDto {
  @ApiProperty({ example: '50501015120024' })
  @IsString() @IsNotEmpty() @MaxLength(14)
  pinfl!: string;

  @ApiProperty({ example: 'AC' })
  @IsString() @IsNotEmpty() @MaxLength(5)
  passportSeries!: string;

  @ApiProperty({ example: '2523171' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  passportNumber!: string;
}

// Скидки: ПИНФЛ + госномер.
export class NappLookupDiscountsDto {
  @ApiProperty({ example: '50501015120024' })
  @IsString() @IsNotEmpty() @MaxLength(14)
  pinfl!: string;

  @ApiProperty({ example: '01357YHA' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  govNumber!: string;
}

// Только госномер (иностранное авто / лицензия перевозчика).
export class NappLookupGovNumberDto {
  @ApiProperty({ example: '01357YHA' })
  @IsString() @IsNotEmpty() @MaxLength(12)
  govNumber!: string;
}

// Недвижимость по кадастру.
export class NappLookupCadasterDto {
  @ApiProperty({ example: '10:10:00:00:01:1121:0001:001' })
  @IsString() @IsNotEmpty() @MaxLength(60)
  cadasterNumber!: string;
}
