import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  CreateAppointmentDto,
  CreateContactDto,
  DoctorSlotsQueryDto,
  DoctorsQueryDto,
  SosTriggerDto,
  UpdateContactDto,
  UpdateMedicalProfileDto,
} from './dto/health.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get('doctors')
  @ApiOperation({ summary: 'Список врачей (поиск, фильтр по специальности).' })
  doctors(@Query() query: DoctorsQueryDto) {
    return this.service.listDoctors(query);
  }

  @Get('medical-profile')
  @ApiOperation({ summary: 'Моя мед.карта (Medical ID).' })
  medicalProfile(@CurrentUser() user: JwtPayload) {
    return this.service.getMedicalProfile(user.sub);
  }

  @Put('medical-profile')
  @ApiOperation({ summary: 'Сохранить мед.карту (первое сохранение требует согласия).' })
  saveMedicalProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMedicalProfileDto) {
    return this.service.updateMedicalProfile(user.sub, dto);
  }

  // ── Экстренные контакты (M14.11) ──
  @Get('emergency-contacts')
  @ApiOperation({ summary: 'Мои экстренные контакты.' })
  contacts(@CurrentUser() user: JwtPayload) {
    return this.service.listContacts(user.sub);
  }

  @Post('emergency-contacts')
  @ApiOperation({ summary: 'Добавить экстренный контакт (лимит 3).' })
  addContact(@CurrentUser() user: JwtPayload, @Body() dto: CreateContactDto) {
    return this.service.createContact(user.sub, dto);
  }

  @Patch('emergency-contacts/:id')
  @ApiOperation({ summary: 'Изменить экстренный контакт.' })
  editContact(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.service.updateContact(user.sub, id, dto);
  }

  @Delete('emergency-contacts/:id')
  @ApiOperation({ summary: 'Удалить экстренный контакт.' })
  removeContact(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteContact(user.sub, id);
  }

  // ── ЧП / SOS (M14.12) ──
  @Post('sos/trigger')
  @ApiOperation({ summary: 'Активировать тревогу SOS (оповестить контакты, принять геолокацию).' })
  sosTrigger(@CurrentUser() user: JwtPayload, @Body() dto: SosTriggerDto) {
    return this.service.triggerSos(user.sub, dto);
  }

  @Post('sos/:id/cancel')
  @ApiOperation({ summary: 'Отменить тревогу SOS.' })
  sosCancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancelSos(user.sub, id);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Мои записи к врачам.' })
  appointments(@CurrentUser() user: JwtPayload) {
    return this.service.myAppointments(user.sub);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Записаться к врачу (очно).' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAppointmentDto) {
    return this.service.createAppointment(user.sub, dto);
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Отменить мою запись к врачу.' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancelAppointment(user.sub, id);
  }

  @Get('doctors/:id')
  @ApiOperation({ summary: 'Профиль врача.' })
  doctor(@Param('id') id: string) {
    return this.service.doctorDetail(id);
  }

  @Get('doctors/:id/slots')
  @ApiOperation({ summary: 'Доступные слоты врача на дату.' })
  slots(@Param('id') id: string, @Query() query: DoctorSlotsQueryDto) {
    return this.service.doctorSlots(id, query.date);
  }
}
