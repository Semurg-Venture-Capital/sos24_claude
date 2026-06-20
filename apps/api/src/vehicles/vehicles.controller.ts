import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SyncNappDto } from './dto/sync-napp.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Список авто пользователя.' })
  list(@CurrentUser() user: JwtPayload) {
    return this.vehicles.list(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталь авто по id (с imageUrl).' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehicles.findOneWithImage(user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить авто.' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить авто.' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(user.sub, id, dto);
  }

  @Post(':id/sync-napp')
  @ApiOperation({ summary: 'Пере-синхронизировать данные авто из НАПП по техпаспорту.' })
  syncNapp(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SyncNappDto,
  ) {
    return this.vehicles.syncNapp(user.sub, id, dto);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Загрузить фото авто (multipart, поле "file").' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    if (!/^image\/(png|jpe?g|webp|heic)$/i.test(file.mimetype)) {
      throw new BadRequestException('Только изображения (PNG, JPG, WEBP, HEIC)');
    }
    return this.vehicles.setPhoto(user.sub, id, file.buffer, file.mimetype);
  }

  @Delete(':id/photo')
  @ApiOperation({ summary: 'Удалить фото авто (вернётся к рендеру).' })
  removePhoto(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehicles.removePhoto(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить авто.' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.vehicles.remove(user.sub, id);
  }
}
