import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { PromoService } from './promo.service';

@ApiTags('promo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('promo')
export class PromoController {
  constructor(private readonly promo: PromoService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Проверка промокода. 404 если невалиден / истёк.' })
  async validate(@Body() dto: ValidatePromoDto) {
    const p = await this.promo.validate(dto.code);
    return { code: p.code, discountPct: p.discountPct };
  }
}
