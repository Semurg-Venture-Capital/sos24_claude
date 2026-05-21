import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Policy, PolicyStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PromoService } from '../promo/promo.service';
import { CalculatePolicyDto } from './dto/calculate-policy.dto';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { calculatePrice, type PriceCalculation } from './pricing';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promo: PromoService,
  ) {}

  /**
   * Расчёт цены полиса. Не сохраняет в БД, только возвращает breakdown.
   */
  async calculate(userId: string, dto: CalculatePolicyDto): Promise<PriceCalculation & { promo?: { code: string; discountPct: number } }> {
    // Для OSAGO/KASKO — проверяем что у юзера есть указанное авто
    if ((dto.type === 'OSAGO' || dto.type === 'KASKO') && dto.vehicleId) {
      const v = await this.prisma.vehicle.findFirst({ where: { id: dto.vehicleId, userId } });
      if (!v) throw new BadRequestException('Указанное авто не найдено у пользователя');
    }

    let discountPct = 0;
    let promoInfo: { code: string; discountPct: number } | undefined;
    if (dto.promoCode) {
      const promo = await this.promo.validate(dto.promoCode);
      discountPct = promo.discountPct;
      promoInfo = { code: promo.code, discountPct: promo.discountPct };
    }

    const price = calculatePrice({
      type: dto.type,
      periodMonths: dto.periodMonths,
      driverLimit: dto.driverLimit,
      discountPct,
    });

    return { ...price, promo: promoInfo };
  }

  /**
   * Создаёт полис в статусе DRAFT (черновик до оплаты). После оплаты статус
   * переходит в ACTIVE через PaymentsService (S4).
   */
  async createDraft(userId: string, dto: CreatePolicyDto): Promise<Policy> {
    const isVehicleProduct = dto.type === 'OSAGO' || dto.type === 'KASKO';

    if (isVehicleProduct && !dto.vehicleId) {
      throw new BadRequestException('vehicleId обязателен для OSAGO/KASKO');
    }
    if (isVehicleProduct && dto.vehicleId) {
      const v = await this.prisma.vehicle.findFirst({ where: { id: dto.vehicleId, userId } });
      if (!v) throw new BadRequestException('Указанное авто не найдено');
    }

    // Проверка водителей (если переданы)
    if (dto.driverIds && dto.driverIds.length > 0) {
      const drivers = await this.prisma.driver.findMany({
        where: { id: { in: dto.driverIds }, userId },
      });
      if (drivers.length !== dto.driverIds.length) {
        throw new BadRequestException('Часть водителей не найдена');
      }
    }

    // Цена
    let discountPct = 0;
    let promoCode: string | null = null;
    if (dto.promoCode) {
      const promo = await this.promo.validate(dto.promoCode);
      discountPct = promo.discountPct;
      promoCode = promo.code;
    }
    const price = calculatePrice({
      type: dto.type,
      periodMonths: dto.periodMonths,
      driverLimit: dto.driverLimit,
      discountPct,
    });

    const periodMonths = dto.periodMonths ?? 12;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + periodMonths);

    const policy = await this.prisma.policy.create({
      data: {
        userId,
        type: dto.type,
        status: PolicyStatus.DRAFT,
        vehicleId: isVehicleProduct ? dto.vehicleId! : null,
        startDate,
        endDate,
        periodMonths,
        driverLimit: dto.driverLimit ?? 'LIMITED',
        basePrice: price.basePrice,
        discount: price.discount,
        totalPrice: price.totalPrice,
        promoCode,
        coefficients: (price.coefficients ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
        drivers: dto.driverIds
          ? { create: dto.driverIds.map((driverId) => ({ driverId })) }
          : undefined,
      },
      include: { drivers: { include: { driver: true } }, vehicle: true },
    });

    return policy;
  }

  async list(userId: string, status?: PolicyStatus): Promise<Policy[]> {
    return this.prisma.policy.findMany({
      where: { userId, ...(status ? { status } : {}) },
      include: { vehicle: true, drivers: { include: { driver: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Policy> {
    const p = await this.prisma.policy.findFirst({
      where: { id, userId },
      include: { vehicle: true, drivers: { include: { driver: true } } },
    });
    if (!p) throw new NotFoundException('Policy not found');
    return p;
  }

  /**
   * Перевод полиса в ACTIVE — вызывается из PaymentsService после успешной
   * оплаты (S4). Здесь генерируем policyNumber и qrPayload.
   */
  async activate(policyId: string): Promise<Policy> {
    const policy = await this.prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.status === 'ACTIVE') return policy;

    const policyNumber = generatePolicyNumber(policy.type);
    const qrPayload = `sos24://policy/${policyId}`;

    return this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: PolicyStatus.ACTIVE,
        activatedAt: new Date(),
        policyNumber,
        qrPayload,
      },
    });
  }
}

function generatePolicyNumber(type: string): string {
  const prefix = type === 'OSAGO' ? '1224' : type === 'KASKO' ? '1225' : '1230';
  const a = Math.floor(1000 + Math.random() * 9000);
  const b = Math.floor(1000 + Math.random() * 9000);
  return `№ ${prefix} ${a} ${b}`;
}
