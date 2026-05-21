import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class TopupWalletDto {
  @ApiProperty({ example: 100000, description: 'Сумма в сумах' })
  @IsInt()
  @Min(1000)
  @Max(50000000)
  amount!: number;
}
