import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class PayPolicyDto {
  @ApiProperty({ description: 'ID полиса в статусе DRAFT/PENDING_PAYMENT' })
  @IsString()
  policyId!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Обязателен если method=CARD' })
  @ValidateIf((o) => o.method === 'CARD')
  @IsString()
  cardId?: string;
}
