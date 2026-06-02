import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
}
