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
