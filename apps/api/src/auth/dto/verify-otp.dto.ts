import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must match +998XXXXXXXXX' })
  phone!: string;

  @ApiProperty({ example: '6330', description: 'OTP-код (на dev всегда 6330)' })
  @IsString()
  @Length(4, 6)
  code!: string;
}
