import { PrismaClient } from '@prisma/client';
import { PRODUCTS } from './seed-insurance';

// Дополняет каталог в проде: добавляет недостающие продукты (по типу) к
// СУЩЕСТВУЮЩЕЙ компании, не трогая уже созданные вручную. Идемпотентно.
// Запуск: DATABASE_URL=<prod> ts-node --transpile-only prisma/seed-prod-catalog.ts
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.insuranceCompany.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!company) {
    console.error('Нет ни одной компании — создай компанию в админке сначала.');
    process.exit(1);
  }
  console.log(`Компания: ${company.name} (${company.slug})`);

  const existing = await prisma.insuranceProduct.findMany({
    where: { companyId: company.id },
    select: { type: true },
  });
  const haveTypes = new Set(existing.map((p) => p.type));

  for (const [i, p] of PRODUCTS.entries()) {
    if (haveTypes.has(p.type)) {
      console.log(`  = ${p.type} уже есть — пропуск`);
      continue;
    }
    const product = await prisma.insuranceProduct.create({
      data: {
        companyId: company.id,
        type: p.type,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        pricingMode: p.pricingMode,
        baseRate: p.baseRate ?? null,
        content: p.content,
        active: true,
        sortOrder: i,
      },
    });
    if (p.plans?.length) {
      await prisma.productPlan.createMany({
        data: p.plans.map((pl, j) => ({
          productId: product.id,
          name: pl.name,
          price: pl.price,
          coverageAmount: pl.coverageAmount ?? null,
          features: pl.features ?? [],
          sortOrder: j,
        })),
      });
    }
    console.log(`  + ${product.name} [${p.pricingMode}]${p.plans ? ` · ${p.plans.length} плана` : ''}`);
  }
  console.log('Готово.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
