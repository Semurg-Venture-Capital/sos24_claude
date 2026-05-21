import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Document, DocumentKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertDocumentDto } from './dto/upsert-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { kind: 'asc' },
    });
  }

  async findByKind(userId: string, kind: DocumentKind): Promise<Document> {
    const doc = await this.prisma.document.findUnique({
      where: { userId_kind: { userId, kind } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async upsert(userId: string, kind: DocumentKind, dto: UpsertDocumentDto): Promise<Document> {
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
    };
    return this.prisma.document.upsert({
      where: { userId_kind: { userId, kind } },
      update: payload,
      create: { userId, kind, ...payload },
    });
  }
}
