import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Payment, PaymentStatus } from '@prisma/client';
import { PoliciesService } from '../policies/policies.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PayPolicyDto } from './dto/pay-policy.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly policies: PoliciesService,
  ) {}

  /**
   * Mock-платёж Uzcard. В реале — запрос к Uzcard API.
   * Здесь: 1.5с задержка, 90% — успех, 10% — рандомная ошибка.
   * При успехе списывает с кошелька (если method=WALLET) и активирует полис.
   */
  async payForPolicy(userId: string, dto: PayPolicyDto): Promise<Payment & { policy?: unknown }> {
    const policy = await this.prisma.policy.findFirst({
      where: { id: dto.policyId, userId },
    });
    if (!policy) throw new NotFoundException('Полис не найден');
    if (policy.status === 'ACTIVE') throw new BadRequestException('Полис уже оплачен');
    if (policy.status === 'CANCELLED' || policy.status === 'EXPIRED') {
      throw new BadRequestException('Полис недоступен для оплаты');
    }

    // Проверка карты (если method=CARD)
    if (dto.method === 'CARD') {
      if (!dto.cardId) throw new BadRequestException('cardId обязателен для оплаты картой');
      const card = await this.prisma.card.findFirst({ where: { id: dto.cardId, userId } });
      if (!card) throw new BadRequestException('Карта не найдена');
    }

    // Создаём Payment в PENDING
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        policyId: policy.id,
        amount: policy.totalPrice,
        method: dto.method,
        cardId: dto.method === 'CARD' ? dto.cardId! : null,
        status: 'PENDING',
      },
    });

    // Полис переводим в PENDING_PAYMENT
    await this.prisma.policy.update({
      where: { id: policy.id },
      data: { status: 'PENDING_PAYMENT' },
    });

    // Имитация задержки платёжного шлюза
    await sleep(1500);

    // Списание с кошелька — здесь же. Если не хватает — fail.
    if (dto.method === 'WALLET') {
      try {
        await this.wallet.debit(userId, policy.totalPrice, payment.id, `Полис ${policy.type}`);
      } catch (e) {
        return this.failPayment(payment.id, policy.id, e instanceof Error ? e.message : 'Wallet debit failed');
      }
    }

    // 10% случайных fail (имитация банк-отказа)
    if (Math.random() < 0.1) {
      const reasons = ['Insufficient funds', 'Card expired', 'Issuer declined', 'Network timeout'];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      return this.failPayment(payment.id, policy.id, reason);
    }

    // SUCCESS
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCESS, paidAt: new Date() },
    });
    const activated = await this.policies.activate(policy.id);
    return { ...updated, policy: activated };
  }

  private async failPayment(paymentId: string, policyId: string, error: string): Promise<Payment> {
    await this.prisma.policy.update({
      where: { id: policyId },
      data: { status: 'DRAFT' }, // обратно в DRAFT чтобы можно было попробовать ещё раз
    });
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED, error },
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
