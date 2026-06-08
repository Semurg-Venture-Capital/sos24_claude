import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPI-дашборд: агрегаты, тренд, последние записи.' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Список всех пользователей с пагинацией и фильтрами.' })
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('verified') verified?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, search, verified);
  }

  @Get('users/myid-verified')
  @ApiOperation({ summary: 'Список верифицированных через MyID пользователей.' })
  getVerifiedUsers() {
    return this.adminService.getVerifiedUsers();
  }

  @Get('users/:id/myid')
  @ApiOperation({ summary: 'Полные данные пользователя из MyID — для тестирования.' })
  getUserMyId(@Param('id') id: string) {
    return this.adminService.getUserMyIdData(id);
  }

  @Get('policies')
  @ApiOperation({ summary: 'Список всех полисов с пагинацией и фильтрами.' })
  getPolicies(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPolicies(+page, +limit, search, type, status);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Список всех авто (с НАПП-данными) с пагинацией и поиском.' })
  getVehicles(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getVehicles(+page, +limit, search);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Детали авто: все НАПП-поля, владелец, организация, расшифровка справочников.' })
  getVehicle(@Param('id') id: string) {
    return this.adminService.getVehicle(id);
  }
}
