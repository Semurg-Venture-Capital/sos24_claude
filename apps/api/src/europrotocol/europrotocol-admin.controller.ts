import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EuroStatus } from '@prisma/client';
import { AdminGuard } from '../admin/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateEuroStatusDto } from './dto/update-euro-status.dto';
import { EuroprotocolService } from './europrotocol.service';

@ApiTags('admin-europrotocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/europrotocols')
export class EuroprotocolAdminController {
  constructor(private readonly euro: EuroprotocolService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPI европротоколов по статусам.' })
  stats() {
    return this.euro.adminStats();
  }

  @Get()
  @ApiOperation({ summary: 'Список европротоколов (фильтр по статусу, пагинация).' })
  list(
    @Query('status') status?: EuroStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.euro.adminList(status, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталь европротокола (админ).' })
  detail(@Param('id') id: string) {
    return this.euro.adminFindOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Сменить статус + примечание оператора.' })
  update(@Param('id') id: string, @Body() dto: UpdateEuroStatusDto) {
    return this.euro.updateStatus(id, dto.status as EuroStatus, dto.adminNote);
  }
}
