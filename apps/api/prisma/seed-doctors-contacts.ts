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
  clinicId: string; // ссылка на клинику-справочник (seed-clinics-directory) — область+ресепшн оттуда
  phone?: string; // свой номер врача (опц.); если нет — звонок идёт на ресепшн клиники
  experienceY?: number;
  bio?: string;
}

// clinicId должен существовать (сначала запусти seed-clinics-directory.ts).
const DOCTORS: ContactDoctor[] = [
  {
    id: 'contact-doc-001',
    fullName: 'Пример Пример Примерович',
    specialty: 'Терапевт',
    clinicId: 'dir-clinic-tash-01',
    experienceY: 10,
    bio: 'Пример врача-контакта. Замените на реальные данные.',
  },
  {
    id: 'contact-doc-002',
    fullName: 'Тест Тестов',
    specialty: 'Кардиолог',
    clinicId: 'dir-clinic-sam-01',
    experienceY: 15,
  },
];

async function main() {
  for (const d of DOCTORS) {
    const clinic = await prisma.partner.findUnique({ where: { id: d.clinicId }, select: { id: true, name: true } });
    if (!clinic) {
      console.warn(`  ⚠ пропуск ${d.fullName}: клиника ${d.clinicId} не найдена (сначала seed-clinics-directory.ts)`);
      continue;
    }
    const data = {
      fullName: d.fullName,
      specialty: d.specialty,
      phone: d.phone ?? null, // нет своего → звонок на ресепшн клиники (fallback в API)
      bookingEnabled: false, // режим «Позвонить»
      partnerId: d.clinicId,
      experienceY: d.experienceY ?? null,
      bio: d.bio ?? null,
      verified: false, // не партнёр SOS24
      active: true,
    };
    const doc = await prisma.doctor.upsert({
      where: { id: d.id },
      create: { id: d.id, ...data },
      update: data,
    });
    console.log(`  ✓ ${doc.fullName} · ${doc.specialty} · ${clinic.name}`);
  }
  console.log(`seed-doctors-contacts: готово (${DOCTORS.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
