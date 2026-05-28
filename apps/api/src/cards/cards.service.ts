import { Injectable, NotFoundException } from '@nestjs/common';
import { Card } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Card[]> {
    return this.prisma.card.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(userId: string, id: string): Promise<Card> {
    const c = await this.prisma.card.findFirst({ where: { id, userId } });
    if (!c) throw new NotFoundException('Card not found');
    return c;
  }

  async create(userId: string, dto: CreateCardDto): Promise<Card> {
    const existing = await this.prisma.card.count({ where: { userId } });
    const token = `mock_${randomBytes(8).toString('hex')}`;
    // Рандомный mock-баланс 2M–8M сум
    const balance = Math.floor(Math.random() * 6_000_000) + 2_000_000;
    return this.prisma.card.create({
      data: {
        userId,
        brand: dto.brand,
        last4: dto.last4,
        expiry: dto.expiry,
        token,
        isDefault: existing === 0,
        balance,
      },
    });
  }

  async setDefault(userId: string, id: string): Promise<Card> {
    await this.findOne(userId, id);
    await this.prisma.card.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.card.update({ where: { id }, data: { isDefault: true } });
  }

  async debitBalance(id: string, amount: number): Promise<void> {
    await this.prisma.card.update({
      where: { id },
      data: { balance: { decrement: amount } },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const card = await this.findOne(userId, id);
    await this.prisma.card.delete({ where: { id } });
    // Если удалили дефолтную — повысить первую оставшуюся.
    if (card.isDefault) {
      const first = await this.prisma.card.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (first) {
        await this.prisma.card.update({ where: { id: first.id }, data: { isDefault: true } });
      }
    }
  }
}
