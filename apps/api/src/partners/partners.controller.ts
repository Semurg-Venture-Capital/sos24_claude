import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PartnerType } from '@prisma/client';
import { PartnersService } from './partners.service';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly service: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'Список партнёров (СТО, клиники, эвакуаторы)' })
  @ApiQuery({ name: 'type', enum: PartnerType, required: false })
  @ApiQuery({ name: 'city', required: false })
  getAll(
    @Query('type') type?: PartnerType,
    @Query('city') city?: string,
  ) {
    return this.service.getAll(type, city);
  }
}
