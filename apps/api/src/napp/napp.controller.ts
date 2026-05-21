import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NappService } from './napp.service';

@ApiTags('napp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('napp')
export class NappController {
  constructor(private readonly napp: NappService) {}

  @Get('vehicle/:plate')
  @ApiOperation({
    summary: 'Поиск авто по гос. номеру (NAPP mock).',
    description:
      'Имитирует ответ NAPP — возвращает детерминированные данные. ' +
      'Когда NAPP подключим реально, контракт останется неизменным.',
  })
  lookupVehicle(@Param('plate') plate: string) {
    return this.napp.lookupVehicle(plate);
  }
}
