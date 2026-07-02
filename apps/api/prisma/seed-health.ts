import { PrismaClient } from '@prisma/client';

// Сид раздела «Здоровье» (M14): клиника-партнёр + врачи.
// Запуск: ts-node --transpile-only prisma/seed-health.ts
const prisma = new PrismaClient();

const WD = { open: '09:00', close: '19:00' };
const clinicHours = { mon: WD, tue: WD, wed: WD, thu: WD, fri: WD, sat: { open: '10:00', close: '16:00' }, sun: null };

const CLINIC_ID = 'seed-clinic-shifo-med';

interface DoctorSeed {
  id: string;
  fullName: string;
  specialty: string;
  experienceY: number;
  bio: string;
  rating: number;
  reviewCount: number;
  pricePrimary: number;
  priceRepeat: number;
  priceVideo: number;
}

const DOCTORS: DoctorSeed[] = [
  {
    id: 'seed-doctor-rahimov',
    fullName: 'Дилшод Рахимов',
    specialty: 'ЛОР',
    experienceY: 12,
    bio: 'Кандидат медицинских наук. Лечение заболеваний носа, горла и уха, синуситов, отитов. Принимает в клинике «Шифо-Мед».',
    rating: 4.9,
    reviewCount: 214,
    pricePrimary: 180000,
    priceRepeat: 120000,
    priceVideo: 100000,
  },
  {
    id: 'seed-doctor-sodiqova',
    fullName: 'Малика Содиқова',
    specialty: 'Терапевт',
    experienceY: 9,
    bio: 'Врач-терапевт высшей категории. Первичная диагностика, ведение хронических заболеваний, профилактические осмотры.',
    rating: 4.8,
    reviewCount: 160,
    pricePrimary: 140000,
    priceRepeat: 100000,
    priceVideo: 90000,
  },
  {
    id: 'seed-doctor-yusupov',
    fullName: 'Тимур Юсупов',
    specialty: 'Кардиолог',
    experienceY: 17,
    bio: 'Кардиолог, кандидат медицинских наук. Диагностика и лечение сердечно-сосудистых заболеваний, ЭКГ, суточный мониторинг.',
    rating: 5.0,
    reviewCount: 98,
    pricePrimary: 220000,
    priceRepeat: 150000,
    priceVideo: 120000,
  },
];

async function main() {
  const clinic = await prisma.partner.upsert({
    where: { id: CLINIC_ID },
    create: {
      id: CLINIC_ID,
      name: 'Клиника «Шифо-Мед»',
      type: 'CLINIC',
      address: 'Ташкент, ул. Амира Темура, 42',
      phone: '+998 71 200-10-10',
      city: 'Ташкент',
      lat: 41.311081,
      lng: 69.279737,
      rating: 4.7,
      reviewCount: 0,
      description: 'Многопрофильная клиника · партнёр SOS24. Приём по записи, работает 24/7 по экстренным случаям.',
      workingHours: clinicHours,
      active: true,
    },
    update: { workingHours: clinicHours, active: true },
  });
  console.log(`clinic: ${clinic.name} (${clinic.id})`);

  for (const d of DOCTORS) {
    const doc = await prisma.doctor.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        partnerId: CLINIC_ID,
        fullName: d.fullName,
        specialty: d.specialty,
        experienceY: d.experienceY,
        bio: d.bio,
        rating: d.rating,
        reviewCount: d.reviewCount,
        pricePrimary: d.pricePrimary,
        priceRepeat: d.priceRepeat,
        priceVideo: d.priceVideo,
        videoEnabled: false, // видео отложено (запись только очно)
        verified: true,
        active: true,
      },
      update: {
        partnerId: CLINIC_ID,
        specialty: d.specialty,
        rating: d.rating,
        reviewCount: d.reviewCount,
        pricePrimary: d.pricePrimary,
        priceRepeat: d.priceRepeat,
        priceVideo: d.priceVideo,
        verified: true,
        active: true,
      },
    });
    console.log(`  doctor: ${doc.fullName} · ${doc.specialty}`);
  }
}

main()
  .then(() => console.log('seed-health: готово'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
