import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

// Одноразовый code из нативного MyID SDK (TTL 5 мин).
export class VerifyCodeDto {
  @ApiProperty({ description: 'Одноразовый код MyID SDK' })
  @IsString()
  @MinLength(4)
  code!: string;
}
