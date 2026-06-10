import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// Тело POST /me/vehicles/:id/sync-napp.
// Серия+номер техпаспорта опциональны: если не переданы — берём сохранённые у авто.
export class SyncNappDto {
  @ApiPropertyOptional({ example: 'AAF', description: 'Серия техпаспорта (если не передана — берётся из авто)' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  techPassportSeria?: string;

  @ApiPropertyOptional({ example: '2949568', description: 'Номер техпаспорта (если не передан — берётся из авто)' })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  techPassportNumber?: string;
}
