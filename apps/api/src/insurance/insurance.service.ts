import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../files/minio.service';
import {
  CreateCompanyDto,
  CreatePlanDto,
  CreateProductDto,
  UpdateCompanyDto,
  UpdatePlanDto,
  UpdateProductDto,
} from './dto/insurance.dto';

@Injectable()
export class InsuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  // Временная ссылка на логотип (presigned GET), null если логотипа нет.
  private async logoUrl(logoKey: string | null): Promise<string | null> {
    if (!logoKey) return null;
    try {
      return await this.minio.presignedGetUrl(logoKey, 3600);
    } catch {
      return null;
    }
  }

  // «От» цены продукта: мин. цена активного плана (PLANS) или baseRate (COEFFICIENT).
  private fromPrice(p: { pricingMode: string; baseRate: number | null; plans: { price: number }[] }): number | null {
    if (p.pricingMode === 'PLANS') {
      const prices = p.plans.map((pl) => pl.price);
      return prices.length ? Math.min(...prices) : null;
    }
    return p.baseRate ?? null;
  }

  // ─── ПУБЛИЧНОЕ (мобайл) ───────────────────────────────────────────────

  /** Активные компании, у которых есть хотя бы один активный продукт. */
  async listCompaniesPublic() {
    const companies = await this.prisma.insuranceCompany.findMany({
      where: { active: true, products: { some: { active: true } } },
      include: { _count: { select: { products: { where: { active: true } } } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return Promise.all(
      companies.map(async (c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        logoUrl: await this.logoUrl(c.logoKey),
        productCount: c._count.products,
      })),
    );
  }

  /** Активные продукты компании (короткая карточка + «от» цены). */
  async listCompanyProducts(companyId: string) {
    const company = await this.prisma.insuranceCompany.findFirst({ where: { id: companyId, active: true } });
    if (!company) throw new NotFoundException('Компания не найдена');
    const products = await this.prisma.insuranceProduct.findMany({
      where: { companyId, active: true },
      include: { plans: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return products.map((p) => ({
      id: p.id,
      type: p.type,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      pricingMode: p.pricingMode,
      fromPrice: this.fromPrice(p),
      planCount: p.plans.length,
    }));
  }

  /** Полная карточка продукта: компания, контент, активные планы. */
  async getProductPublic(id: string) {
    const p = await this.prisma.insuranceProduct.findFirst({
      where: { id, active: true },
      include: {
        company: true,
        plans: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!p || !p.company.active) throw new NotFoundException('Продукт не найден');
    return {
      id: p.id,
      type: p.type,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      longDescription: p.longDescription,
      pricingMode: p.pricingMode,
      baseRate: p.baseRate,
      content: p.content,
      fromPrice: this.fromPrice(p),
      company: { id: p.company.id, name: p.company.name, slug: p.company.slug, logoUrl: await this.logoUrl(p.company.logoKey) },
      plans: p.plans.map((pl) => ({
        id: pl.id,
        name: pl.name,
        price: pl.price,
        coverageAmount: pl.coverageAmount,
        features: pl.features,
      })),
    };
  }

  // ─── АДМИН: компании ──────────────────────────────────────────────────

  async adminListCompanies() {
    const companies = await this.prisma.insuranceCompany.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return Promise.all(
      companies.map(async (c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        active: c.active,
        sortOrder: c.sortOrder,
        logoKey: c.logoKey,
        logoUrl: await this.logoUrl(c.logoKey),
        productCount: c._count.products,
        createdAt: c.createdAt,
      })),
    );
  }

  async adminCreateCompany(dto: CreateCompanyDto) {
    await this.assertSlugFree(dto.slug);
    return this.prisma.insuranceCompany.create({ data: dto });
  }

  async adminUpdateCompany(id: string, dto: UpdateCompanyDto) {
    await this.getCompanyOrThrow(id);
    if (dto.slug) await this.assertSlugFree(dto.slug, id);
    return this.prisma.insuranceCompany.update({ where: { id }, data: dto });
  }

  async adminDeleteCompany(id: string) {
    await this.getCompanyOrThrow(id);
    const policies = await this.prisma.policy.count({ where: { companyId: id } });
    if (policies > 0) {
      // Не удаляем компанию с историей полисов — деактивируем.
      throw new BadRequestException('У компании есть полисы — её нельзя удалить, только деактивировать (active=false)');
    }
    await this.prisma.insuranceCompany.delete({ where: { id } });
    return { ok: true };
  }

  /** Загрузка логотипа: кладём в MinIO (companies/logo), удаляем старый, ставим logoKey. */
  async setCompanyLogo(id: string, buffer: Buffer, contentType: string) {
    const company = await this.getCompanyOrThrow(id);
    const key = await this.minio.put(buffer, contentType, undefined, 'companies/logo');
    if (company.logoKey) {
      try {
        await this.minio.remove(company.logoKey);
      } catch {
        /* старый файл мог отсутствовать */
      }
    }
    await this.prisma.insuranceCompany.update({ where: { id }, data: { logoKey: key } });
    return { logoKey: key, logoUrl: await this.logoUrl(key) };
  }

  // ─── АДМИН: продукты ──────────────────────────────────────────────────

  async adminListProducts(companyId: string) {
    await this.getCompanyOrThrow(companyId);
    return this.prisma.insuranceProduct.findMany({
      where: { companyId },
      include: { plans: { orderBy: { sortOrder: 'asc' } }, _count: { select: { policies: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async adminGetProduct(id: string) {
    const p = await this.prisma.insuranceProduct.findUnique({
      where: { id },
      include: { plans: { orderBy: { sortOrder: 'asc' } }, company: true },
    });
    if (!p) throw new NotFoundException('Продукт не найден');
    return p;
  }

  async adminCreateProduct(dto: CreateProductDto) {
    await this.getCompanyOrThrow(dto.companyId);
    const dup = await this.prisma.insuranceProduct.findUnique({
      where: { companyId_slug: { companyId: dto.companyId, slug: dto.slug } },
    });
    if (dup) throw new BadRequestException('Продукт с таким slug уже есть у компании');
    return this.prisma.insuranceProduct.create({ data: this.productData(dto) });
  }

  async adminUpdateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.insuranceProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Продукт не найден');
    if (dto.slug && dto.slug !== existing.slug) {
      const dup = await this.prisma.insuranceProduct.findUnique({
        where: { companyId_slug: { companyId: existing.companyId, slug: dto.slug } },
      });
      if (dup) throw new BadRequestException('Продукт с таким slug уже есть у компании');
    }
    return this.prisma.insuranceProduct.update({ where: { id }, data: this.productData(dto) });
  }

  async adminDeleteProduct(id: string) {
    const product = await this.prisma.insuranceProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Продукт не найден');
    const policies = await this.prisma.policy.count({ where: { productId: id } });
    if (policies > 0) throw new BadRequestException('У продукта есть полисы — только деактивация (active=false)');
    await this.prisma.insuranceProduct.delete({ where: { id } });
    return { ok: true };
  }

  // ─── АДМИН: планы ─────────────────────────────────────────────────────

  async adminCreatePlan(dto: CreatePlanDto) {
    const product = await this.prisma.insuranceProduct.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Продукт не найден');
    return this.prisma.productPlan.create({ data: this.planData(dto) });
  }

  async adminUpdatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.productPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Тариф не найден');
    return this.prisma.productPlan.update({ where: { id }, data: this.planData(dto) });
  }

  async adminDeletePlan(id: string) {
    const plan = await this.prisma.productPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Тариф не найден');
    const policies = await this.prisma.policy.count({ where: { planId: id } });
    if (policies > 0) throw new BadRequestException('По тарифу есть полисы — только деактивация (active=false)');
    await this.prisma.productPlan.delete({ where: { id } });
    return { ok: true };
  }

  // ─── helpers ──────────────────────────────────────────────────────────

  private productData(dto: CreateProductDto | UpdateProductDto): Prisma.InsuranceProductUncheckedCreateInput {
    const { content, ...rest } = dto as CreateProductDto;
    return {
      ...rest,
      ...(content !== undefined ? { content: content as Prisma.InputJsonValue } : {}),
    } as Prisma.InsuranceProductUncheckedCreateInput;
  }

  private planData(dto: CreatePlanDto | UpdatePlanDto): Prisma.ProductPlanUncheckedCreateInput {
    const { features, ...rest } = dto as CreatePlanDto;
    return {
      ...rest,
      ...(features !== undefined ? { features: features as Prisma.InputJsonValue } : {}),
    } as Prisma.ProductPlanUncheckedCreateInput;
  }

  private async getCompanyOrThrow(id: string) {
    const c = await this.prisma.insuranceCompany.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Компания не найдена');
    return c;
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    const existing = await this.prisma.insuranceCompany.findUnique({ where: { slug } });
    if (existing && existing.id !== exceptId) throw new BadRequestException('Компания с таким slug уже есть');
  }
}
