import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

// Тело запроса для POST /napp/provider/osago/vehicle.
// Повторяет параметры реального НАПП /api/provider/osago/vehicle.
export class ProviderVehicleDto {
  @ApiProperty({ description: 'Серия техпаспорта (3 символа)', example: 'AAE' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 5)
  techPassportSeria!: string;

  @ApiProperty({ description: 'Номер техпаспорта (7 цифр)', example: '3000221' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 12)
  techPassportNumber!: string;

  @ApiProperty({ description: 'Госномер ТС', example: '01A123BB' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 12)
  govNumber!: string;
}
