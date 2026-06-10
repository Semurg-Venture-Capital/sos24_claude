import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const EURO_STATUSES = ['SUBMITTED', 'REVIEW', 'NEED_INFO', 'APPROVED', 'REJECTED', 'PAID'] as const;

export class UpdateEuroStatusDto {
  @ApiProperty({ enum: EURO_STATUSES })
  @IsIn(EURO_STATUSES as unknown as string[])
  status!: (typeof EURO_STATUSES)[number];

  @ApiPropertyOptional() @IsOptional() @IsString() adminNote?: string;
}
