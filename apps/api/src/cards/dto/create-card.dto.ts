import { ApiProperty } from '@nestjs/swagger';
import { CardBrand } from '@prisma/client';
import { IsEnum, IsString, Length, Matches } from 'class-validator';

export class CreateCardDto {
  @ApiProperty({ enum: CardBrand, example: CardBrand.UZCARD })
  @IsEnum(CardBrand)
  brand!: CardBrand;

  @ApiProperty({ example: '4582', description: '4 последние цифры' })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'last4 must be 4 digits' })
  last4!: string;

  @ApiProperty({ example: '08/27', description: 'MM/YY' })
  @IsString()
  @Matches(/^\d{2}\/\d{2}$/, { message: 'expiry must be MM/YY' })
  expiry!: string;
}
