import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Document, DocumentKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../files/minio.service';
import { UpdateDocumentScansDto, UpsertDocumentDto } from './dto/upsert-document.dto';

const SCAN_TTL = 600; // presigned GET — 10 мин

// Document + presigned-ссылки на скан + флаг «оформлен» (для UI и гейтов).
export type DocumentWithScans = Document & {
  frontImageUrl: string | null;
  backImageUrl: string | null;
  isComplete: boolean;
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async list(userId: string): Promise<DocumentWithScans[]> {
    const docs = await this.prisma.document.findMany({ where: { userId }, orderBy: { kind: 'asc' } });
    return Promise.all(docs.map((d) => this.enrich(d)));
  }

  async findByKind(userId: string, kind: DocumentKind): Promise<DocumentWithScans> {
    const doc = await this.prisma.document.findUnique({ where: { userId_kind: { userId, kind } } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.enrich(doc);
  }

  async upsert(userId: string, kind: DocumentKind, dto: UpsertDocumentDto): Promise<DocumentWithScans> {
    // PINFL обязателен для паспорта, для ВУ — игнорируем
    if (kind === 'PASSPORT' && !dto.pinfl) {
      throw new BadRequestException('PINFL обязателен для паспорта');
    }
    // Срок и категории — только для ВУ; для паспорта — отбрасываем
    const payload = {
      series: dto.series,
      number: dto.number,
      issuedAt: new Date(dto.issuedAt),
      issuedBy: dto.issuedBy ?? null,
      pinfl: kind === 'PASSPORT' ? dto.pinfl! : null,
      expiresAt: kind === 'DRIVER_LICENSE' && dto.expiresAt ? new Date(dto.expiresAt) : null,
      categories: kind === 'DRIVER_LICENSE' ? dto.categories ?? null : null,
      ...(dto.frontImageKey !== undefined ? { frontImageKey: dto.frontImageKey || null } : {}),
      ...(dto.backImageKey !== undefined ? { backImageKey: dto.backImageKey || null } : {}),
    };
    const doc = await this.prisma.document.upsert({
      where: { userId_kind: { userId, kind } },
      update: payload,
      create: { userId, kind, ...payload },
    });
    return this.enrich(doc);
  }

  // Обновить только скан (документ уже должен существовать — для MyID-паспорта он
  // создаётся при верификации, данные read-only).
  async updateScans(
    userId: string,
    kind: DocumentKind,
    dto: UpdateDocumentScansDto,
  ): Promise<DocumentWithScans> {
    const existing = await this.prisma.document.findUnique({ where: { userId_kind: { userId, kind } } });
    if (!existing) {
      throw new NotFoundException('Сначала заполните данные документа');
    }
    const doc = await this.prisma.document.update({
      where: { userId_kind: { userId, kind } },
      data: {
        ...(dto.frontImageKey !== undefined ? { frontImageKey: dto.frontImageKey || null } : {}),
        ...(dto.backImageKey !== undefined ? { backImageKey: dto.backImageKey || null } : {}),
      },
    });
    return this.enrich(doc);
  }

  // «Оформлен»: для паспорта нужны данные + ОБА скана; для ВУ — только данные.
  private isComplete(doc: Document): boolean {
    if (doc.kind === 'PASSPORT') {
      return !!(doc.series && doc.number && doc.pinfl && doc.frontImageKey && doc.backImageKey);
    }
    return !!(doc.series && doc.number);
  }

  private async enrich(doc: Document): Promise<DocumentWithScans> {
    const [frontImageUrl, backImageUrl] = await Promise.all([
      doc.frontImageKey ? this.minio.presignedGetUrl(doc.frontImageKey, SCAN_TTL).catch(() => null) : null,
      doc.backImageKey ? this.minio.presignedGetUrl(doc.backImageKey, SCAN_TTL).catch(() => null) : null,
    ]);
    return { ...doc, frontImageUrl, backImageUrl, isComplete: this.isComplete(doc) };
  }
}
