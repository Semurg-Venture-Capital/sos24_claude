import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SyncNappDto } from './dto/sync-napp.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Список авто пользователя.' })
  list(@CurrentUser() user: JwtPayload) {
    return this.vehicles.list(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталь авто по id.' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehicles.findOne(user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить авто.' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить авто.' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(user.sub, id, dto);
  }

  @Post(':id/sync-napp')
  @ApiOperation({ summary: 'Пере-синхронизировать данные авто из НАПП по техпаспорту.' })
  syncNapp(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SyncNappDto,
  ) {
    return this.vehicles.syncNapp(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить авто.' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.vehicles.remove(user.sub, id);
  }
}
