import { PrismaClient } from '@prisma/client';

// Сид клиник-справочника (раздел «Здоровье»). healthDirectory=true → эти клиники
// НЕ показываются в каталоге «Партнёры», только в «Здоровье». Телефон — ресепшн клиники
// (публичный бизнес-контакт). Запуск:
//   pnpm exec ts-node --transpile-only prisma/seed-clinics-directory.ts
//
// ⚠️ Ниже — ПРИМЕРЫ. Замени массив CLINICS на реальный список (название, область, город,
// адрес, ресепшн-телефон). Врачи привязываются к клиникам в seed-doctors-contacts.ts по id.
const prisma = new PrismaClient();

interface DirClinic {
  id: string; // стабильный ключ для upsert
  name: string;
  region: string; // область (см. список в health.service REGIONS)
  city: string;
  address: string;
  phone: string; // ресепшн
}

export const CLINICS: DirClinic[] = [
  {
    id: 'dir-clinic-tash-01',
    name: 'Медцентр «Пример-Ташкент»',
    region: 'Ташкент',
    city: 'Ташкент',
    address: 'ул. Амира Темура, 1',
    phone: '+998 71 200-00-01',
  },
  {
    id: 'dir-clinic-sam-01',
    name: 'Клиника «Пример-Самарканд»',
    region: 'Самаркандская',
    city: 'Самарканд',
    address: 'ул. Регистан, 10',
    phone: '+998 66 233-00-02',
  },
];

async function main() {
  for (const c of CLINICS) {
    const data = {
      name: c.name,
      region: c.region,
      city: c.city,
      address: c.address,
      phone: c.phone,
      healthDirectory: true,
      active: true,
    };
    const p = await prisma.partner.upsert({
      where: { id: c.id },
      create: { id: c.id, ...data },
      update: data,
    });
    console.log(`  ✓ ${p.name} · ${p.region} · ${p.phone}`);
  }
  console.log(`seed-clinics-directory: готово (${CLINICS.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
