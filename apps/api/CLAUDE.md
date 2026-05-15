# apps/api — SOS24 Backend API

> Этот файл дополняет корневой `CLAUDE.md` контекстом, специфичным для бэкенда. Корневой читается первым, потом этот.

## Что это

Единое REST + WebSocket API для всей платформы **SOS24**. Обслуживает:
- Мобильное приложение (`apps/mobile`)
- Лендинг `sos24.uz` (`apps/landing`)
- Админку страховой (`apps/admin`)
- B2B-кабинет партнёров (`apps/partner`)

## Стек

- **Framework:** NestJS (TypeScript strict)
- **DB:** PostgreSQL (через Prisma ORM)
- **Cache:** Redis (BullMQ для очередей, кэш сессий)
- **File storage:** MinIO (self-hosted S3-совместимое хранилище)
- **Auth:** JWT + refresh tokens, SMS-OTP (Playmobile), MyID, OneID
- **Госинтеграции:** NAPP (база авто, ВУ, реестр полисов)
- **Платежи:** Uzcard (собственный платёжный шлюз заказчика)
- **SMS:** Playmobile
- **OpenAPI:** автогенерация Swagger из декораторов NestJS
- **Логи:** Pino + структурный JSON
- **Crash:** Sentry (self-hosted)
- **Bg jobs:** BullMQ
- **Tests:** Jest (unit + integration), supertest (e2e)

## Команды

```bash
pnpm install                       # из корня
pnpm dev:api                       # nest start --watch
pnpm --filter api run start:prod   # запуск production
pnpm --filter api run test         # юнит-тесты
pnpm --filter api run test:e2e     # e2e
pnpm --filter api run lint
pnpm --filter api run typecheck
```

## Структура (план)

```
apps/api/
├── src/
│   ├── main.ts                 # точка входа
│   ├── app.module.ts
│   ├── config/                 # ConfigModule, env-схемы
│   ├── common/                 # фильтры, гарды, интерцепторы, decorators
│   ├── modules/
│   │   ├── auth/               # JWT, refresh, OTP
│   │   ├── users/              # профиль клиента
│   │   ├── identity/           # MyID, OneID, e-IMZO (фаза 2)
│   │   ├── vehicles/           # авто (NAPP)
│   │   ├── policies/           # ОСАГО, КАСКО — оформление и хранение
│   │   ├── claims/             # урегулирование, европротокол
│   │   ├── commissioners/      # аварийные комиссары + диспетчер
│   │   ├── partners/           # B2B (СТО, медклиники)
│   │   ├── payments/           # Uzcard, рассрочка, возвраты
│   │   ├── napp/               # обёртка над NAPP API
│   │   ├── notifications/      # FCM/APNs + email + SMS
│   │   ├── files/              # MinIO uploads (документы, фото ДТП)
│   │   └── admin/              # модерация, отчёты, тарифы
│   └── jobs/                   # BullMQ-воркеры
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## Конвенции

- **Модуль на каждый бизнес-домен** (см. структуру выше)
- **DTO + class-validator** на каждый эндпоинт. Не парсим body вручную
- **Prisma — единственный путь в БД**, никаких raw SQL без причины
- **Каждый эндпоинт → OpenAPI**, типы экспортируем в `packages/api-types` через генерацию
- **Логи — структурные JSON через Pino**, никаких `console.log`
- **Секреты — только через env**, не хардкодим, не коммитим. Шифрование секретов в проде — отдельно

## Интеграции (заглушки на старте, реальные ключи позже)

- **NAPP:** [Q2.1 в QUESTIONS.md] — ждём договор и Swagger
- **MyID / OneID:** [Q3.* в QUESTIONS.md] — ждём доступы
- **Uzcard:** [Q4.* в QUESTIONS.md] — особенно Q4.2 про токенизацию
- **Playmobile:** контакт Жамшид на стороне клиента
