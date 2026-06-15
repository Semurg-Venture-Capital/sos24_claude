import { Body, Controller, Get, Param, Patch, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { EuroStatus } from '@prisma/client';
import type { Response } from 'express';
import { AdminGuard } from '../admin/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateEuroStatusDto } from './dto/update-euro-status.dto';
import { EuroprotocolPdfService } from './europrotocol-pdf.service';
import { EuroprotocolService } from './europrotocol.service';

@ApiTags('admin-europrotocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/europrotocols')
export class EuroprotocolAdminController {
  constructor(
    private readonly euro: EuroprotocolService,
    private readonly pdf: EuroprotocolPdfService,
  ) {}

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

  @Get(':id/pdf')
  @ApiOperation({ summary: 'PDF бланка «Извещение о ДТП» (админ).' })
  @ApiProduces('application/pdf')
  async pdfFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.pdf.generate(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Сменить статус + примечание оператора.' })
  update(@Param('id') id: string, @Body() dto: UpdateEuroStatusDto) {
    return this.euro.updateStatus(id, dto.status as EuroStatus, dto.adminNote);
  }
}
