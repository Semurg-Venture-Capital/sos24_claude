import { BadRequestException, Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DocumentKind } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { DocumentsService } from './documents.service';
import { UpdateDocumentScansDto, UpsertDocumentDto } from './dto/upsert-document.dto';

// Принимаем 'passport' / 'license' от мобайла, маппим в enum.
const KIND_MAP: Record<string, DocumentKind> = {
  passport: 'PASSPORT',
  license: 'DRIVER_LICENSE',
};

function parseKind(input: string): DocumentKind {
  const kind = KIND_MAP[input.toLowerCase()];
  if (!kind) throw new BadRequestException('kind must be one of: passport, license');
  return kind;
}

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Все документы пользователя (паспорт, ВУ).' })
  list(@CurrentUser() user: JwtPayload) {
    return this.documents.list(user.sub);
  }

  @Get(':kind')
  @ApiParam({ name: 'kind', enum: ['passport', 'license'] })
  @ApiOperation({ summary: 'Один документ по типу.' })
  findOne(@CurrentUser() user: JwtPayload, @Param('kind') kind: string) {
    return this.documents.findByKind(user.sub, parseKind(kind));
  }

  @Put(':kind')
  @ApiParam({ name: 'kind', enum: ['passport', 'license'] })
  @ApiOperation({ summary: 'Создать или обновить документ (по типу).' })
  upsert(
    @CurrentUser() user: JwtPayload,
    @Param('kind') kind: string,
    @Body() dto: UpsertDocumentDto,
  ) {
    return this.documents.upsert(user.sub, parseKind(kind), dto);
  }

  @Patch(':kind/scans')
  @ApiParam({ name: 'kind', enum: ['passport', 'license'] })
  @ApiOperation({ summary: 'Обновить только скан документа (лицевая/обратная).' })
  updateScans(
    @CurrentUser() user: JwtPayload,
    @Param('kind') kind: string,
    @Body() dto: UpdateDocumentScansDto,
  ) {
    return this.documents.updateScans(user.sub, parseKind(kind), dto);
  }
}
