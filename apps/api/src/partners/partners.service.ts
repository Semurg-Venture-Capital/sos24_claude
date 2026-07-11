import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MinioService } from '../files/minio.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CatalogQueryDto,
  CategoryDto,
  CreateBookingDto,
  CreateReviewDto,
  NearbyQueryDto,
  PartnerInputDto,
  ServiceInputDto,
} from './dto/partners.dto';

const IMG_TTL = 3600;
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const SLOT_STEP_MIN = 30;

type WorkingHours = Record<string, { open: string; close: string } | null>;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── helpers ──
  private async imgUrl(key?: string | null): Promise<string | null> {
    if (!key) return null;
    try {
      return await this.minio.presignedGetUrl(key, IMG_TTL);
    } catch {
      return null;
    }
  }

  private openNow(workingHours: unknown): boolean | null {
    const wh = workingHours as WorkingHours | null;
    if (!wh || typeof wh !== 'object') return null;
    const now = new Date();
    const day = wh[WEEKDAYS[now.getDay()]];
    if (!day || !day.open || !day.close) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= toMinutes(day.open) && mins < toMinutes(day.close);
  }

  // ════════════ ПУБЛИЧНОЕ ════════════

  listCategories() {
    return this.prisma.partnerCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  private async serializeCard(p: any, lat?: number, lng?: number) {
    const distanceKm =
      lat != null && lng != null && p.lat != null && p.lng != null
        ? Math.round(haversineKm(lat, lng, p.lat, p.lng) * 10) / 10
        : null;
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      rating: p.rating,
      reviewCount: p.reviewCount,
      category: p.category ? { id: p.category.id, name: p.category.name, icon: p.category.icon } : null,
      lat: p.lat,
      lng: p.lng,
      distanceKm,
      openNow: this.openNow(p.workingHours),
      logoUrl: await this.imgUrl(p.logoKey),
      tags: (p.services ?? []).slice(0, 3).map((s: any) => s.name),
    };
  }

  async catalog(query: CatalogQueryDto) {
    const where: Prisma.PartnerWhereInput = {
      active: true,
      healthDirectory: false, // справочник-клиники «Здоровья» в каталог «Партнёры» не показываем
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { address: { contains: query.search, mode: 'insensitive' } },
              { services: { some: { name: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const partners = await this.prisma.partner.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true } },
        services: { where: { active: true }, orderBy: { sortOrder: 'asc' }, select: { name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { rating: 'desc' }],
      take: 200,
    });

    let cards = await Promise.all(partners.map((p) => this.serializeCard(p, query.lat, query.lng)));

    if (query.lat != null && query.lng != null) {
      if (query.radius != null) {
        cards = cards.filter((c) => c.distanceKm == null || c.distanceKm <= query.radius!);
      }
      if (query.sort !== 'rating') {
        cards.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
      }
    }
    return { partners: cards };
  }

  async nearby(query: NearbyQueryDto) {
    const partners = await this.prisma.partner.findMany({
      where: { active: true, healthDirectory: false, lat: { not: null }, lng: { not: null } },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        services: { where: { active: true }, orderBy: { sortOrder: 'asc' }, select: { name: true } },
      },
      take: 100,
    });
    const cards = await Promise.all(partners.map((p) => this.serializeCard(p, query.lat, query.lng)));
    cards.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    return { partners: cards.slice(0, query.limit ?? 10) };
  }

  async detail(id: string) {
    const p = await this.prisma.partner.findFirst({
      where: { id, active: true },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        services: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { user: { select: { name: true, surname: true } } },
        },
      },
    });
    if (!p) throw new NotFoundException('Партнёр не найден');
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      phone: p.phone,
      email: p.email,
      website: p.website,
      description: p.description,
      rating: p.rating,
      reviewCount: p.reviewCount,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      workingHours: p.workingHours,
      openNow: this.openNow(p.workingHours),
      logoUrl: await this.imgUrl(p.logoKey),
      coverUrl: await this.imgUrl(p.coverKey),
      services: p.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        priceFrom: s.priceFrom,
        priceTo: s.priceTo,
        durationMin: s.durationMin,
      })),
      reviews: p.reviews.map((r) => this.serializeReview(r)),
    };
  }

  private serializeReview(r: any) {
    return {
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      authorName: [r.user?.name, r.user?.surname].filter(Boolean).join(' ') || 'Клиент',
    };
  }

  async reviews(partnerId: string, cursor?: string) {
    const rows = await this.prisma.partnerReview.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: { select: { name: true, surname: true } } },
    });
    return {
      reviews: rows.map((r) => this.serializeReview(r)),
      nextCursor: rows.length === 20 ? rows[rows.length - 1].id : null,
    };
  }

  // Доступные слоты на дату (из рабочих часов, без занятых).
  async slots(partnerId: string, date: string, serviceId?: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Партнёр не найден');
    const wh = partner.workingHours as WorkingHours | null;
    const day = new Date(`${date}T00:00:00`);
    const dayKey = WEEKDAYS[day.getDay()];
    const hours = wh?.[dayKey];
    if (!hours || !hours.open || !hours.close) return { slots: [] };

    let step = SLOT_STEP_MIN;
    if (serviceId) {
      const svc = await this.prisma.partnerService.findUnique({ where: { id: serviceId } });
      if (svc?.durationMin) step = Math.max(15, svc.durationMin);
    }

    const startMin = toMinutes(hours.open);
    const endMin = toMinutes(hours.close);

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const taken = await this.prisma.partnerBooking.findMany({
      where: { partnerId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { scheduledAt: true },
    });
    const takenSet = new Set(taken.map((t) => t.scheduledAt.toISOString()));
    const now = new Date();

    const slots: { time: string; iso: string; available: boolean }[] = [];
    for (let m = startMin; m + step <= endMin; m += step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
      const iso = slotDate.toISOString();
      const isPast = slotDate.getTime() < now.getTime();
      slots.push({
        time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
        iso,
        available: !takenSet.has(iso) && !isPast,
      });
    }
    return { slots };
  }

  async createBooking(userId: string, partnerId: string, dto: CreateBookingDto) {
    const partner = await this.prisma.partner.findFirst({ where: { id: partnerId, active: true } });
    if (!partner) throw new NotFoundException('Партнёр не найден');
    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) throw new BadRequestException('Некорректная дата');

    const clash = await this.prisma.partnerBooking.findFirst({
      where: { partnerId, scheduledAt, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (clash) throw new BadRequestException('Это время уже занято, выберите другое');

    const booking = await this.prisma.partnerBooking.create({
      data: {
        partnerId,
        userId,
        scheduledAt,
        policyId: dto.policyId ?? null,
        comment: dto.comment ?? null,
        status: 'PENDING',
        ...(dto.serviceIds?.length ? { services: { connect: dto.serviceIds.map((id) => ({ id })) } } : {}),
      },
      include: { services: true, partner: { select: { name: true } } },
    });
    return this.serializeBooking(booking);
  }

  private serializeBooking(b: any) {
    return {
      id: b.id,
      partnerId: b.partnerId,
      partnerName: b.partner?.name,
      scheduledAt: b.scheduledAt,
      status: b.status,
      comment: b.comment,
      policyId: b.policyId,
      services: (b.services ?? []).map((s: any) => ({ id: s.id, name: s.name, priceFrom: s.priceFrom })),
      hasReview: b.review != null,
      createdAt: b.createdAt,
    };
  }

  async myBookings(userId: string) {
    const rows = await this.prisma.partnerBooking.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
      include: { services: true, partner: { select: { name: true } }, review: { select: { id: true } } },
    });
    return { bookings: rows.map((b) => this.serializeBooking(b)) };
  }

  async cancelMyBooking(userId: string, bookingId: string) {
    const b = await this.prisma.partnerBooking.findUnique({ where: { id: bookingId } });
    if (!b || b.userId !== userId) throw new NotFoundException('Запись не найдена');
    if (b.status === 'COMPLETED') throw new BadRequestException('Завершённую запись нельзя отменить');
    await this.prisma.partnerBooking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
    return { ok: true };
  }

  async createReview(userId: string, partnerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.partnerBooking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });
    if (!booking || booking.userId !== userId || booking.partnerId !== partnerId) {
      throw new NotFoundException('Запись не найдена');
    }
    if (booking.status !== 'COMPLETED') throw new ForbiddenException('Отзыв можно оставить только после завершённой записи');
    if (booking.review) throw new BadRequestException('Отзыв по этой записи уже оставлен');

    await this.prisma.partnerReview.create({
      data: { partnerId, userId, bookingId: dto.bookingId, rating: dto.rating, text: dto.text ?? null },
    });
    await this.recomputeRating(partnerId);
    return { ok: true };
  }

  private async recomputeRating(partnerId: string) {
    const agg = await this.prisma.partnerReview.aggregate({
      where: { partnerId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.partner.update({
      where: { id: partnerId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
    });
  }

  // ════════════ АДМИН ════════════

  // — Категории —
  adminCategories() {
    return this.prisma.partnerCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  private slugify(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;
  }

  async createCategory(dto: CategoryDto) {
    return this.prisma.partnerCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug?.trim() || this.slugify(dto.name),
        icon: dto.icon ?? null,
        color: dto.color ?? null,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: CategoryDto) {
    await this.ensureCategory(id);
    return this.prisma.partnerCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug || this.slugify(dto.name) } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  private async ensureCategory(id: string) {
    const c = await this.prisma.partnerCategory.count({ where: { id } });
    if (!c) throw new NotFoundException('Категория не найдена');
  }

  async deleteCategory(id: string) {
    await this.ensureCategory(id);
    await this.prisma.partnerCategory.delete({ where: { id } });
    return { ok: true };
  }

  // — Партнёры —
  async adminList(search?: string, categoryId?: string) {
    const where: Prisma.PartnerWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { address: { contains: search, mode: 'insensitive' } }] } : {}),
    };
    const partners = await this.prisma.partner.findMany({
      where,
      include: { category: { select: { id: true, name: true } }, _count: { select: { services: true, bookings: true, reviews: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { partners };
  }

  async adminGet(id: string) {
    const p = await this.prisma.partner.findUnique({
      where: { id },
      include: { category: true, services: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!p) throw new NotFoundException('Партнёр не найден');
    return { ...p, logoUrl: await this.imgUrl(p.logoKey), coverUrl: await this.imgUrl(p.coverKey) };
  }

  createPartner(dto: PartnerInputDto) {
    return this.prisma.partner.create({ data: this.partnerData(dto) as Prisma.PartnerUncheckedCreateInput });
  }

  async updatePartner(id: string, dto: PartnerInputDto) {
    const exists = await this.prisma.partner.count({ where: { id } });
    if (!exists) throw new NotFoundException('Партнёр не найден');
    return this.prisma.partner.update({ where: { id }, data: this.partnerData(dto, true) });
  }

  private partnerData(dto: PartnerInputDto, partial = false): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    const fields: (keyof PartnerInputDto)[] = ['name', 'categoryId', 'address', 'city', 'phone', 'email', 'website', 'description', 'lat', 'lng', 'logoKey', 'coverKey', 'workingHours', 'active', 'sortOrder'];
    for (const f of fields) {
      if (dto[f] !== undefined) data[f] = dto[f] as unknown;
    }
    if (!partial) {
      data.name = dto.name;
      data.address = dto.address;
    }
    return data;
  }

  async deletePartner(id: string) {
    const exists = await this.prisma.partner.count({ where: { id } });
    if (!exists) throw new NotFoundException('Партнёр не найден');
    await this.prisma.partner.delete({ where: { id } });
    return { ok: true };
  }

  // — Услуги —
  createService(partnerId: string, dto: ServiceInputDto) {
    return this.prisma.partnerService.create({ data: { partnerId, name: dto.name, ...this.serviceData(dto) } });
  }

  async updateService(serviceId: string, dto: ServiceInputDto) {
    const exists = await this.prisma.partnerService.count({ where: { id: serviceId } });
    if (!exists) throw new NotFoundException('Услуга не найдена');
    return this.prisma.partnerService.update({ where: { id: serviceId }, data: this.serviceData(dto) });
  }

  private serviceData(dto: ServiceInputDto) {
    return {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.priceFrom !== undefined ? { priceFrom: dto.priceFrom } : {}),
      ...(dto.priceTo !== undefined ? { priceTo: dto.priceTo } : {}),
      ...(dto.durationMin !== undefined ? { durationMin: dto.durationMin } : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
    };
  }

  async deleteService(serviceId: string) {
    const exists = await this.prisma.partnerService.count({ where: { id: serviceId } });
    if (!exists) throw new NotFoundException('Услуга не найдена');
    await this.prisma.partnerService.delete({ where: { id: serviceId } });
    return { ok: true };
  }

  // — Записи (админ) —
  async adminBookings(status?: string, partnerId?: string) {
    const rows = await this.prisma.partnerBooking.findMany({
      where: {
        ...(status ? { status: status as Prisma.EnumPartnerBookingStatusFilter } : {}),
        ...(partnerId ? { partnerId } : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      take: 200,
      include: {
        services: { select: { name: true } },
        partner: { select: { name: true } },
        user: { select: { name: true, surname: true, phone: true } },
      },
    });
    return {
      bookings: rows.map((b) => ({
        id: b.id,
        partnerName: b.partner?.name,
        userName: [b.user?.name, b.user?.surname].filter(Boolean).join(' ') || b.user?.phone,
        userPhone: b.user?.phone,
        scheduledAt: b.scheduledAt,
        status: b.status,
        comment: b.comment,
        services: b.services.map((s) => s.name),
        createdAt: b.createdAt,
      })),
    };
  }

  async setBookingStatus(bookingId: string, status: string) {
    const b = await this.prisma.partnerBooking.findUnique({ where: { id: bookingId }, include: { partner: { select: { name: true } } } });
    if (!b) throw new NotFoundException('Запись не найдена');
    const updated = await this.prisma.partnerBooking.update({
      where: { id: bookingId },
      data: { status: status as Prisma.PartnerBookingUpdateInput['status'] },
    });

    const labels: Record<string, string> = {
      CONFIRMED: 'Запись подтверждена',
      CANCELLED: 'Запись отменена',
      COMPLETED: 'Запись выполнена',
    };
    if (labels[status]) {
      try {
        await this.notifications.send(b.userId, {
          type: 'PARTNER_BOOKING',
          title: b.partner?.name ?? 'Партнёр SOS24',
          body: labels[status],
          data: { screen: 'PartnerBookings' },
        });
      } catch (e) {
        this.logger.warn(`push записи ${bookingId}: ${(e as Error).message}`);
      }
    }
    return updated;
  }

  async adminReviews(partnerId: string) {
    const rows = await this.prisma.partnerReview.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, surname: true, phone: true } } },
    });
    return { reviews: rows.map((r) => ({ ...this.serializeReview(r), phone: r.user?.phone })) };
  }

  async deleteReview(reviewId: string) {
    const r = await this.prisma.partnerReview.findUnique({ where: { id: reviewId } });
    if (!r) throw new NotFoundException('Отзыв не найден');
    await this.prisma.partnerReview.delete({ where: { id: reviewId } });
    await this.recomputeRating(r.partnerId);
    return { ok: true };
  }
}
