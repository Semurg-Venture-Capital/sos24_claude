import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CatalogQueryDto, CreateBookingDto, CreateReviewDto, NearbyQueryDto, SlotsQueryDto } from './dto/partners.dto';
import { PartnersService } from './partners.service';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly service: PartnersService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Категории партнёров.' })
  categories() {
    return this.service.listCategories();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Ближайшие партнёры по геолокации (для Home).' })
  nearby(@Query() query: NearbyQueryDto) {
    return this.service.nearby(query);
  }

  @Get('me/bookings')
  @ApiOperation({ summary: 'Мои записи к партнёрам.' })
  myBookings(@CurrentUser() user: JwtPayload) {
    return this.service.myBookings(user.sub);
  }

  @Patch('me/bookings/:id/cancel')
  @ApiOperation({ summary: 'Отменить мою запись.' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancelMyBooking(user.sub, id);
  }

  @Get()
  @ApiOperation({ summary: 'Каталог партнёров (поиск, категория, рядом, сортировка).' })
  catalog(@Query() query: CatalogQueryDto) {
    return this.service.catalog(query);
  }

  @Post(':id/bookings')
  @ApiOperation({ summary: 'Записаться к партнёру.' })
  book(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateBookingDto) {
    return this.service.createBooking(user.sub, id, dto);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Оставить отзыв (после завершённой записи).' })
  review(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.service.createReview(user.sub, id, dto);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Доступные слоты времени на дату.' })
  slots(@Param('id') id: string, @Query() query: SlotsQueryDto) {
    return this.service.slots(id, query.date, query.serviceId);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Отзывы партнёра (пагинация курсором).' })
  reviews(@Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.service.reviews(id, cursor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка партнёра (детали + услуги + отзывы).' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }
}
