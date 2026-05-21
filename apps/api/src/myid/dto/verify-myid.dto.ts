import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyMyIdDto {
  @ApiProperty({ description: 'Код от MyID SDK (или "mock-code" в dev-режиме)' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
