import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PartnerBookingStatus } from '@prisma/client';
import { AdminGuard } from '../admin/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { DoctorInputDto, SetAppointmentStatusDto, UpdateDoctorDto, UpdateSosAlertDto } from './dto/health.dto';
import { HealthService } from './health.service';

// Админка модуля «Здоровье» (M14): врачи и записи. Только роль ADMIN.
@ApiTags('admin-health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/health')
export class HealthAdminController {
  constructor(private readonly service: HealthService) {}

  // — Врачи —
  @Get('doctors')
  @ApiOperation({ summary: 'Все врачи (вкл. неактивных).' })
  doctors() {
    return this.service.adminListDoctors();
  }

  @Get('clinics')
  @ApiOperation({ summary: 'Клиники-партнёры (для выбора при создании врача).' })
  clinics() {
    return this.service.adminListClinics();
  }

  @Post('doctors')
  @ApiOperation({ summary: 'Создать врача.' })
  createDoctor(@Body() dto: DoctorInputDto) {
    return this.service.adminCreateDoctor(dto);
  }

  @Patch('doctors/:id')
  @ApiOperation({ summary: 'Изменить врача.' })
  updateDoctor(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.service.adminUpdateDoctor(id, dto);
  }

  @Delete('doctors/:id')
  @ApiOperation({ summary: 'Удалить врача.' })
  deleteDoctor(@Param('id') id: string) {
    return this.service.adminDeleteDoctor(id);
  }

  // — Записи —
  @Get('appointments')
  @ApiOperation({ summary: 'Все записи к врачам (фильтр по статусу).' })
  appointments(@Query('status') status?: PartnerBookingStatus) {
    return this.service.adminListAppointments(status);
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Сменить статус записи.' })
  setStatus(@Param('id') id: string, @Body() dto: SetAppointmentStatusDto) {
    return this.service.adminSetAppointmentStatus(id, dto.status);
  }

  // — SOS-тревоги (диспетчер) —
  @Get('sos')
  @ApiOperation({ summary: 'SOS-тревоги (фильтр по статусу).' })
  sos(@Query('status') status?: 'ACTIVE' | 'CANCELLED' | 'RESOLVED') {
    return this.service.adminListSosAlerts(status);
  }

  @Patch('sos/:id')
  @ApiOperation({ summary: 'Принять/закрыть SOS-тревогу.' })
  updateSos(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateSosAlertDto) {
    return this.service.adminUpdateSosAlert(user.sub, id, dto.action, dto.note);
  }
}
