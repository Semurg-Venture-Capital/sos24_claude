import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { InsuranceService } from '../insurance/insurance.service';
import { PartnersService } from '../partners/partners.service';
import type {
  CreatePlanDto,
  CreateProductDto,
  UpdatePlanDto,
  UpdateProductDto,
} from '../insurance/dto/insurance.dto';
import type { ServiceInputDto } from '../partners/dto/partners.dto';
import type {
  PortalCreatePlanDto,
  PortalCreateProductDto,
  PortalUpdatePlanDto,
  PortalUpdateProductDto,
  UpdateMyCompanyDto,
  UpdateMyPartnerDto,
} from './dto/partner-portal.dto';

const IMG_MAX = 5 * 1024 * 1024; // 5 МБ
const IMG_ALLOWED = /^image\/(png|jpe?g|webp|svg\+xml)$/i;

// Бизнес-логика B2B-кабинета. Каждый метод сперва резолвит сущность владельца (по ownerId)
// и далее работает СТРОГО в её рамках — переиспользует admin-сервисы insurance/partners,
// но с обязательной проверкой принадлежности (нельзя трогать чужие продукты/услуги/записи).
@Injectable()
export class PartnerPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly insurance: InsuranceService,
    private readonly partners: PartnersService,
  ) {}

  // ── резолв сущности владельца ──────────────────────────────────────────

  private async myCompanyId(userId: string): Promise<string> {
    const c = await this.prisma.insuranceCompany.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!c) throw new ForbiddenException('Кабинет не привязан к страховой компании');
    return c.id;
  }

  private async myPartnerId(userId: string): Promise<string> {
    const p = await this.prisma.partner.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!p) throw new ForbiddenException('Кабинет не привязан к точке-партнёру');
    return p.id;
  }

  /** Сводка кабинета: тип (INSURER/SERVICE) + краткие данные привязанной сущности. */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompany: { select: { id: true, name: true, slug: true, logoKey: true } },
        ownedPartner: { select: { id: true, name: true, logoKey: true } },
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (user.ownedCompany) {
      const c = user.ownedCompany;
      return {
        kind: 'INSURER' as const,
        user: { id: user.id, name: user.name, phone: user.phone },
        entity: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          logoUrl: c.logoKey ? await this.imgUrl(c.logoKey) : null,
        },
      };
    }
    if (user.ownedPartner) {
      const p = user.ownedPartner;
      return {
        kind: 'SERVICE' as const,
        user: { id: user.id, name: user.name, phone: user.phone },
        entity: {
          id: p.id,
          name: p.name,
          logoUrl: p.logoKey ? await this.imgUrl(p.logoKey) : null,
        },
      };
    }
    throw new ForbiddenException('Кабинет не привязан ни к компании, ни к точке');
  }

  private async imgUrl(key: string): Promise<string | null> {
    try {
      return await this.minio.presignedGetUrl(key, 3600);
    } catch {
      return null;
    }
  }

  private assertImage(file?: Express.Multer.File): Express.Multer.File {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    if (file.size > IMG_MAX) throw new BadRequestException('Файл больше 5 МБ');
    if (!IMG_ALLOWED.test(file.mimetype)) throw new BadRequestException('Только PNG, JPG, WEBP, SVG');
    return file;
  }

  // ════════════ СТРАХОВАЯ КОМПАНИЯ ════════════

  async getCompany(userId: string) {
    const id = await this.myCompanyId(userId);
    const c = await this.prisma.insuranceCompany.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Компания не найдена');
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      active: c.active,
      logoKey: c.logoKey,
      logoUrl: c.logoKey ? await this.imgUrl(c.logoKey) : null,
    };
  }

  async updateCompany(userId: string, dto: UpdateMyCompanyDto) {
    const id = await this.myCompanyId(userId);
    // Владелец меняет только name/description; slug/active/sortOrder — за админом.
    return this.insurance.adminUpdateCompany(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });
  }

  async setCompanyLogo(userId: string, file?: Express.Multer.File) {
    const id = await this.myCompanyId(userId);
    const f = this.assertImage(file);
    return this.insurance.setCompanyLogo(id, f.buffer, f.mimetype);
  }

  async listProducts(userId: string) {
    const id = await this.myCompanyId(userId);
    return this.insurance.adminListProducts(id);
  }

  async getProduct(userId: string, productId: string) {
    await this.assertProductMine(userId, productId);
    return this.insurance.adminGetProduct(productId);
  }

  async createProduct(userId: string, dto: PortalCreateProductDto) {
    const companyId = await this.myCompanyId(userId);
    // companyId жёстко подставляем из кабинета — нельзя создать продукт чужой компании.
    return this.insurance.adminCreateProduct({ ...dto, companyId } as CreateProductDto);
  }

  async updateProduct(userId: string, productId: string, dto: PortalUpdateProductDto) {
    await this.assertProductMine(userId, productId);
    // companyId не передаём — продукт остаётся у этой же компании.
    return this.insurance.adminUpdateProduct(productId, dto as UpdateProductDto);
  }

  async deleteProduct(userId: string, productId: string) {
    await this.assertProductMine(userId, productId);
    return this.insurance.adminDeleteProduct(productId);
  }

  async createPlan(userId: string, dto: PortalCreatePlanDto) {
    await this.assertProductMine(userId, dto.productId);
    return this.insurance.adminCreatePlan(dto as CreatePlanDto);
  }

  async updatePlan(userId: string, planId: string, dto: PortalUpdatePlanDto) {
    await this.assertPlanMine(userId, planId);
    return this.insurance.adminUpdatePlan(planId, dto as UpdatePlanDto);
  }

  async deletePlan(userId: string, planId: string) {
    await this.assertPlanMine(userId, planId);
    return this.insurance.adminDeletePlan(planId);
  }

  /** Статистика по полисам компании: всего, по статусам, по продуктам, сумма премий. */
  async companyStats(userId: string) {
    const companyId = await this.myCompanyId(userId);

    const [total, byStatus, byProduct, premium] = await Promise.all([
      this.prisma.policy.count({ where: { companyId } }),
      this.prisma.policy.groupBy({ by: ['status'], where: { companyId }, _count: true }),
      this.prisma.policy.groupBy({ by: ['productId'], where: { companyId }, _count: true }),
      this.prisma.policy.aggregate({ where: { companyId }, _sum: { totalPrice: true } }),
    ]);

    const productIds = byProduct.map((b) => b.productId).filter((x): x is string => !!x);
    const products = productIds.length
      ? await this.prisma.insuranceProduct.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, type: true },
        })
      : [];
    const pmap = new Map(products.map((p) => [p.id, p]));

    return {
      totalPolicies: total,
      premiumSum: premium._sum.totalPrice ?? 0,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byProduct: byProduct.map((b) => ({
        productId: b.productId,
        productName: b.productId ? (pmap.get(b.productId)?.name ?? '—') : 'Без продукта',
        type: b.productId ? (pmap.get(b.productId)?.type ?? null) : null,
        count: b._count,
      })),
    };
  }

  private async assertProductMine(userId: string, productId: string) {
    const companyId = await this.myCompanyId(userId);
    const p = await this.prisma.insuranceProduct.findUnique({
      where: { id: productId },
      select: { companyId: true },
    });
    if (!p) throw new NotFoundException('Продукт не найден');
    if (p.companyId !== companyId) throw new ForbiddenException('Продукт другой компании');
  }

  private async assertPlanMine(userId: string, planId: string) {
    const companyId = await this.myCompanyId(userId);
    const plan = await this.prisma.productPlan.findUnique({
      where: { id: planId },
      select: { product: { select: { companyId: true } } },
    });
    if (!plan) throw new NotFoundException('Тариф не найден');
    if (plan.product.companyId !== companyId) throw new ForbiddenException('Тариф другой компании');
  }

  // ════════════ СЕРВИС-ПАРТНЁР (СТО/клиника) ════════════

  async getPartner(userId: string) {
    const id = await this.myPartnerId(userId);
    return this.partners.adminGet(id);
  }

  async updatePartner(userId: string, dto: UpdateMyPartnerDto) {
    const id = await this.myPartnerId(userId);
    // PartnerInputDto в updatePartner делает partial-апдейт по переданным полям.
    // name/address в DTO опциональны — adminGet/updatePartner это переживают (partial=true).
    return this.partners.updatePartner(id, dto as never);
  }

  async setPartnerImage(userId: string, kind: 'logo' | 'cover', file?: Express.Multer.File) {
    const id = await this.myPartnerId(userId);
    const f = this.assertImage(file);
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Точка не найдена');

    const field = kind === 'logo' ? 'logoKey' : 'coverKey';
    const oldKey = kind === 'logo' ? partner.logoKey : partner.coverKey;
    const key = await this.minio.put(f.buffer, f.mimetype, undefined, `partners/${kind}`);
    if (oldKey) {
      try {
        await this.minio.remove(oldKey);
      } catch {
        /* старый файл мог отсутствовать */
      }
    }
    await this.prisma.partner.update({ where: { id }, data: { [field]: key } });
    return { [field]: key, url: await this.imgUrl(key) };
  }

  async listServices(userId: string) {
    const id = await this.myPartnerId(userId);
    const services = await this.prisma.partnerService.findMany({
      where: { partnerId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { services };
  }

  async createService(userId: string, dto: ServiceInputDto) {
    const id = await this.myPartnerId(userId);
    return this.partners.createService(id, dto);
  }

  async updateService(userId: string, serviceId: string, dto: ServiceInputDto) {
    await this.assertServiceMine(userId, serviceId);
    return this.partners.updateService(serviceId, dto);
  }

  async deleteService(userId: string, serviceId: string) {
    await this.assertServiceMine(userId, serviceId);
    return this.partners.deleteService(serviceId);
  }

  async bookings(userId: string, status?: string) {
    const id = await this.myPartnerId(userId);
    return this.partners.adminBookings(status, id);
  }

  async setBookingStatus(userId: string, bookingId: string, status: string) {
    await this.assertBookingMine(userId, bookingId);
    return this.partners.setBookingStatus(bookingId, status);
  }

  async reviews(userId: string) {
    const id = await this.myPartnerId(userId);
    return this.partners.adminReviews(id);
  }

  private async assertServiceMine(userId: string, serviceId: string) {
    const partnerId = await this.myPartnerId(userId);
    const s = await this.prisma.partnerService.findUnique({
      where: { id: serviceId },
      select: { partnerId: true },
    });
    if (!s) throw new NotFoundException('Услуга не найдена');
    if (s.partnerId !== partnerId) throw new ForbiddenException('Услуга другой точки');
  }

  private async assertBookingMine(userId: string, bookingId: string) {
    const partnerId = await this.myPartnerId(userId);
    const b = await this.prisma.partnerBooking.findUnique({
      where: { id: bookingId },
      select: { partnerId: true },
    });
    if (!b) throw new NotFoundException('Запись не найдена');
    if (b.partnerId !== partnerId) throw new ForbiddenException('Запись другой точки');
  }
}
