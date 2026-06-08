import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NappService } from '../napp/napp.service';
import { AdminGuard } from './admin.guard';
import {
  NappLookupCadasterDto,
  NappLookupDiscountsDto,
  NappLookupDriverLicenseDto,
  NappLookupDriverSummaryDto,
  NappLookupGovNumberDto,
  NappLookupInnDto,
  NappLookupPassportDto,
  NappLookupPensionerDto,
  NappLookupPinflDto,
  NappLookupPinflOnlyDto,
  NappLookupVehicleDto,
} from './dto/napp-lookup.dto';

/**
 * «Отдел NAPP» — инструменты пробивки данных через гос-шлюз НАПП.
 * Все эндпоинты только для админов. Каждый возвращает конверт НАПП { error, error_message, result }.
 */
@ApiTags('admin-napp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/napp/lookup')
export class NappToolsController {
  constructor(private readonly napp: NappService) {}

  // ── Человек ──────────────────────────────────────────────
  @Post('passport')
  @ApiOperation({ summary: 'Человек по паспорту + дате рождения.' })
  passport(@Body() dto: NappLookupPassportDto) {
    return this.napp.getPersonByPassport(dto.document, dto.birthDate);
  }

  @Post('pinfl')
  @ApiOperation({ summary: 'Человек по ПИНФЛ + документу.' })
  pinfl(@Body() dto: NappLookupPinflDto) {
    return this.napp.getPersonByPinfl(dto.pinfl, dto.document);
  }

  // ── Водитель ─────────────────────────────────────────────
  @Post('driver-summary')
  @ApiOperation({ summary: 'Сводка по водителю: личные данные + ВУ + КБМ.' })
  driverSummary(@Body() dto: NappLookupDriverSummaryDto) {
    return this.napp.getDriverSummary(dto.pinfl, dto.document);
  }

  @Post('driver-license')
  @ApiOperation({ summary: 'Водительское удостоверение по ПИНФЛ.' })
  driverLicense(@Body() dto: NappLookupDriverLicenseDto) {
    return this.napp.getDriverLicense(dto.pinfl, dto.passportSeries, dto.passportNumber);
  }

  @Post('coefficient')
  @ApiOperation({ summary: 'КБМ (бонус-малус) по ПИНФЛ.' })
  coefficient(@Body() dto: NappLookupPinflOnlyDto) {
    return this.napp.getDriverCoefficient(dto.pinfl);
  }

  @Post('pensioner')
  @ApiOperation({ summary: 'Пенсионный статус по ПИНФЛ + паспорту.' })
  pensioner(@Body() dto: NappLookupPensionerDto) {
    return this.napp.getIsPensioner(dto.pinfl, dto.passportSeries, dto.passportNumber);
  }

  // ── Авто ─────────────────────────────────────────────────
  @Post('vehicle')
  @ApiOperation({ summary: 'Авто по техпаспорту + госномеру.' })
  vehicle(@Body() dto: NappLookupVehicleDto) {
    return this.napp.getVehicleByTechPassport(dto.techPassportSeria, dto.techPassportNumber, dto.govNumber);
  }

  @Post('foreign-vehicle')
  @ApiOperation({ summary: 'Иностранное ТС по госномеру.' })
  foreignVehicle(@Body() dto: NappLookupGovNumberDto) {
    return this.napp.getForeignVehicle(dto.govNumber);
  }

  @Post('passenger-license')
  @ApiOperation({ summary: 'Лицензия пассажироперевозчика по госномеру.' })
  passengerLicense(@Body() dto: NappLookupGovNumberDto) {
    return this.napp.getPassengerLicense(dto.govNumber);
  }

  @Post('discounts')
  @ApiOperation({ summary: 'Применённые скидки по ПИНФЛ + госномеру.' })
  discounts(@Body() dto: NappLookupDiscountsDto) {
    return this.napp.getProvidedDiscounts(dto.pinfl, dto.govNumber);
  }

  // ── Компания / имущество ─────────────────────────────────
  @Post('inn')
  @ApiOperation({ summary: 'Организация по ИНН.' })
  inn(@Body() dto: NappLookupInnDto) {
    return this.napp.getOrganizationByInn(dto.inn);
  }

  @Post('cadaster')
  @ApiOperation({ summary: 'Недвижимость по кадастровому номеру.' })
  cadaster(@Body() dto: NappLookupCadasterDto) {
    return this.napp.getCadaster(dto.cadasterNumber);
  }
}
