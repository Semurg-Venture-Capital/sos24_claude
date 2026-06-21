import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../admin/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoryDto, PartnerInputDto, ServiceInputDto, UpdateBookingStatusDto } from './dto/partners.dto';
import { PartnersService } from './partners.service';

@ApiTags('admin-partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/partners')
export class PartnersAdminController {
  constructor(private readonly service: PartnersService) {}

  // — Категории —
  @Get('categories')
  categories() {
    return this.service.adminCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  // — Записи —
  @Get('bookings')
  @ApiOperation({ summary: 'Все записи (фильтры status, partnerId).' })
  bookings(@Query('status') status?: string, @Query('partnerId') partnerId?: string) {
    return this.service.adminBookings(status, partnerId);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Сменить статус записи (уведомляет пользователя).' })
  setBookingStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.service.setBookingStatus(id, dto.status);
  }

  // — Услуги —
  @Patch('services/:serviceId')
  updateService(@Param('serviceId') serviceId: string, @Body() dto: ServiceInputDto) {
    return this.service.updateService(serviceId, dto);
  }

  @Delete('services/:serviceId')
  deleteService(@Param('serviceId') serviceId: string) {
    return this.service.deleteService(serviceId);
  }

  // — Отзывы —
  @Delete('reviews/:reviewId')
  deleteReview(@Param('reviewId') reviewId: string) {
    return this.service.deleteReview(reviewId);
  }

  // — Партнёры —
  @Get()
  list(@Query('search') search?: string, @Query('categoryId') categoryId?: string) {
    return this.service.adminList(search, categoryId);
  }

  @Post()
  create(@Body() dto: PartnerInputDto) {
    return this.service.createPartner(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.adminGet(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: PartnerInputDto) {
    return this.service.updatePartner(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deletePartner(id);
  }

  @Get(':id/reviews')
  reviews(@Param('id') id: string) {
    return this.service.adminReviews(id);
  }

  @Post(':id/services')
  createService(@Param('id') id: string, @Body() dto: ServiceInputDto) {
    return this.service.createService(id, dto);
  }
}
