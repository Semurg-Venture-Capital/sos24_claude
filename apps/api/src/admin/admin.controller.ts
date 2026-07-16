import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CreateUserDto, UpdateUserDto } from './dto/user-management.dto';

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

  @Get('ai-usage')
  @ApiOperation({ summary: 'Лог использования ИИ (Gemini): запросы, токены, агрегаты по фичам.' })
  getAiUsage(@Query('page') page = '1', @Query('limit') limit = '50', @Query('feature') feature?: string) {
    return this.adminService.getAiUsage({ page: +page, limit: +limit, feature });
  }

  @Get('alcotests')
  @ApiOperation({ summary: 'Записи с алкотестера Alcostop: список + фото + агрегаты.' })
  getAlcoTests(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('positive') positive?: string,
  ) {
    return this.adminService.getAlcoTests({
      page: +page,
      limit: +limit,
      positive: positive === 'true' ? true : positive === 'false' ? false : undefined,
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'Список всех пользователей с пагинацией и фильтрами.' })
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, search, verified, role);
  }

  @Post('users')
  @ApiOperation({ summary: 'Создать пользователя (оператор поддержки, аджастер, админ).' })
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Изменить пользователя (роль, ФИО, телефон).' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
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
