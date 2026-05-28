import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Payment, PaymentMethod, PaymentStatus } from '@prisma/client';
import { CardsService } from '../cards/cards.service';
import { PoliciesService } from '../policies/policies.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PayPolicyDto } from './dto/pay-policy.dto';

export interface PaymeInitResult {
  paymentId: string;
  redirectUrl: string;
}

export interface ClickInitResult {
  paymentId: string;
  redirectUrl: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly policies: PoliciesService,
    private readonly cards: CardsService,
  ) {}

  async payForPolicy(userId: string, dto: PayPolicyDto): Promise<Payment & { policy?: unknown }> {
    const policy = await this.prisma.policy.findFirst({
      where: { id: dto.policyId, userId },
    });
    if (!policy) throw new NotFoundException('Полис не найден');
    if (policy.status === 'ACTIVE') throw new BadRequestException('Полис уже оплачен');
    if (policy.status === 'CANCELLED' || policy.status === 'EXPIRED') {
      throw new BadRequestException('Полис недоступен для оплаты');
    }

    if (dto.method === 'CARD') {
      if (!dto.cardId) throw new BadRequestException('cardId обязателен для оплаты картой');
      const card = await this.prisma.card.findFirst({ where: { id: dto.cardId, userId } });
      if (!card) throw new BadRequestException('Карта не найдена');
      if (card.balance < policy.totalPrice) {
        const payment = await this.prisma.payment.create({
          data: {
            userId,
            policyId: policy.id,
            amount: policy.totalPrice,
            method: dto.method,
            cardId: dto.cardId,
            status: 'PENDING',
          },
        });
        return this.failPayment(payment.id, policy.id, 'Недостаточно средств на карте');
      }
    }

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

    await this.prisma.policy.update({
      where: { id: policy.id },
      data: { status: 'PENDING_PAYMENT' },
    });

    await sleep(1500);

    if (dto.method === 'WALLET') {
      try {
        await this.wallet.debit(userId, policy.totalPrice, payment.id, `Полис ${policy.type}`);
      } catch (e) {
        return this.failPayment(payment.id, policy.id, e instanceof Error ? e.message : 'Wallet debit failed');
      }
    }

    if (dto.method === 'CARD' && dto.cardId) {
      await this.cards.debitBalance(dto.cardId, policy.totalPrice);
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCESS, paidAt: new Date() },
    });
    const activated = await this.policies.activate(policy.id);
    return { ...updated, policy: activated };
  }

  /** Инициализация оплаты через Payme. Возвращает redirect URL для мобилки. */
  async initPayme(userId: string, policyId: string): Promise<PaymeInitResult> {
    const policy = await this.prisma.policy.findFirst({ where: { id: policyId, userId } });
    if (!policy) throw new NotFoundException('Полис не найден');
    if (policy.status === 'ACTIVE') throw new BadRequestException('Полис уже оплачен');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        policyId: policy.id,
        amount: policy.totalPrice,
        method: PaymentMethod.PAYME,
        status: 'PENDING',
      },
    });

    await this.prisma.policy.update({
      where: { id: policy.id },
      data: { status: 'PENDING_PAYMENT' },
    });

    const merchantId = process.env.PAYME_MERCHANT_ID ?? 'test_merchant';
    // Payme ожидает сумму в тийинах (1 сум = 100 тийин)
    const amountTiyin = policy.totalPrice * 100;
    const params = `m=${merchantId};ac.order_id=${payment.id};a=${amountTiyin};l=ru`;
    const encoded = Buffer.from(params).toString('base64');
    const baseUrl = process.env.PAYME_BASE_URL ?? 'https://checkout.paycom.uz';
    const redirectUrl = `${baseUrl}/${encoded}`;

    return { paymentId: payment.id, redirectUrl };
  }

  /** Инициализация оплаты через Click. Возвращает redirect URL для мобилки. */
  async initClick(userId: string, policyId: string): Promise<ClickInitResult> {
    const policy = await this.prisma.policy.findFirst({ where: { id: policyId, userId } });
    if (!policy) throw new NotFoundException('Полис не найден');
    if (policy.status === 'ACTIVE') throw new BadRequestException('Полис уже оплачен');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        policyId: policy.id,
        amount: policy.totalPrice,
        method: PaymentMethod.CLICK,
        status: 'PENDING',
      },
    });

    await this.prisma.policy.update({
      where: { id: policy.id },
      data: { status: 'PENDING_PAYMENT' },
    });

    const serviceId = process.env.CLICK_SERVICE_ID ?? '0';
    const merchantId = process.env.CLICK_MERCHANT_ID ?? '0';
    const returnUrl = encodeURIComponent(`sos24://payment/result?paymentId=${payment.id}`);
    const redirectUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${policy.totalPrice}&transaction_param=${payment.id}&return_url=${returnUrl}`;

    return { paymentId: payment.id, redirectUrl };
  }

  /** Webhook от Payme — JSON-RPC протокол. */
  async handlePaymeCallback(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const method = body['method'] as string;
    const params = (body['params'] ?? {}) as Record<string, unknown>;
    const id = body['id'];

    try {
      switch (method) {
        case 'CheckPerformTransaction': {
          const orderId = (params['account'] as Record<string, string>)?.['order_id'];
          const payment = await this.prisma.payment.findUnique({ where: { id: orderId } });
          if (!payment) return { id, result: { allow: false } };
          return { id, result: { allow: payment.status === 'PENDING' } };
        }
        case 'CreateTransaction': {
          const orderId = (params['account'] as Record<string, string>)?.['order_id'];
          const payment = await this.prisma.payment.findUnique({ where: { id: orderId } });
          if (!payment || payment.status !== 'PENDING') {
            return { id, error: { code: -31050, message: 'Order not found or not payable' } };
          }
          return { id, result: { create_time: Date.now(), transaction: payment.id, state: 1 } };
        }
        case 'PerformTransaction': {
          const txId = params['id'] as string;
          const payment = await this.prisma.payment.findUnique({ where: { id: txId } });
          if (!payment) return { id, error: { code: -31050, message: 'Transaction not found' } };
          if (payment.status === 'SUCCESS') {
            return { id, result: { transaction: payment.id, perform_time: payment.paidAt?.getTime() ?? Date.now(), state: 2 } };
          }
          await this.prisma.payment.update({
            where: { id: txId },
            data: { status: 'SUCCESS', paidAt: new Date() },
          });
          await this.policies.activate(payment.policyId);
          return { id, result: { transaction: payment.id, perform_time: Date.now(), state: 2 } };
        }
        case 'CancelTransaction': {
          const txId = params['id'] as string;
          const payment = await this.prisma.payment.findUnique({ where: { id: txId } });
          if (!payment) return { id, error: { code: -31050, message: 'Transaction not found' } };
          if (payment.status !== 'SUCCESS') {
            await this.prisma.payment.update({ where: { id: txId }, data: { status: 'FAILED', error: 'Cancelled by Payme' } });
            await this.prisma.policy.update({ where: { id: payment.policyId }, data: { status: 'DRAFT' } });
          }
          return { id, result: { transaction: payment.id, cancel_time: Date.now(), state: -1 } };
        }
        case 'CheckTransaction': {
          const txId = params['id'] as string;
          const payment = await this.prisma.payment.findUnique({ where: { id: txId } });
          if (!payment) return { id, error: { code: -31050, message: 'Transaction not found' } };
          const state = payment.status === 'SUCCESS' ? 2 : payment.status === 'FAILED' ? -1 : 1;
          return { id, result: { create_time: new Date(payment.createdAt).getTime(), perform_time: payment.paidAt?.getTime() ?? 0, cancel_time: 0, transaction: payment.id, state, reason: null } };
        }
        default:
          return { id, error: { code: -32601, message: 'Method not found' } };
      }
    } catch {
      return { id, error: { code: -31008, message: 'Internal error' } };
    }
  }

  /** Webhook от Click — action=0 (Prepare) или action=1 (Complete). */
  async handleClickCallback(body: Record<string, string>): Promise<Record<string, unknown>> {
    const { click_trans_id, merchant_trans_id, amount, action, error: clickError } = body;
    const payment = await this.prisma.payment.findUnique({ where: { id: merchant_trans_id } });

    if (!payment) return { error: -5, error_note: 'Payment not found' };

    const expectedAmount = payment.amount;
    if (parseFloat(amount) !== expectedAmount) return { error: -2, error_note: 'Incorrect amount' };

    if (action === '0') {
      // Prepare — проверяем что можно принять платёж
      if (payment.status !== 'PENDING') return { error: -4, error_note: 'Already paid or cancelled' };
      return { click_trans_id, merchant_trans_id, merchant_prepare_id: payment.id, error: 0, error_note: 'Success' };
    }

    if (action === '1') {
      // Complete — подтверждаем платёж
      if (clickError && parseInt(clickError) < 0) {
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', error: `Click error ${clickError}` } });
        await this.prisma.policy.update({ where: { id: payment.policyId }, data: { status: 'DRAFT' } });
        return { click_trans_id, merchant_trans_id, error: 0, error_note: 'Cancelled' };
      }
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', paidAt: new Date() } });
      await this.policies.activate(payment.policyId);
      return { click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' };
    }

    return { error: -3, error_note: 'Action not found' };
  }

  /** История платежей пользователя. */
  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async failPayment(paymentId: string, policyId: string, error: string): Promise<Payment> {
    await this.prisma.policy.update({
      where: { id: policyId },
      data: { status: 'DRAFT' },
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
