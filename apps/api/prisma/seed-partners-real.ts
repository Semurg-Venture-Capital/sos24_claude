import { PrismaClient } from '@prisma/client';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';

// Реалистичные партнёры (Ташкент) + загрузка картинок в MinIO.
// Запуск: ts-node --transpile-only prisma/seed-partners-real.ts
const prisma = new PrismaClient();

const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'sos24',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'sos24minio',
});
const BUCKET = process.env.MINIO_BUCKET ?? 'sos24';

const WD = { open: '09:00', close: '19:00' };
const weekday = (sat: { open: string; close: string } | null = { open: '10:00', close: '16:00' }) => ({
  mon: WD, tue: WD, wed: WD, thu: WD, fri: WD, sat, sun: null,
});
const allDay = () => {
  const d = { open: '00:00', close: '23:59' };
  return { mon: d, tue: d, wed: d, thu: d, fri: d, sat: d, sun: d };
};

interface P {
  name: string;
  categorySlug: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  description: string;
  workingHours: Record<string, { open: string; close: string } | null>;
  coverSeed: string;
  logoSeed: string;
  services: { name: string; priceFrom?: number; durationMin?: number }[];
}

const PARTNERS: P[] = [
  {
    name: 'Roodell Servis',
    categorySlug: 'sto', address: 'ул. Бунёдкор, 1А, Чиланзар', phone: '+998711500500',
    lat: 41.2845, lng: 69.2042, description: 'Официальный сервис Chevrolet / UzAuto — гарантийное и плановое ТО.',
    workingHours: weekday(), coverSeed: 'roodell', logoSeed: 'roodell-l',
    services: [
      { name: 'Плановое ТО', priceFrom: 350000, durationMin: 60 },
      { name: 'Компьютерная диагностика', priceFrom: 120000, durationMin: 30 },
      { name: 'Замена масла и фильтров', priceFrom: 250000, durationMin: 30 },
    ],
  },
  {
    name: 'Avto-Soz Servis',
    categorySlug: 'sto', address: 'ул. Себзор, 24, Яккасарай', phone: '+998712445566',
    lat: 41.2978, lng: 69.2401, description: 'Кузовной ремонт, покраска и слесарные работы.',
    workingHours: weekday(), coverSeed: 'avtosoz', logoSeed: 'avtosoz-l',
    services: [
      { name: 'Кузовной ремонт', priceFrom: 500000, durationMin: 60 },
      { name: 'Покраска элемента', priceFrom: 400000, durationMin: 60 },
      { name: 'Развал-схождение', priceFrom: 150000, durationMin: 30 },
    ],
  },
  {
    name: 'AKFA Medline',
    categorySlug: 'clinic', address: 'ул. Кичик халка йўли, 13, Юнусабад', phone: '+998781131131',
    lat: 41.3525, lng: 69.2876, description: 'Многопрофильная клиника: диагностика, стационар, скорая помощь.',
    workingHours: weekday({ open: '08:00', close: '20:00' }), coverSeed: 'akfa', logoSeed: 'akfa-l',
    services: [
      { name: 'Консультация терапевта', priceFrom: 200000, durationMin: 30 },
      { name: 'УЗИ-диагностика', priceFrom: 180000, durationMin: 30 },
      { name: 'Лабораторные анализы', priceFrom: 250000, durationMin: 30 },
    ],
  },
  {
    name: 'Medion клиника',
    categorySlug: 'clinic', address: 'ул. Усмон Носир, 38, Мирабад', phone: '+998712009090',
    lat: 41.2934, lng: 69.2512, description: 'Травматология, стоматология и экстренная помощь 24/7.',
    workingHours: allDay(), coverSeed: 'medion', logoSeed: 'medion-l',
    services: [
      { name: 'Травматология', priceFrom: 150000, durationMin: 30 },
      { name: 'Стоматология', priceFrom: 300000, durationMin: 60 },
      { name: 'Экстренная помощь', durationMin: 30 },
    ],
  },
  {
    name: "Yo'l Yordam 24",
    categorySlug: 'towing', address: 'Малая кольцевая дорога, Ташкент', phone: '+998901234500',
    lat: 41.3111, lng: 69.2797, description: 'Эвакуатор по городу и межгород, помощь на дороге 24/7.',
    workingHours: allDay(), coverSeed: 'yolyordam', logoSeed: 'yolyordam-l',
    services: [
      { name: 'Эвакуатор по городу', priceFrom: 200000, durationMin: 60 },
      { name: 'Запуск двигателя', priceFrom: 80000, durationMin: 30 },
      { name: 'Межгород', durationMin: 60 },
    ],
  },
  {
    name: 'Aqua Avto Moyka',
    categorySlug: 'wash', address: 'ул. Амира Темура, 84, Мирзо-Улугбек', phone: '+998712778899',
    lat: 41.3380, lng: 69.3344, description: 'Бесконтактная мойка, химчистка салона и полировка.',
    workingHours: weekday({ open: '08:00', close: '21:00' }), coverSeed: 'aqua', logoSeed: 'aqua-l',
    services: [
      { name: 'Комплексная мойка', priceFrom: 60000, durationMin: 30 },
      { name: 'Химчистка салона', priceFrom: 350000, durationMin: 60 },
      { name: 'Полировка кузова', priceFrom: 500000, durationMin: 60 },
    ],
  },
];

async function downloadToMinio(seed: string, w: number, h: number, prefix: string): Promise<string> {
  const res = await fetch(`https://picsum.photos/seed/${seed}/${w}/${h}`);
  if (!res.ok) throw new Error(`download ${seed}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const key = `partners/${prefix}/${randomUUID()}.jpg`;
  await minio.putObject(BUCKET, key, buf, buf.length, { 'Content-Type': 'image/jpeg' });
  return key;
}

async function main() {
  // чистим прежних партнёров (демо-данные)
  await prisma.partner.deleteMany({});
  console.log('Старые партнёры удалены.');

  const cats = await prisma.partnerCategory.findMany();
  const bySlug = new Map(cats.map((c) => [c.slug, c.id]));

  for (const [i, p] of PARTNERS.entries()) {
    let logoKey: string | null = null;
    let coverKey: string | null = null;
    try {
      coverKey = await downloadToMinio(p.coverSeed, 800, 500, 'cover');
      logoKey = await downloadToMinio(p.logoSeed, 300, 300, 'logo');
    } catch (e) {
      console.warn(`  ! картинки для ${p.name}: ${(e as Error).message}`);
    }
    const partner = await prisma.partner.create({
      data: {
        name: p.name,
        categoryId: bySlug.get(p.categorySlug) ?? null,
        address: p.address,
        city: 'Ташкент',
        phone: p.phone,
        lat: p.lat,
        lng: p.lng,
        description: p.description,
        workingHours: p.workingHours,
        logoKey,
        coverKey,
        active: true,
        sortOrder: i,
        services: {
          create: p.services.map((s, j) => ({
            name: s.name,
            priceFrom: s.priceFrom ?? null,
            durationMin: s.durationMin ?? null,
            sortOrder: j,
          })),
        },
      },
    });
    console.log(`  + ${partner.name} [${p.categorySlug}] · ${p.services.length} услуг · img ${coverKey ? 'есть' : 'нет'}`);
  }
  console.log('Готово.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
