import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class CreateMyIdSessionDto {
  @ApiPropertyOptional({
    description: '14-значный ПИНФЛ пользователя. Если передан — SDK пропускает экран ввода паспорта.',
    example: '12345678901234',
  })
  @IsOptional()
  @IsString()
  @Length(14, 14)
  @Matches(/^\d{14}$/, { message: 'ПИНФЛ должен состоять из 14 цифр' })
  pinfl?: string;
}
