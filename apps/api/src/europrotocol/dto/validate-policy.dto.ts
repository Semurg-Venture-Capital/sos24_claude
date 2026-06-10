import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

// Серия+номер полиса ОСАГО второго участника для валидации в НАПП.
export class ValidatePolicyDto {
  @ApiProperty({ example: 'OSG' })
  @IsString()
  @MaxLength(8)
  seria!: string;

  @ApiProperty({ example: '1234567' })
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  number!: string;
}
