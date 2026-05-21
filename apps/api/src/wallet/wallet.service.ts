import { BadRequestException, Injectable } from '@nestjs/common';
import { Wallet, WalletTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Возвращает кошелёк пользователя. Если ещё не создан — создаёт с балансом 0
   * (lazy init). Кошелёк всегда 1:1 с пользователем.
   */
  async getOrCreate(userId: string): Promise<Wallet> {
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    });
  }

  async getTransactions(walletId: string, limit = 50): Promise<WalletTransaction[]> {
    return this.prisma.walletTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async topup(userId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('amount must be positive');
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount,
          description: 'Пополнение кошелька',
        },
      });
      return wallet;
    });
  }

  /**
   * Списание с кошелька (для оплаты полиса). Бросает 400 если недостаточно.
   * Не публичный endpoint — вызывается из PaymentsService.
   */
  async debit(userId: string, amount: number, paymentId: string, description?: string): Promise<Wallet> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Кошелёк не найден');
      if (wallet.balance < amount) throw new BadRequestException('Недостаточно средств');

      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: -amount,
          description: description ?? 'Оплата полиса',
          paymentId,
        },
      });
      return updated;
    });
  }
}
