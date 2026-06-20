import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InsuranceService } from './insurance.service';

// Публичный каталог для мобайла: компании → продукты компании → карточка продукта.
@ApiTags('insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insurance: InsuranceService) {}

  @Get('companies')
  @ApiOperation({ summary: 'Активные страховые компании (для экрана выбора).' })
  listCompanies() {
    return this.insurance.listCompaniesPublic();
  }

  @Get('companies/:id/products')
  @ApiOperation({ summary: 'Активные продукты выбранной компании с «от» цены.' })
  listProducts(@Param('id') id: string) {
    return this.insurance.listCompanyProducts(id);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Карточка продукта: контент, тарифные планы, компания.' })
  getProduct(@Param('id') id: string) {
    return this.insurance.getProductPublic(id);
  }
}
