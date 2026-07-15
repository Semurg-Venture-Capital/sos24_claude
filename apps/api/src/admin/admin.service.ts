import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NappReferenceService } from '../napp/napp-reference.service';
import type { CreateUserDto, UpdateUserDto } from './dto/user-management.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly references: NappReferenceService,
  ) {}

  // Лог использования ИИ (Gemini): список запросов + агрегаты по токенам и фичам.
  async getAiUsage(params: { page?: number; limit?: number; feature?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 50));
    const where: Prisma.AiUsageLogWhereInput = params.feature ? { feature: params.feature } : {};
    const [rows, total, totals, byFeature] = await Promise.all([
      this.prisma.aiUsageLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.aiUsageLog.count({ where }),
      this.prisma.aiUsageLog.aggregate({ _sum: { totalTokens: true, promptTokens: true, outputTokens: true }, _count: true }),
      this.prisma.aiUsageLog.groupBy({ by: ['feature'], _sum: { totalTokens: true }, _count: true }),
    ]);

    // У AiUsageLog нет связи с User — подтягиваем данные пользователей одним запросом.
    const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, surname: true, phone: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const items = rows.map((r) => {
      const u = r.userId ? userMap.get(r.userId) : undefined;
      return {
        ...r,
        user: u
          ? { id: u.id, name: [u.name, u.surname].filter(Boolean).join(' ') || null, phone: u.phone }
          : null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      summary: {
        calls: totals._count,
        totalTokens: totals._sum.totalTokens ?? 0,
        promptTokens: totals._sum.promptTokens ?? 0,
        outputTokens: totals._sum.outputTokens ?? 0,
        byFeature: byFeature
          .map((f) => ({ feature: f.feature, calls: f._count, tokens: f._sum.totalTokens ?? 0 }))
          .sort((a, b) => b.tokens - a.tokens),
      },
    };
  }

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

  async getUsers(page: number, limit: number, search?: string, verified?: string, role?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {
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
      ...(role && role in UserRole ? { role: role as UserRole } : {}),
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

  private readonly USER_SELECT = {
    id: true,
    phone: true,
    name: true,
    surname: true,
    patronymic: true,
    verificationStatus: true,
    role: true,
    createdAt: true,
    sipExtension: true, // секрет (sipSecret) не отдаём
    // Привязка B2B-кабинета (роль PARTNER): какой компанией/точкой владеет пользователь.
    ownedCompany: { select: { id: true, name: true } },
    ownedPartner: { select: { id: true, name: true } },
    _count: { select: { policies: true } },
  } as const;

  // Создание пользователя (оператор поддержки, аджастер, админ и т.д.).
  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone }, select: { id: true } });
    if (exists) throw new BadRequestException('Пользователь с таким телефоном уже существует');
    const created = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        role: dto.role,
        name: dto.name?.trim() || null,
        surname: dto.surname?.trim() || null,
        patronymic: dto.patronymic?.trim() || null,
        sipExtension: dto.sipExtension?.trim() || null,
        sipSecret: dto.sipSecret?.trim() || null,
      },
      select: { id: true },
    });
    await this.applyPartnerLink(created.id, dto.role, dto.linkCompanyId, dto.linkPartnerId);
    return this.prisma.user.findUnique({ where: { id: created.id }, select: this.USER_SELECT });
  }

  // Изменение пользователя (роль, ФИО, телефон).
  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (dto.phone) {
      const other = await this.prisma.user.findUnique({ where: { phone: dto.phone }, select: { id: true } });
      if (other && other.id !== id) throw new BadRequestException('Телефон занят другим пользователем');
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
        ...(dto.surname !== undefined ? { surname: dto.surname.trim() || null } : {}),
        ...(dto.patronymic !== undefined ? { patronymic: dto.patronymic.trim() || null } : {}),
        ...(dto.sipExtension !== undefined ? { sipExtension: dto.sipExtension.trim() || null } : {}),
        ...(dto.sipSecret !== undefined ? { sipSecret: dto.sipSecret.trim() || null } : {}),
      },
    });
    // Привязку к компании/точке трогаем, только если в DTO явно что-то передано
    // (linkCompanyId / linkPartnerId; пустая строка = отвязать).
    const effectiveRole = dto.role ?? (await this.prisma.user.findUnique({ where: { id }, select: { role: true } }))!.role;
    if (dto.linkCompanyId !== undefined || dto.linkPartnerId !== undefined) {
      await this.applyPartnerLink(id, effectiveRole, dto.linkCompanyId, dto.linkPartnerId);
    } else if (dto.role !== undefined && dto.role !== 'PARTNER') {
      // Сняли роль PARTNER — отвязываем любые сущности.
      await this.clearOwnership(id);
    }
    return this.prisma.user.findUnique({ where: { id }, select: this.USER_SELECT });
  }

  // Снять любое владение этого пользователя (1:1 — у юзера максимум одна сущность).
  private async clearOwnership(userId: string) {
    await this.prisma.$transaction([
      this.prisma.insuranceCompany.updateMany({ where: { ownerId: userId }, data: { ownerId: null } }),
      this.prisma.partner.updateMany({ where: { ownerId: userId }, data: { ownerId: null } }),
    ]);
  }

  // Привязать PARTNER-пользователя РОВНО к одной сущности (компании ИЛИ точке).
  // Пустая строка/null в обоих полях — отвязать. Для не-PARTNER ролей привязка запрещена.
  private async applyPartnerLink(
    userId: string,
    role: UserRole,
    linkCompanyId?: string,
    linkPartnerId?: string,
  ) {
    const companyId = linkCompanyId?.trim() || null;
    const partnerId = linkPartnerId?.trim() || null;

    if (role !== 'PARTNER') {
      if (companyId || partnerId) {
        throw new BadRequestException('Привязка к компании/точке доступна только для роли PARTNER');
      }
      await this.clearOwnership(userId);
      return;
    }
    if (companyId && partnerId) {
      throw new BadRequestException('Можно привязать либо к компании, либо к точке — не к обоим');
    }

    // Сначала снимаем прежнее владение этого пользователя, затем ставим новое.
    await this.clearOwnership(userId);

    if (companyId) {
      const c = await this.prisma.insuranceCompany.findUnique({ where: { id: companyId }, select: { ownerId: true } });
      if (!c) throw new BadRequestException('Страховая компания не найдена');
      if (c.ownerId && c.ownerId !== userId) throw new BadRequestException('У компании уже есть привязанный пользователь');
      await this.prisma.insuranceCompany.update({ where: { id: companyId }, data: { ownerId: userId } });
    } else if (partnerId) {
      const p = await this.prisma.partner.findUnique({ where: { id: partnerId }, select: { ownerId: true } });
      if (!p) throw new BadRequestException('Точка-партнёр не найдена');
      if (p.ownerId && p.ownerId !== userId) throw new BadRequestException('У точки уже есть привязанный пользователь');
      await this.prisma.partner.update({ where: { id: partnerId }, data: { ownerId: userId } });
    }
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
}
