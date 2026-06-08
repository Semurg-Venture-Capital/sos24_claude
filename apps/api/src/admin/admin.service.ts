import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NappReferenceService } from '../napp/napp-reference.service';
import { NappService } from '../napp/napp.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly napp: NappService,
    private readonly references: NappReferenceService,
  ) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalPolicies,
      activePolicies,
      pendingPolicies,
      totalUsers,
      verifiedUsers,
      revenueAgg,
      newPoliciesToday,
      newUsersToday,
      recentPolicies,
      recentUsers,
      trendRaw,
      typeDistRaw,
    ] = await Promise.all([
      this.prisma.policy.count({ where: { status: { not: 'DRAFT' } } }),
      this.prisma.policy.count({ where: { status: 'ACTIVE' } }),
      this.prisma.policy.count({ where: { status: 'PENDING_PAYMENT' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { verificationStatus: 'MYID_VERIFIED' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      this.prisma.policy.count({ where: { status: { not: 'DRAFT' }, createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.policy.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { status: { not: 'DRAFT' } },
        include: {
          user: { select: { name: true, surname: true, phone: true } },
          vehicle: { select: { brand: true, model: true, plate: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, phone: true, name: true, surname: true, verificationStatus: true, createdAt: true },
      }),
      this.prisma.policy.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'DRAFT' } },
        select: { createdAt: true, type: true },
      }),
      this.prisma.policy.groupBy({
        by: ['type'],
        where: { status: 'ACTIVE' },
        _count: { type: true },
      }),
    ]);

    // Build 30-day trend
    const trendMap = new Map<string, { osago: number; kasko: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      trendMap.set(d.toISOString().slice(0, 10), { osago: 0, kasko: 0 });
    }
    for (const p of trendRaw) {
      const key = p.createdAt.toISOString().slice(0, 10);
      const entry = trendMap.get(key);
      if (entry) {
        if (p.type === 'OSAGO') entry.osago++;
        else if (p.type === 'KASKO') entry.kasko++;
      }
    }

    return {
      totalPolicies,
      activePolicies,
      pendingPolicies,
      totalUsers,
      verifiedUsers,
      revenue: revenueAgg._sum.amount ?? 0,
      newPoliciesToday,
      newUsersToday,
      trend: Array.from(trendMap.entries()).map(([date, c]) => ({ date, ...c })),
      typeDistribution: typeDistRaw.map((r) => ({ type: r.type, count: r._count.type })),
      recentPolicies,
      recentUsers,
    };
  }

  async getUsers(page: number, limit: number, search?: string, verified?: string) {
    const skip = (page - 1) * limit;
    const where = {
      ...(search
        ? {
            OR: [
              { phone: { contains: search } },
              { name: { contains: search, mode: 'insensitive' as const } },
              { surname: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(verified === 'true'
        ? { verificationStatus: 'MYID_VERIFIED' as const }
        : verified === 'false'
          ? { verificationStatus: 'NOT_VERIFIED' as const }
          : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          surname: true,
          patronymic: true,
          verificationStatus: true,
          role: true,
          createdAt: true,
          _count: { select: { policies: true } },
        },
      }),
    ]);

    return { total, page, limit, users };
  }

  async getPolicies(page: number, limit: number, search?: string, type?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where = {
      status: status
        ? (status as any)
        : { not: 'DRAFT' as const },
      ...(type ? { type: type as any } : {}),
      ...(search
        ? {
            OR: [
              { policyNumber: { contains: search } },
              { user: { name: { contains: search, mode: 'insensitive' as const } } },
              { user: { surname: { contains: search, mode: 'insensitive' as const } } },
              { vehicle: { plate: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [total, policies] = await Promise.all([
      this.prisma.policy.count({ where }),
      this.prisma.policy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, surname: true, phone: true } },
          vehicle: { select: { brand: true, model: true, plate: true } },
        },
      }),
    ]);

    return { total, page, limit, policies };
  }

  /** Полные MyID-данные конкретного пользователя — для тест-страницы в админке. */
  async getUserMyIdData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        surname: true,
        patronymic: true,
        nameEn: true,
        surnameEn: true,
        birthDate: true,
        birthPlace: true,
        gender: true,
        nationality: true,
        citizenship: true,
        address: true,
        pinfl: true,
        verificationStatus: true,
        createdAt: true,
        myidRaw: true,
        documents: {
          where: { kind: 'PASSPORT' },
          select: {
            series: true,
            number: true,
            pinfl: true,
            issuedAt: true,
            issuedBy: true,
            expiresAt: true,
            status: true,
          },
        },
        vehicles: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            year: true,
            color: true,
            ownerName: true,
            ownerInn: true,
            vehicleTypeId: true,
            nappSyncedAt: true,
          },
        },
      },
    });
    return user;
  }

  /** Список всех верифицированных пользователей для MyID тест-страницы. */
  async getVerifiedUsers() {
    return this.prisma.user.findMany({
      where: { verificationStatus: 'MYID_VERIFIED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        name: true,
        surname: true,
        pinfl: true,
        createdAt: true,
      },
    });
  }

  // ───────────────────────── Автомобили (НАПП) ─────────────────────────

  /** Список всех авто с пагинацией и поиском по номеру/владельцу/марке. */
  async getVehicles(page: number, limit: number, search?: string) {
    const where: import('@prisma/client').Prisma.VehicleWhereInput = search
      ? {
          OR: [
            { plate: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { ownerName: { contains: search, mode: 'insensitive' } },
            { ownerInn: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
          year: true,
          color: true,
          ownerName: true,
          ownerInn: true,
          vehicleTypeId: true,
          nappSyncedAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, surname: true, phone: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Детали авто со всеми НАПП-полями + расшифровкой справочников. */
  async getVehicle(id: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, surname: true, phone: true, pinfl: true } },
      },
    });
    if (!v) return null;

    // Расшифровка кодов справочниками НАПП.
    const vehicleType = await this.references.label('vehicle-types-osago', v.vehicleTypeId);

    return { ...v, decoded: { vehicleType } };
  }

  // ───────────────────────── Пробивка по человеку (НАПП) ─────────────────────────

  /** Админ-инструмент: данные физлица по паспорту + дате рождения. */
  async nappLookupPassport(document: string, birthDate: string) {
    return this.napp.getPersonByPassport(document, birthDate);
  }

  /** Админ-инструмент: данные физлица по ПИНФЛ + любому его документу. */
  async nappLookupPinfl(pinfl: string, document: string) {
    return this.napp.getPersonByPinfl(pinfl, document);
  }
}
