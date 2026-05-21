import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Тестовый аккаунт для разработки и демо.
// OTP-код для входа: 6330 (статичный, см. auth.service.ts → DEV_OTP_CODE).
const TEST_PHONE = '+998993286330';

async function main() {
  console.log(`Seeding test user ${TEST_PHONE} …`);

  const myidFields = {
    name: 'Азиз',
    surname: 'Каримов',
    patronymic: 'Эркинович',
    nameEn: 'Aziz',
    surnameEn: 'Karimov',
    birthDate: new Date('1990-05-14'),
    birthPlace: 'Тошкент шаҳри',
    gender: 'M',
    nationality: 'UZB',
    citizenship: 'UZB',
    address: 'Тошкент шаҳри, Юнусобод тумани',
    myidRaw: { _mock: true, comparison_value: 0.98, job_id: 'seed-mock-job' },
  };

  const user = await prisma.user.upsert({
    where: { phone: TEST_PHONE },
    update: { ...myidFields, locale: 'ru', role: 'ADMIN', verificationStatus: 'MYID_VERIFIED' },
    create: { phone: TEST_PHONE, ...myidFields, locale: 'ru', role: 'ADMIN', verificationStatus: 'MYID_VERIFIED' },
  });

  console.log(`User: ${user.id}`);

  const vehicles = [
    {
      plate: '01 A 123 BB',
      brand: 'Chevrolet',
      model: 'Cobalt',
      year: 2021,
      engine: '1.5 л',
      power: '105 л.с.',
      color: 'белый',
    },
    {
      plate: '10 R 555 AC',
      brand: 'Hyundai',
      model: 'Sonata',
      year: 2019,
      engine: '2.0 л',
      power: '150 л.с.',
      color: 'графит',
    },
  ];

  for (const v of vehicles) {
    const result = await prisma.vehicle.upsert({
      where: { userId_plate: { userId: user.id, plate: v.plate } },
      update: v,
      create: { userId: user.id, ...v },
    });
    console.log(`  Vehicle: ${result.plate} (${result.brand} ${result.model})`);
  }

  // Документы
  const passport = await prisma.document.upsert({
    where: { userId_kind: { userId: user.id, kind: 'PASSPORT' } },
    update: {
      series: 'AA',
      number: '4587213',
      issuedAt: new Date('2018-04-12'),
      issuedBy: 'УВД Мирабадского района г. Ташкента',
      pinfl: '52605905130018',
      status: 'VERIFIED',
    },
    create: {
      userId: user.id,
      kind: 'PASSPORT',
      series: 'AA',
      number: '4587213',
      issuedAt: new Date('2018-04-12'),
      issuedBy: 'УВД Мирабадского района г. Ташкента',
      pinfl: '52605905130018',
      status: 'VERIFIED',
    },
  });
  console.log(`  Document: ${passport.kind} ${passport.series} ${passport.number}`);

  // Промокод
  const promo = await prisma.promo.upsert({
    where: { code: 'SOS10' },
    update: { discountPct: 10, isActive: true, validUntil: new Date('2026-12-31') },
    create: {
      code: 'SOS10',
      discountPct: 10,
      validUntil: new Date('2026-12-31'),
      isActive: true,
    },
  });
  console.log(`  Promo: ${promo.code} -${promo.discountPct}%`);

  const license = await prisma.document.upsert({
    where: { userId_kind: { userId: user.id, kind: 'DRIVER_LICENSE' } },
    update: {
      series: 'AB',
      number: '2345678',
      issuedAt: new Date('2016-07-22'),
      issuedBy: 'УБДД ГУВД г. Ташкента',
      expiresAt: new Date('2026-07-22'),
      categories: 'B,C',
      status: 'VERIFIED',
    },
    create: {
      userId: user.id,
      kind: 'DRIVER_LICENSE',
      series: 'AB',
      number: '2345678',
      issuedAt: new Date('2016-07-22'),
      issuedBy: 'УБДД ГУВД г. Ташкента',
      expiresAt: new Date('2026-07-22'),
      categories: 'B,C',
      status: 'VERIFIED',
    },
  });
  console.log(`  Document: ${license.kind} ${license.series} ${license.number} (${license.categories})`);

  // Водители (вписан он сам + жена по доверенности)
  await prisma.driver.deleteMany({ where: { userId: user.id } });
  const driverSelf = await prisma.driver.create({
    data: {
      userId: user.id,
      name: 'Каримов Азиз Эркинович',
      licenseSeries: 'AB',
      licenseNumber: '2345678',
      experienceYears: 8,
      birthDate: new Date('1990-05-14'),
    },
  });
  const driverWife = await prisma.driver.create({
    data: {
      userId: user.id,
      name: 'Каримова Мухаббат Хасановна',
      licenseSeries: 'AC',
      licenseNumber: '1122334',
      experienceYears: 4,
      birthDate: new Date('1993-09-02'),
    },
  });
  console.log(`  Driver: ${driverSelf.name} (${driverSelf.experienceYears} лет)`);
  console.log(`  Driver: ${driverWife.name} (${driverWife.experienceYears} года)`);

  // 2 активных полиса
  const vehicleCobalt = await prisma.vehicle.findFirst({
    where: { userId: user.id, plate: '01 A 123 BB' },
  });
  const vehicleSonata = await prisma.vehicle.findFirst({
    where: { userId: user.id, plate: '10 R 555 AC' },
  });

  if (vehicleCobalt) {
    const startK = new Date('2026-05-11');
    const endK = new Date('2027-05-11');
    await prisma.policy.deleteMany({ where: { userId: user.id, vehicleId: vehicleCobalt.id } });
    const kasko = await prisma.policy.create({
      data: {
        userId: user.id,
        type: 'KASKO',
        status: 'ACTIVE',
        vehicleId: vehicleCobalt.id,
        startDate: startK,
        endDate: endK,
        periodMonths: 12,
        driverLimit: 'LIMITED',
        basePrice: 4824300,
        discount: 0,
        totalPrice: 4824300,
        policyNumber: '№ 1225 7821 3344',
        qrPayload: 'sos24://policy/seed-kasko-cobalt',
        activatedAt: new Date('2026-05-11'),
        drivers: { create: [{ driverId: driverSelf.id }, { driverId: driverWife.id }] },
      },
    });
    console.log(`  Policy: ${kasko.type} ${kasko.policyNumber}`);
  }

  if (vehicleSonata) {
    const startO = new Date('2025-06-26');
    const endO = new Date('2026-06-26');
    await prisma.policy.deleteMany({ where: { userId: user.id, vehicleId: vehicleSonata.id } });
    const osago = await prisma.policy.create({
      data: {
        userId: user.id,
        type: 'OSAGO',
        status: 'ACTIVE',
        vehicleId: vehicleSonata.id,
        startDate: startO,
        endDate: endO,
        periodMonths: 12,
        driverLimit: 'LIMITED',
        basePrice: 385600,
        discount: 0,
        totalPrice: 385600,
        policyNumber: '№ 1224 5566 7788',
        qrPayload: 'sos24://policy/seed-osago-sonata',
        activatedAt: new Date('2025-06-26'),
        drivers: { create: [{ driverId: driverSelf.id }] },
      },
    });
    console.log(`  Policy: ${osago.type} ${osago.policyNumber}`);
  }

  // Кошелёк и карты
  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: 500000 },
    create: { userId: user.id, balance: 500000 },
  });
  console.log(`  Wallet: ${wallet.balance.toLocaleString('ru-RU')} сум`);

  await prisma.card.deleteMany({ where: { userId: user.id } });
  const cardUzcard = await prisma.card.create({
    data: {
      userId: user.id,
      brand: 'UZCARD',
      last4: '4582',
      expiry: '08/27',
      token: 'mock_seed_uzcard_4582',
      isDefault: true,
    },
  });
  const cardHumo = await prisma.card.create({
    data: {
      userId: user.id,
      brand: 'HUMO',
      last4: '1190',
      expiry: '03/28',
      token: 'mock_seed_humo_1190',
      isDefault: false,
    },
  });
  console.log(`  Card: ${cardUzcard.brand} •••• ${cardUzcard.last4} (default)`);
  console.log(`  Card: ${cardHumo.brand} •••• ${cardHumo.last4}`);

  // Partners
  const partnerSeed = [
    { name: 'AutoFix СТО',  type: 'STO'    as const, address: 'ул. Амира Темура, 47', phone: '+998712345678', rating: 4.8, isOpen: true,  city: 'Ташкент', lat: 41.2995, lng: 69.2401 },
    { name: 'Медсервис',    type: 'CLINIC' as const, address: 'ул. Навои, 15',        phone: '+998712345679', rating: 4.6, isOpen: true,  city: 'Ташкент', lat: 41.3050, lng: 69.2500 },
    { name: 'АвтоЦентр',   type: 'STO'    as const, address: 'пр. Мустакиллик, 88',  phone: '+998712345680', rating: 4.5, isOpen: false, city: 'Ташкент', lat: 41.2900, lng: 69.2350 },
    { name: 'Эвак-24',     type: 'TOWING' as const, address: 'ул. Катартал, 12',     phone: '+998712345681', rating: 4.9, isOpen: true,  city: 'Ташкент', lat: 41.3100, lng: 69.2600 },
    { name: 'МедПомощь',   type: 'CLINIC' as const, address: 'ул. Чиланзар, 5',      phone: '+998712345682', rating: 4.4, isOpen: true,  city: 'Ташкент', lat: 41.2850, lng: 69.2280 },
    { name: 'ТехПомощь СТО', type: 'STO'  as const, address: 'ул. Юнусобод, 33',     phone: '+998712345683', rating: 4.7, isOpen: true,  city: 'Ташкент', lat: 41.3200, lng: 69.2700 },
  ];
  for (const p of partnerSeed) {
    await prisma.partner.upsert({
      where: { id: `seed-partner-${p.name}` },
      update: p,
      create: { id: `seed-partner-${p.name}`, ...p },
    });
  }
  console.log(`  Partners: ${partnerSeed.length} upserted`);

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
