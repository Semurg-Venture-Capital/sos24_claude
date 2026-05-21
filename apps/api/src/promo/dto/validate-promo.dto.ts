import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ValidatePromoDto {
  @ApiProperty({ example: 'SOS10' })
  @IsString()
  @Length(1, 32)
  code!: string;
}
