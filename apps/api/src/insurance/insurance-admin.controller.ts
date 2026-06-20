import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { InsuranceService } from './insurance.service';
import {
  CreateCompanyDto,
  CreatePlanDto,
  CreateProductDto,
  UpdateCompanyDto,
  UpdatePlanDto,
  UpdateProductDto,
} from './dto/insurance.dto';

const LOGO_MAX = 5 * 1024 * 1024; // 5 МБ
const LOGO_ALLOWED = /^image\/(png|jpe?g|webp|svg\+xml)$/i;

// Админ-CRUD каталога страховых компаний, продуктов и тарифных планов.
@ApiTags('admin-insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/insurance')
export class InsuranceAdminController {
  constructor(private readonly insurance: InsuranceService) {}

  // ── Компании ──
  @Get('companies')
  @ApiOperation({ summary: 'Все компании (вкл. неактивные) + кол-во продуктов.' })
  listCompanies() {
    return this.insurance.adminListCompanies();
  }

  @Post('companies')
  @ApiOperation({ summary: 'Создать компанию.' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.insurance.adminCreateCompany(dto);
  }

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Обновить компанию.' })
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.insurance.adminUpdateCompany(id, dto);
  }

  @Delete('companies/:id')
  @ApiOperation({ summary: 'Удалить компанию (если нет полисов).' })
  deleteCompany(@Param('id') id: string) {
    return this.insurance.adminDeleteCompany(id);
  }

  @Post('companies/:id/logo')
  @ApiOperation({ summary: 'Загрузить логотип компании (multipart, поле "file").' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: LOGO_MAX } }))
  uploadLogo(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    if (!LOGO_ALLOWED.test(file.mimetype)) throw new BadRequestException('Только PNG, JPG, WEBP, SVG');
    return this.insurance.setCompanyLogo(id, file.buffer, file.mimetype);
  }

  // ── Продукты ──
  @Get('companies/:id/products')
  @ApiOperation({ summary: 'Все продукты компании (вкл. неактивные) с планами.' })
  listProducts(@Param('id') id: string) {
    return this.insurance.adminListProducts(id);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Продукт с планами и компанией.' })
  getProduct(@Param('id') id: string) {
    return this.insurance.adminGetProduct(id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Создать продукт.' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.insurance.adminCreateProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Обновить продукт.' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.insurance.adminUpdateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Удалить продукт (если нет полисов).' })
  deleteProduct(@Param('id') id: string) {
    return this.insurance.adminDeleteProduct(id);
  }

  // ── Тарифные планы ──
  @Post('plans')
  @ApiOperation({ summary: 'Добавить тарифный план продукту.' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.insurance.adminCreatePlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Обновить тарифный план.' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.insurance.adminUpdatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Удалить тарифный план (если нет полисов).' })
  deletePlan(@Param('id') id: string) {
    return this.insurance.adminDeletePlan(id);
  }
}
