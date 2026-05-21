import { Injectable, NotFoundException } from '@nestjs/common';
import { Promo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверка промокода. Возвращает Promo если он валиден (активен, не истёк,
   * не превышен лимит использований). Иначе бросает 404.
   */
  async validate(code: string): Promise<Promo> {
    const promo = await this.prisma.promo.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!promo || !promo.isActive) throw new NotFoundException('Промокод не найден');

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) throw new NotFoundException('Промокод не активен');
    if (promo.validUntil && now > promo.validUntil) throw new NotFoundException('Промокод истёк');
    if (promo.maxUses !== null && promo.usesCount >= promo.maxUses) {
      throw new NotFoundException('Промокод исчерпан');
    }

    return promo;
  }
}
