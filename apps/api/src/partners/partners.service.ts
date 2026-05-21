import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerType } from '@prisma/client';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  getAll(type?: PartnerType, city?: string) {
    return this.prisma.partner.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      },
      orderBy: { rating: 'desc' },
    });
  }
}
