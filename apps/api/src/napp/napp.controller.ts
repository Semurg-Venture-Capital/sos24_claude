import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProviderVehicleDto } from './dto/provider-vehicle.dto';
import { NappReferenceService } from './napp-reference.service';
import { NappService } from './napp.service';

@ApiTags('napp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('napp')
export class NappController {
  constructor(
    private readonly napp: NappService,
    private readonly references: NappReferenceService,
  ) {}

  @Get('references/:name')
  @ApiOperation({ summary: 'Справочник НАПП по имени (vehicle-types-osago, genders, regions и т.д.).' })
  getReference(@Param('name') name: string) {
    return this.references.get(name);
  }

  @Post('provider/osago/vehicle')
  @ApiOperation({
    summary: 'Данные ТС по техпаспорту + госномеру (NAPP).',
    description:
      'Проксирует POST /api/provider/osago/vehicle НАПП. Возвращает конверт ' +
      '{ error, error_message, result } с TechPassportInfo. По умолчанию ходит в ' +
      'живой sandbox; режим переключается env (NAPP_MOCK / NAPP_MOCK_FALLBACK). ' +
      'В мок-режиме для теста "не найдено" — techPassportNumber = "0000000".',
  })
  getVehicleByTechPassport(@Body() dto: ProviderVehicleDto) {
    return this.napp.getVehicleByTechPassport(
      dto.techPassportSeria,
      dto.techPassportNumber,
      dto.govNumber,
    );
  }
}
