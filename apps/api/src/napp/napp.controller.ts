import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProviderVehicleDto } from './dto/provider-vehicle.dto';
import { NappService } from './napp.service';

@ApiTags('napp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('napp')
export class NappController {
  constructor(private readonly napp: NappService) {}

  @Post('provider/osago/vehicle')
  @ApiOperation({
    summary: 'Данные ТС по техпаспорту + госномеру (NAPP mock).',
    description:
      'Имитирует POST /api/provider/osago/vehicle. Возвращает конверт ' +
      '{ error, error_message, result } с TechPassportInfo. Когда NAPP подключим ' +
      'реально, контракт останется неизменным. Для теста "не найдено" — ' +
      'techPassportNumber = "0000000".',
  })
  getVehicleByTechPassport(@Body() dto: ProviderVehicleDto) {
    return this.napp.getVehicleByTechPassport(
      dto.techPassportSeria,
      dto.techPassportNumber,
      dto.govNumber,
    );
  }
}
