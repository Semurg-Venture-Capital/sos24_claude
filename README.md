# SOS24 — Платформа экстренной помощи и страхования

> **«SOS в любой ситуации — страхование, медицина, экстренная помощь 24/7»**
>
> Мобильное приложение (iOS + Android) + веб-лендинг + админка страховой + B2B-кабинет партнёров.
> Регион: Республика Узбекистан · Домен: **sos24.uz**

---

## Продукты платформы

| Категория | Что |
|---|---|
| **Страхование** | ОСАГО, КАСКО, медицинское, жизнь, имущество, путешествия — онлайн за 5 минут |
| **Экстренная помощь** | SOS-кнопка, аджастер 24/7, мгновенная выплата 2 млн сум при ДТП, Европротокол |
| **ИИ-ассистент** | Чат-бот (LLM) маршрутизирует запросы: страхование / медицина / аджастер / SOS |
| **Здравоохранение** | Запись к врачу без очереди, цифровая медкнижка, партнёрские клиники |
| **Умные часы** | Apple Watch + Samsung Watch — SOS одной кнопкой с запястья (фаза 2) |

---

## Стек

### Мобильное приложение
- **React Native** (Expo SDK 55) — iOS + Android, единая кодовая база
- React Navigation v7, TanStack Query, Zustand, React Hook Form + Zod
- NativeWind v4, expo-linear-gradient, expo-blur, expo-glass-effect
- **MyID iOS SDK 3.1.3** — биометрическая верификация личности (государственная система РУз)

### Backend API
- **NestJS** (Node 22, TypeScript strict)
- **PostgreSQL 16** + **Prisma 6** ORM
- **Redis** (BullMQ очереди, кэш)
- **MinIO** (объектное хранилище — фото ДТП, документы)
- JWT (access 15m + refresh 30d), SMS-OTP (Playmobile), MyID, OneID
- Платежи: Uzcard, Payme, Click

### Веб (Admin + Landing + Partner)
- **Next.js 15** (App Router), Tailwind CSS, TanStack Query, Recharts

### Инфраструктура (production)
- **Kubernetes** (RKE2), Cilium, MetalLB, Ingress-NGINX, cert-manager
- **Harbor** (self-hosted Docker Registry)
- **ArgoCD** (GitOps CD), GitHub Actions self-hosted runners
- **HashiCorp Vault** (secrets management)
- **VictoriaMetrics + Grafana + Loki** (мониторинг + логи)
- **Patroni** (PostgreSQL HA), **Redis Sentinel**, **MinIO Distributed**

---

## Монорепо

```
sos24_claude/
├── apps/
│   ├── mobile/          — React Native (Expo) клиентское приложение
│   ├── api/             — NestJS бэкенд (~18 модулей + Socket.IO + BullMQ)
│   ├── admin/           — Next.js веб-админка страховой
│   ├── partner/         — Next.js B2B-кабинет партнёров
│   └── landing/         — Next.js лендинг sos24.uz
│
├── packages/
│   ├── myid-sdk/        — Нативный iOS модуль для MyID SDK
│   ├── api-types/       — TypeScript типы (OpenAPI)
│   ├── config-ts/       — Общие tsconfig
│   ├── config-eslint/   — Общие ESLint конфиги
│   └── i18n-strings/    — Переводы (uz-Latn, uz-Cyrl, ru, en)
│
├── CLAUDE.md            — Контекст проекта для Claude AI (в корне)
├── README.md            — этот файл (в корне)
├── docs/                — ВСЯ документация проекта
│   ├── README.md            — индекс-путеводитель по docs
│   ├── STAGE1.md            — Журнал работ: что сделано, где остановились
│   ├── DEVELOPMENT.md       — Инженерный процесс и команды
│   ├── DEVOPS.md            — Инструкция для DevOps (K8s)
│   ├── PLAN.md              — Технический план и архитектура
│   ├── QUESTIONS.md         — Открытые вопросы к клиенту
│   ├── DESIGN_SYSTEM.md     — Дизайн-токены
│   ├── EUROPROTOCOL.md      — Исследование Европротокола
│   ├── TASKS.md             — Задачи Этапа 0 (legacy)
│   ├── integrations/        — НАПП API (анализ + справочник эндпоинтов)
│   ├── marketing/           — Маркетинг: рынок, стратегия, контент
│   ├── website/             — Тексты лендинга (Framer)
│   └── archive/             — Сырые/legacy материалы
└── docker-compose.yml   — PostgreSQL для локальной разработки
```

---

## Быстрый старт (локальная разработка)

### Требования

| Инструмент | Версия |
|---|---|
| Node.js | **22 LTS** (есть `.nvmrc`) |
| pnpm | **11.x** |
| Docker Desktop | любая |
| Xcode 26+ | только для iOS сборки (Mac) |

```bash
nvm install 22 && nvm use 22
corepack enable && corepack prepare pnpm@11.1.2 --activate
```

### Установка и запуск

```bash
# Клонировать
git clone https://github.com/Semurg-Venture-Capital/sos24_claude.git
cd sos24_claude

# Зависимости
pnpm install

# База данных
docker compose up -d --wait db

# .env для API
cp apps/api/.env.example apps/api/.env
# Заполнить apps/api/.env

# Миграции + seed
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed

# Запуск
pnpm dev:api      # → http://localhost:3030 (swagger: /api-docs)
pnpm dev:admin    # → http://localhost:3035 (другой терминал)
```

### Мобильное приложение

```bash
# iOS симулятор (Mac + Xcode)
cd apps/mobile && npx expo run:ios

# Реальное устройство (после pod install)
npx expo run:ios --device "DEVICE_UDID"

# Веб-превью (без iOS)
pnpm --filter mobile run web   # → http://localhost:8081
```

### Тестовый аккаунт

| Телефон | OTP | Роль |
|---|---|---|
| `+998993286330` | `6330` | ADMIN |

Любой другой номер тоже работает с OTP `6330` — создаст нового пользователя.

---

## Переменные окружения API (`apps/api/.env`)

```bash
DATABASE_URL=postgresql://sos24:sos24@localhost:5434/sos24?schema=public

JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
JWT_ACCESS_TTL=15m   # ВАЖНО: формат "15m", не число
JWT_REFRESH_TTL=30d
PORT=3030

# MyID (биометрия)
MYID_MOCK=false
MYID_BASE_URL=https://api.devmyid.uz
MYID_CLIENT_ID=
MYID_CLIENT_SECRET=
MYID_CLIENT_HASH_ID=
MYID_CLIENT_HASH=
MYID_ENVIRONMENT=debug

# Платежи (нужны реальные credentials)
PAYME_MERCHANT_ID=
PAYME_SECRET_KEY=
CLICK_SERVICE_ID=
CLICK_MERCHANT_ID=
CLICK_SECRET_KEY=
```

---

## Статус проекта

**Этап 1 — Разработка** (начат 2026-05-15)

### Готово ✅

| Модуль | Статус |
|---|---|
| Auth: OTP + MyID iOS SDK (биометрия) | ✅ |
| Mobile: авторизация, Home, полисы, гараж, профиль | ✅ |
| Mobile: страховые компании (маркетплейс) → расчёт → чекаут → оплата | ✅ |
| Mobile: аджастер (вызов + статус + карта) | ✅ |
| Mobile: европротокол (полный флоу + PDF-бланк) | ✅ |
| Mobile: финансы (кошелёк, карты, Payme/Click) | ✅ |
| Mobile: уведомления (push), погода на главной | ✅ |
| Mobile: **поддержка** — realtime-чат с операторами | ✅ |
| Mobile: **партнёры** — каталог, карта, запись на услугу, отзывы | ✅ |
| Проверка полиса и европротокола по QR (публичные страницы) | ✅ |
| Admin: Dashboard, Пользователи (роли), Полисы, Аджастер, Европротоколы | ✅ |
| Admin: Страховые компании, Уведомления, **Поддержка**, **Партнёры** | ✅ |
| Backend: ~18 модулей + Prisma + Socket.IO + BullMQ + MinIO | ✅ |
| Production: API + admin задеплоены, iOS в TestFlight | ✅ |

### Следующее 🔜

- НАПП — реальная интеграция (данные авто/ВУ, PDF полисов)
- ИИ-чатбот (LLM routing)
- Остальные виды страхования (медицина, имущество, жизнь, путешествия)
- Голосовые сообщения и файлы в чате поддержки
- Android: FCM-уведомления, реальный SMS-OTP (Playmobile)

Полный журнал → [`docs/STAGE1.md`](docs/STAGE1.md)

---

## Документация

> Вся документация — в папке [`docs/`](docs/). Индекс: [`docs/README.md`](docs/README.md).

| Файл | Для кого | Содержание |
|---|---|---|
| [`docs/STAGE1.md`](docs/STAGE1.md) | Разработчики | Текущий статус, что сделано, как продолжить |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Разработчики | Команды, конвенции, workflow |
| [`docs/DEVOPS.md`](docs/DEVOPS.md) | DevOps | K8s: RKE2, Harbor, ArgoCD, Vault, мониторинг |
| [`docs/integrations/NAPP_ENDPOINTS.md`](docs/integrations/NAPP_ENDPOINTS.md) | Backend | Справочник эндпоинтов НАПП |
| [`docs/integrations/NAPP.md`](docs/integrations/NAPP.md) | Backend | Полный анализ НАПП API |
| [`docs/PLAN.md`](docs/PLAN.md) | Тимлид | Архитектура, модули, роадмап |
| [`docs/QUESTIONS.md`](docs/QUESTIONS.md) | Менеджер | Открытые вопросы к клиенту |
| [`CLAUDE.md`](CLAUDE.md) | Claude AI | Управляющий файл для AI-ассистента |

---

## Ссылки

| | |
|---|---|
| Репозиторий | https://github.com/Semurg-Venture-Capital/sos24_claude |
| Организация | https://github.com/Semurg-Venture-Capital |
| Swagger (dev) | http://localhost:3030/api-docs |
| Admin (dev) | http://localhost:3035 |
