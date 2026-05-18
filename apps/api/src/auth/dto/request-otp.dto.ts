import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+998901234567', description: 'Номер в международном формате (E.164)' })
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must match +998XXXXXXXXX' })
  phone!: string;
}
