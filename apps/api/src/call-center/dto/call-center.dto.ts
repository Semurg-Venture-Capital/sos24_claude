import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AttachTicketDto {
  @ApiPropertyOptional({ description: 'ID заявки (null/пусто — отвязать)' })
  @IsOptional()
  @IsString()
  ticketId?: string;

  @ApiPropertyOptional({ description: 'Заметка оператора по звонку' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;
}

export class CreateCallTicketDto {
  @ApiPropertyOptional({ enum: ['POLICY', 'PAYMENT', 'ACCIDENT', 'ACCOUNT', 'OTHER'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Тема заявки' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({ description: 'Заметка оператора по звонку' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;
}
