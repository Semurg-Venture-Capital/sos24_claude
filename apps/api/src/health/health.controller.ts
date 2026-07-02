import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateAppointmentDto, DoctorSlotsQueryDto, DoctorsQueryDto } from './dto/health.dto';
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
