import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdjusterStatus, IncidentType } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AdminGuard } from '../admin/admin.guard';
import { AdjusterService } from './adjuster.service';

@ApiTags('adjuster')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AdjusterController {
  constructor(private readonly adjusterService: AdjusterService) {}

  @Post('adjuster')
  @ApiOperation({ summary: 'Создать заявку на аджастера' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { incidentType: IncidentType; address: string; lat?: number; lng?: number; comment?: string; policyId?: string },
  ) {
    return this.adjusterService.create(user.sub, body);
  }

  @Get('me/adjuster')
  @ApiOperation({ summary: 'История заявок текущего пользователя' })
  myRequests(@CurrentUser() user: JwtPayload) {
    return this.adjusterService.findByUser(user.sub);
  }

  // ─── Admin endpoints ───────────────────────────────────────────────────────

  @Get('admin/adjuster/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'KPI статистика по заявкам (admin)' })
  getStats() {
    return this.adjusterService.getStats();
  }

  @Get('admin/adjuster')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Все заявки (admin)' })
  findAll(
    @Query('status') status?: AdjusterStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adjusterService.findAll(status, +page, +limit);
  }

  @Patch('admin/adjuster/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Изменить статус / назначить аджастера (admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: {
      status: AdjusterStatus;
      adjusterNote?: string;
      assignedAdjusterId?: string;
      adjusterName?: string;
      adjusterPhone?: string;
    },
  ) {
    return this.adjusterService.updateStatus(id, body);
  }

  @Get('admin/adjusters')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Список аджастеров (системных пользователей с ролью ADJUSTER)' })
  findAdjusterUsers() {
    return this.adjusterService.findAdjusterUsers();
  }

  @Post('admin/adjusters')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Добавить аджастера (создаёт/апгрейдит пользователя)' })
  createAdjusterUser(
    @Body() body: { name: string; surname?: string; phone: string },
  ) {
    return this.adjusterService.createAdjusterUser(body);
  }
}
