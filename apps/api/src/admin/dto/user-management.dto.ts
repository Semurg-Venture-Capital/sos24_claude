import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const PHONE_RE = /^\+998\d{9}$/;

export class CreateUserDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @Matches(PHONE_RE, { message: 'Телефон в формате +998XXXXXXXXX' })
  phone!: string;

  @ApiProperty({ enum: UserRole, example: 'SUPPORT' })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  surname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  patronymic?: string;

  @ApiPropertyOptional({ description: 'Только для role=PARTNER: привязать к страховой компании (id)' })
  @IsOptional()
  @IsString()
  linkCompanyId?: string;

  @ApiPropertyOptional({ description: 'Только для role=PARTNER: привязать к точке-партнёру (id)' })
  @IsOptional()
  @IsString()
  linkPartnerId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  @Matches(PHONE_RE, { message: 'Телефон в формате +998XXXXXXXXX' })
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  surname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  patronymic?: string;

  @ApiPropertyOptional({ description: 'Только для role=PARTNER: привязать к страховой компании (id, "" — отвязать)' })
  @IsOptional()
  @IsString()
  linkCompanyId?: string;

  @ApiPropertyOptional({ description: 'Только для role=PARTNER: привязать к точке-партнёру (id, "" — отвязать)' })
  @IsOptional()
  @IsString()
  linkPartnerId?: string;
}
