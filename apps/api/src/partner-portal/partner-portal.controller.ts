import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePlanDto, UpdatePlanDto } from '../insurance/dto/insurance.dto';
import { ServiceInputDto, UpdateBookingStatusDto } from '../partners/dto/partners.dto';
import {
  PortalCreateProductDto,
  PortalUpdateProductDto,
  UpdateMyCompanyDto,
  UpdateMyPartnerDto,
} from './dto/partner-portal.dto';
import { PartnerGuard } from './partner.guard';
import { PartnerPortalService } from './partner-portal.service';

const IMG_MAX = 5 * 1024 * 1024;

// B2B-кабинет partner.sos24.uz. Все эндпоинты — только для роли PARTNER,
// каждый работает строго в рамках сущности, привязанной к текущему пользователю.
@ApiTags('partner-cabinet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PartnerGuard)
@Controller('cabinet')
export class PartnerPortalController {
  constructor(private readonly portal: PartnerPortalService) {}

  @Get('me')
  @ApiOperation({ summary: 'Тип кабинета (INSURER/SERVICE) + привязанная сущность.' })
  me(@CurrentUser() user: JwtPayload) {
    return this.portal.me(user.sub);
  }

  // ════════════ СТРАХОВАЯ ════════════

  @Get('company')
  @ApiOperation({ summary: 'Моя страховая компания.' })
  getCompany(@CurrentUser() user: JwtPayload) {
    return this.portal.getCompany(user.sub);
  }

  @Patch('company')
  @ApiOperation({ summary: 'Обновить профиль компании (name, description).' })
  updateCompany(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMyCompanyDto) {
    return this.portal.updateCompany(user.sub, dto);
  }

  @Post('company/logo')
  @ApiOperation({ summary: 'Загрузить логотип компании (multipart, поле "file").' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: IMG_MAX } }))
  uploadCompanyLogo(@CurrentUser() user: JwtPayload, @UploadedFile() file?: Express.Multer.File) {
    return this.portal.setCompanyLogo(user.sub, file);
  }

  @Get('company/stats')
  @ApiOperation({ summary: 'Статистика по проданным полисам компании.' })
  companyStats(@CurrentUser() user: JwtPayload) {
    return this.portal.companyStats(user.sub);
  }

  @Get('products')
  @ApiOperation({ summary: 'Продукты моей компании (с планами).' })
  listProducts(@CurrentUser() user: JwtPayload) {
    return this.portal.listProducts(user.sub);
  }

  @Get('products/:id')
  getProduct(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.portal.getProduct(user.sub, id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Создать продукт (привязывается к моей компании).' })
  createProduct(@CurrentUser() user: JwtPayload, @Body() dto: PortalCreateProductDto) {
    return this.portal.createProduct(user.sub, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PortalUpdateProductDto,
  ) {
    return this.portal.updateProduct(user.sub, id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.portal.deleteProduct(user.sub, id);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Добавить тарифный план продукту.' })
  createPlan(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlanDto) {
    return this.portal.createPlan(user.sub, dto);
  }

  @Patch('plans/:id')
  updatePlan(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.portal.updatePlan(user.sub, id, dto);
  }

  @Delete('plans/:id')
  deletePlan(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.portal.deletePlan(user.sub, id);
  }

  // ════════════ СЕРВИС-ПАРТНЁР ════════════

  @Get('partner')
  @ApiOperation({ summary: 'Моя точка-партнёр.' })
  getPartner(@CurrentUser() user: JwtPayload) {
    return this.portal.getPartner(user.sub);
  }

  @Patch('partner')
  @ApiOperation({ summary: 'Обновить профиль точки (адрес, часы, контакты).' })
  updatePartner(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMyPartnerDto) {
    return this.portal.updatePartner(user.sub, dto);
  }

  @Post('partner/logo')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: IMG_MAX } }))
  uploadPartnerLogo(@CurrentUser() user: JwtPayload, @UploadedFile() file?: Express.Multer.File) {
    return this.portal.setPartnerImage(user.sub, 'logo', file);
  }

  @Post('partner/cover')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: IMG_MAX } }))
  uploadPartnerCover(@CurrentUser() user: JwtPayload, @UploadedFile() file?: Express.Multer.File) {
    return this.portal.setPartnerImage(user.sub, 'cover', file);
  }

  @Get('services')
  @ApiOperation({ summary: 'Услуги моей точки.' })
  listServices(@CurrentUser() user: JwtPayload) {
    return this.portal.listServices(user.sub);
  }

  @Post('services')
  createService(@CurrentUser() user: JwtPayload, @Body() dto: ServiceInputDto) {
    return this.portal.createService(user.sub, dto);
  }

  @Patch('services/:id')
  updateService(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ServiceInputDto,
  ) {
    return this.portal.updateService(user.sub, id, dto);
  }

  @Delete('services/:id')
  deleteService(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.portal.deleteService(user.sub, id);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Записи клиентов в мою точку (фильтр status).' })
  bookings(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.portal.bookings(user.sub, status);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Сменить статус записи (уведомляет клиента).' })
  setBookingStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.portal.setBookingStatus(user.sub, id, dto.status);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Отзывы о моей точке.' })
  reviews(@CurrentUser() user: JwtPayload) {
    return this.portal.reviews(user.sub);
  }
}
