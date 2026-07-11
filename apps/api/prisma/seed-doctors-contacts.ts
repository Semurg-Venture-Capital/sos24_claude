import { PrismaClient } from '@prisma/client';

// Сид справочника врачей-контактов (режим «Позвонить»): ФИО, специальность, телефон,
// место работы, город. bookingEnabled=false → в приложении кнопка «Позвонить».
// Запуск: pnpm exec ts-node --transpile-only prisma/seed-doctors-contacts.ts
//
// ⚠️ Ниже — ПРИМЕРЫ. Замени массив DOCTORS на реальный список от заказчика
// (можно вставить из Excel/CSV: ФИО, специальность, телефон, клиника, город).
const prisma = new PrismaClient();

interface ContactDoctor {
  id: string; // стабильный ключ для upsert (чтобы повторный запуск не дублировал)
  fullName: string;
  specialty: string;
  phone: string;
  clinicName?: string;
  city?: string;
  experienceY?: number;
  bio?: string;
}

const DOCTORS: ContactDoctor[] = [
  {
    id: 'contact-doc-001',
    fullName: 'Пример Пример Примерович',
    specialty: 'Терапевт',
    phone: '+998 90 000-00-01',
    clinicName: 'Медцентр «Пример»',
    city: 'Ташкент',
    experienceY: 10,
    bio: 'Пример врача-контакта. Замените на реальные данные.',
  },
  {
    id: 'contact-doc-002',
    fullName: 'Тест Тестов',
    specialty: 'Кардиолог',
    phone: '+998 90 000-00-02',
    clinicName: 'Клиника «Тест»',
    city: 'Самарканд',
    experienceY: 15,
  },
];

async function main() {
  for (const d of DOCTORS) {
    const doc = await prisma.doctor.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        fullName: d.fullName,
        specialty: d.specialty,
        phone: d.phone,
        bookingEnabled: false, // режим «Позвонить»
        clinicName: d.clinicName ?? null,
        city: d.city ?? null,
        experienceY: d.experienceY ?? null,
        bio: d.bio ?? null,
        verified: false, // не партнёр SOS24
        active: true,
      },
      update: {
        fullName: d.fullName,
        specialty: d.specialty,
        phone: d.phone,
        bookingEnabled: false,
        clinicName: d.clinicName ?? null,
        city: d.city ?? null,
        experienceY: d.experienceY ?? null,
        bio: d.bio ?? null,
        active: true,
      },
    });
    console.log(`  ✓ ${doc.fullName} · ${doc.specialty} · ${doc.phone}`);
  }
  console.log(`seed-doctors-contacts: готово (${DOCTORS.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
