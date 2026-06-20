import { PrismaClient, ProductType } from '@prisma/client';

// Сид каталога: одна компания-заказчик «SOS24 Sugʻurta» + 5 базовых продуктов
// с контентом, перенесённым из старой статики мобайла. Идемпотентно (upsert).
// Возвращает карту тип → { companyId, productId } для привязки демо-полисов.

interface SeedProduct {
  type: ProductType;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  pricingMode: 'COEFFICIENT' | 'PLANS';
  baseRate?: number;
  content: {
    covers: { title: string; body: string }[];
    exceptions: string[];
    steps: { title: string; body: string }[];
    faqs: { question: string; answer?: string }[];
  };
  plans?: { name: string; price: number; coverageAmount?: number; features?: string[] }[];
}

const PRODUCTS: SeedProduct[] = [
  {
    type: 'OSAGO',
    slug: 'osago',
    name: 'ОСАГО',
    shortDescription: 'Страхование гражданской ответственности',
    longDescription: 'Покрывает ваш ущерб другим автомобилям и людям при ДТП.',
    pricingMode: 'COEFFICIENT',
    baseRate: 320000,
    content: {
      covers: [
        { title: 'Ущерб транспорту', body: 'Ремонт автомобиля пострадавшего' },
        { title: 'Вред здоровью', body: 'Лечение пострадавших в ДТП' },
        { title: 'Имущественный ущерб', body: 'Ограждения, столбы, фасады' },
      ],
      exceptions: ['Ущерб собственному автомобилю', 'Алкогольное и наркотическое опьянение', 'ДТП вне территории Узбекистана'],
      steps: [
        { title: 'Введите номер авто', body: 'Данные подтянутся автоматически' },
        { title: 'Выберите параметры', body: 'Срок, водители, период' },
        { title: 'Оплатите онлайн', body: 'Карта Uzcard или Humo' },
        { title: 'Получите е-полис', body: 'Мгновенно в приложении' },
      ],
      faqs: [
        { question: 'Действует ли полис в первый день?', answer: 'Да, после успешной оплаты полис активируется через 1 час.' },
        { question: 'Что делать при ДТП?', answer: 'Используйте кнопку «Сообщить о ДТП» в приложении — вызов инспектора и фото-фиксация прямо с телефона.' },
        { question: 'Можно ли продлить полис?', answer: 'Да, кнопка «Продлить» появляется в деталях полиса за 30 дней до истечения.' },
      ],
    },
  },
  {
    type: 'KASKO',
    slug: 'kasko',
    name: 'КАСКО',
    shortDescription: 'Комплексное страхование автомобиля',
    longDescription: 'Угон, ущерб от ДТП и третьих лиц, стихийные бедствия — всё в одном полисе.',
    pricingMode: 'COEFFICIENT',
    baseRate: 4200000,
    content: {
      covers: [
        { title: 'Угон автомобиля', body: 'Полная компенсация при угоне' },
        { title: 'Ущерб от ДТП', body: 'По вашей вине или без виновника' },
        { title: 'Стихийные бедствия', body: 'Град, пожар, наводнение, дерево' },
      ],
      exceptions: ['Естественный износ автомобиля', 'Управление без прав соответствующей категории', 'Использование в коммерческих целях без декларации'],
      steps: [
        { title: 'Введите номер авто', body: 'Данные подтянутся автоматически' },
        { title: 'Выберите покрытие', body: 'Угон, ущерб, доп. опции' },
        { title: 'Оплатите онлайн', body: 'Можно в рассрочку до 12 мес' },
        { title: 'Получите е-полис', body: 'Мгновенно в приложении' },
      ],
      faqs: [
        { question: 'Нужен ли осмотр авто перед оформлением?', answer: 'Да, для новых полисов КАСКО требуется фото-осмотр через приложение. Занимает 5 минут.' },
        { question: 'Что если виновник — я?', answer: 'КАСКО покрывает ущерб вашему авто независимо от вины. В отличие от ОСАГО, который покрывает только ущерб другим.' },
        { question: 'Можно ли менять список водителей?', answer: 'Да, через приложение в течение действия полиса. Перерасчёт премии — автоматический.' },
      ],
    },
  },
  {
    type: 'HEALTH',
    slug: 'health',
    name: 'Здоровье',
    shortDescription: 'Защита при болезни и несчастных случаях',
    longDescription: 'Госпитализация, амбулаторное лечение и выплаты при тяжёлых состояниях.',
    pricingMode: 'PLANS',
    content: {
      covers: [
        { title: 'Госпитализация', body: 'Стационарное лечение в любой клинике сети' },
        { title: 'Срочные выплаты', body: 'На лечение в течение 3 рабочих дней' },
        { title: 'Тяжёлые состояния', body: 'Единовременная выплата до 50 млн сум' },
      ],
      exceptions: ['Лечение хронических заболеваний, существовавших до полиса', 'Косметология и эстетическая медицина', 'Лечение в результате опьянения'],
      steps: [
        { title: 'Заполните анкету', body: 'Несколько данных о здоровье' },
        { title: 'Выберите план', body: 'Сумма покрытия от 10 до 100 млн' },
        { title: 'Оплатите онлайн', body: 'Карта или кошелёк SOS24' },
        { title: 'Получите е-полис', body: 'Действует с момента оплаты' },
      ],
      faqs: [
        { question: 'Нужно ли проходить медосмотр?', answer: 'Для базового пакета — нет. Для покрытий свыше 30 млн нужна анкета.' },
        { question: 'Как обратиться при болезни?', answer: 'Через приложение или единый колл-центр 1052.' },
        { question: 'Когда полис начинает действовать?', answer: 'Лечение покрывается с 31-го дня после оплаты — стандартный срок выжидания.' },
      ],
    },
    plans: [
      { name: 'Базовый', price: 1200000, coverageAmount: 10000000, features: ['Госпитализация', 'Амбулаторное лечение', 'Колл-центр 24/7'] },
      { name: 'Стандарт', price: 2500000, coverageAmount: 30000000, features: ['Всё из «Базовый»', 'Стоматология', 'Выплаты при тяжёлых состояниях'] },
      { name: 'Премиум', price: 4500000, coverageAmount: 100000000, features: ['Всё из «Стандарт»', 'Лечение за рубежом', 'Личный менеджер'] },
    ],
  },
  {
    type: 'HOME',
    slug: 'home',
    name: 'Дом и имущество',
    shortDescription: 'Защита квартиры или дома от рисков',
    longDescription: 'От пожара, кражи и стихийных бедствий — для квартиры или частного дома.',
    pricingMode: 'PLANS',
    content: {
      covers: [
        { title: 'Стены и отделка', body: 'Восстановление после пожара, залива, стихийных бедствий' },
        { title: 'Кража и грабёж', body: 'Возмещение похищенного имущества' },
        { title: 'Перед соседями', body: 'Если затопили или повредили чужое имущество' },
      ],
      exceptions: ['Ущерб от изношенных коммуникаций без обслуживания', 'Имущество вне страхуемого помещения', 'Военные действия и террор'],
      steps: [
        { title: 'Опишите объект', body: 'Тип, площадь, адрес' },
        { title: 'Выберите план', body: 'Базовый или расширенный пакет' },
        { title: 'Оплатите онлайн', body: 'Карта или кошелёк SOS24' },
        { title: 'Получите е-полис', body: 'Действует с момента оплаты' },
      ],
      faqs: [
        { question: 'Нужен ли осмотр квартиры?', answer: 'Для сумм страхования до 200 млн — нет, достаточно фото. Свыше — приедет агент.' },
        { question: 'Что делать при затоплении соседей?', answer: 'Сразу зафиксируйте через приложение и вызовите ЖЭК — выплата в течение 14 дней.' },
        { question: 'Можно ли застраховать арендованную квартиру?', answer: 'Можно — полис покрывает только ваше имущество и ответственность.' },
      ],
    },
    plans: [
      { name: 'Базовый', price: 2800000, coverageAmount: 100000000, features: ['Стены и отделка', 'Пожар и залив', 'Кража'] },
      { name: 'Расширенный', price: 4500000, coverageAmount: 200000000, features: ['Всё из «Базовый»', 'Ответственность перед соседями', 'Движимое имущество'] },
    ],
  },
  {
    type: 'FINANCE',
    slug: 'finance',
    name: 'Финансовая защита',
    shortDescription: 'Поддержка при потере дохода',
    longDescription: 'Покрытие платежей по кредиту при потере работы, болезни или несчастном случае.',
    pricingMode: 'PLANS',
    content: {
      covers: [
        { title: 'Потеря работы', body: 'Платежи покрываются до 6 месяцев' },
        { title: 'Временная нетрудоспособность', body: 'При больничном свыше 30 дней' },
        { title: 'Несчастный случай', body: 'Единовременная выплата при инвалидности' },
      ],
      exceptions: ['Увольнение по статье или по соглашению сторон', 'Безработица в течение первых 90 дней действия полиса', 'Самозанятость и фриланс без официального трудоустройства'],
      steps: [
        { title: 'Укажите кредит', body: 'Сумма, банк, срок' },
        { title: 'Выберите план', body: 'Один, несколько или полный пакет' },
        { title: 'Оплатите онлайн', body: 'Карта или кошелёк SOS24' },
        { title: 'Получите е-полис', body: 'Действует с момента оплаты' },
      ],
      faqs: [
        { question: 'Можно ли застраховать ипотеку?', answer: 'Да, мы работаем со всеми банками Узбекистана.' },
        { question: 'Что считается потерей работы?', answer: 'Сокращение, ликвидация работодателя, окончание трудового договора по инициативе работодателя.' },
        { question: 'Как получить выплату?', answer: 'После 30-го дня безработицы — через приложение, выплата на ваш карточный счёт.' },
      ],
    },
    plans: [
      { name: 'Базовый', price: 800000, features: ['Потеря работы — до 6 платежей'] },
      { name: 'Полный', price: 1500000, features: ['Потеря работы', 'Нетрудоспособность', 'Несчастный случай'] },
    ],
  },
];

export async function seedInsurance(prisma: PrismaClient): Promise<Map<ProductType, { companyId: string; productId: string }>> {
  const company = await prisma.insuranceCompany.upsert({
    where: { slug: 'sos24' },
    update: { name: 'SOS24 Sugʻurta', active: true, sortOrder: 0 },
    create: { slug: 'sos24', name: 'SOS24 Sugʻurta', description: 'Страховой партнёр платформы SOS24', active: true, sortOrder: 0 },
  });
  console.log(`  Company: ${company.name} (${company.slug})`);

  const map = new Map<ProductType, { companyId: string; productId: string }>();

  for (const [i, p] of PRODUCTS.entries()) {
    const product = await prisma.insuranceProduct.upsert({
      where: { companyId_slug: { companyId: company.id, slug: p.slug } },
      update: {
        type: p.type,
        name: p.name,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        pricingMode: p.pricingMode,
        baseRate: p.baseRate ?? null,
        content: p.content,
        active: true,
        sortOrder: i,
      },
      create: {
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

    // Планы пересоздаём (нет естественного уникального ключа).
    await prisma.productPlan.deleteMany({ where: { productId: product.id } });
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
    console.log(`  Product: ${product.name} [${p.pricingMode}]${p.plans ? ` · ${p.plans.length} плана` : ''}`);
    map.set(p.type, { companyId: company.id, productId: product.id });
  }

  return map;
}
