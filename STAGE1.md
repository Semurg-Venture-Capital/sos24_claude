# STAGE1.md — Прогресс Этапа 1 (разработка)

> Журнал реальных работ Этапа 1. Что сделано, что отложено, где остановились, как продолжить.
>
> **Последнее обновление:** 2026-05-18

---

## Где остановились

После окончания C12 (Профиль + Гараж) есть полный визуальный прототип основного флоу:

```
Логин → Онбординг → Авторизация (OTP=6330) → Home →
   ├─ Полисы (M8) → Деталь → QR на весь экран
   ├─ Гараж (M3) → Добавить авто (NAPP-мок-поиск)
   ├─ Профиль (M2) → Редактирование → Документы (паспорт/ВУ)
   └─ Quick action «Оформить ОСАГО/КАСКО» →
           Каталог (M4) → ProductDetail → Калькулятор (M5, 4 шага) →
           Чекаут (M6) → Оплата (M7.1) → Успех (M7.2)
```

Всё фронтенд работает на mock-данных. Backend имеет только модуль авторизации (OTP=6330) + модель `User`. Остального бэка — нет.

---

## Что сделано

### Этап A — Backend foundation
- A1 — `docker-compose.yml`: Postgres 16 на `localhost:5434`
- A2 — Prisma 6 + миграция `init`: модель `User` (phone, name, surname, patronymic, birthDate, locale, timestamps)
- A3 — `AuthModule`: `POST /auth/request-otp`, `POST /auth/verify-otp` (статичный код `6330`), `POST /auth/refresh`
- A4 — `UsersModule`: `GET /me`, `PATCH /me/profile` (JwtAuthGuard)
- A5 — Swagger на `/api-docs`, ValidationPipe, CORS
- JWT access 15м + refresh 30д, секреты в `.env`

### Этап B — Mobile foundation
- B1 — Зависимости: NativeWind v4 + Tailwind 3.4, React Navigation v7 (stack + bottom-tabs), TanStack Query, Zustand, RHF + Zod, axios, AsyncStorage, expo-secure-store, expo-blur, expo-font, expo-linear-gradient, react-native-svg, react-native-qrcode-svg, react-native-reanimated, i18next + react-i18next
- B2 — NativeWind theme + Neue Montreal (8 файлов в `assets/fonts/`) + Manrope из `@expo-google-fonts/manrope`
- B3 — i18n: 4 локали (`uz-Latn`, `uz-Cyrl`, `ru`, `en`), ru — основная, остальные клоны с теми же ключами
- B4 — Навигация: `RootNavigator` переключает AuthStack ↔ MainNavigator по `auth.status`; tokens через expo-secure-store (на web → AsyncStorage)
- B5 — `api/client.ts` (axios) с автоматическим refresh при 401; `authStore` (Zustand) с `hydrate`/`setSession`/`signOut`

### Этап C — Экраны
Все 6 экранов M1 (Splash, Onboarding 1–3, AuthChoose, Phone, OTP, ProfileSetup) — **пиксельно** по эталону `SOS24/screens.jsx`. Остальные блоки — где есть пиксельный эталон, переносили его; где только спецификация — собирали из готовых компонентов UI-кита.

| Блок | Что | Источник |
|---|---|---|
| **C0** | UI-кит примитивов (PhoneFrame, GlassPill, RedButton, TextField, OtpBoxes, Segmented, StepperBar, …) | дизайн |
| **C1–C6** | M1 — авторизация (Splash, Onboarding, AuthChoose, Phone, OTP, ProfileSetup) | пиксель |
| **C7** | Home + Bottom Tab Bar (4 таба, glass-капсула, белая активная pill); TopBar; ActionTile; PolicyCardActive; PartnerCard; PromoBanner; SosBanner | пиксель |
| **C8** | M8 Мои полисы — список (StatPill, PolicyListCard, PolicyListCardCompact), деталь (SummaryBlock, большой dark-card с настоящим QR через `react-native-qrcode-svg`), QR на весь экран | пиксель |
| **C9** | M4 Каталог — ProductCard (light/dark), ProductDetail (Section, BenefitRow, ExceptionRow, StepRow, FaqRow аккордеон), DiscountStripe | пиксель |
| **C10** | M5 Калькулятор ОСАГО — 4 шага: CarCard, DriverCard, AddTile, PeriodOption, WarningBox, CoefRow, WizardFrame. Zustand `usePurchaseStore` хранит состояние между шагами | пиксель |
| **C11** | M6 Чекаут (SummaryBlock с «Изменить», Checkbox оферты) → M7.1 Оплата (CardOption, NewCardOption, SecureNote, PayLockIcon) → M7.2 Успех (SuccessTick анимированный, PolicyMiniCard) → M7.3 Мои карты (SavedCardBig с градиентом по бренду) | пиксель |
| **C12** | M2 Профиль (header-card, ListRow в стиле iOS, Toggle, StatusPill, Avatar) + редактирование + Documents. M3 Гараж — список + добавить авто с NAPP-мок-поиском (Avatar, ListRow, FAB) | по спецификации, без пиксельного эталона |

### Дополнительные технические решения
- **Storage:** `react-native-mmkv` заменён на `@react-native-async-storage/async-storage` (Expo Go и web совместимость). См. `[[reference-nativewind-pnpm]]` в памяти.
- **Secure store:** `expo-secure-store` на web → AsyncStorage fallback (нативные модули SecureStore не работают в web).
- **Modal navigation:** `presentation: 'modal'` для PurchaseStack — на native снизу, на web → обычный push (react-native-web модальные стеки рендерит криво).
- **Prisma 6, не 7** — v7 ESM-only, несовместим с CommonJS NestJS. Зафиксировано в `[[reference-prisma-version]]`.

---

## Что НЕ сделано (отложено)

### Этап D — Backend для остального
Большой кусок:
- Модели Prisma: `Vehicle`, `Policy`, `Driver`, `Document`, `Card` (платёжные методы), `Claim` (заявление), `Partner`
- Эндпоинты:
  - `GET/POST/PATCH/DELETE /me/vehicles` (CRUD авто + NAPP-обогащение)
  - `GET/POST/PATCH /me/documents` (паспорт + ВУ + статус верификации)
  - `POST /policies/calculate` (тарифный калькулятор)
  - `POST /policies` (создание чекаут-черновика)
  - `POST /payments/uzcard` (имитация платежа)
  - `GET /me/policies`, `GET /policies/:id` (со статусом и QR-данными)
  - `POST /me/cards` (платёжные карты)
- Замена mock-данных на mobile на реальные API-вызовы через TanStack Query
- Seed-скрипт с тестовыми данными для демонстрации

### Этап C13 — Оставшиеся экраны
В дизайне только placeholder'ы, нужна предварительная отрисовка дизайнером **или** аналогично C12 — собирать из спеки:
- M9 — Урегулирование (заявление о ДТП): начало, вызов комиссара, европротокол wizard, обычное заявление
- M10 — Статус выплат: список заявлений, трекер
- M11 — Уведомления
- M12 — Документы (PDF-полисы)
- M13 — Поддержка: точка входа, чат
- M16 — Партнёры: каталог, деталь, запись

### Технические долги
- **i18n:** на M1 экранах используются `t()`-ключи, **но на C7–C12 (Home, Polices, каталог, калькулятор, оплата, профиль, гараж)** русские строки захардкожены прямо в JSX. Чтобы соблюсти DEVELOPMENT.md §7, нужно пройтись по всем экранам, вынести строки в `packages/i18n-strings/src/locales/ru.json`, заменить на `t('...')`. См. `[[feedback-dev-md-lazy]]`.
- **Git-флоу:** все коммиты идут в `main`, без feature-веток (`feat/<scope>-<name>`). Можно перейти на ветки, когда стабилизируем поток.
- **Lint:** `pnpm lint` не настроен в monorepo (eslint-конфиги в `apps/api/eslint.config.mjs` есть, но `lint` не подключен к turbo pipeline).
- **Тесты:** ни юнит, ни E2E — нет. Когда подключим backend, начинаем с интеграционных тестов на auth/me + поездочного e2e через Maestro.

### Дизайнерская часть
- Дизайнер пока не сделал пиксельный дизайн для M2/M3/M9/M10/M11/M12/M13/M16. Текущая версия M2/M3 (C12) — рабочая, но без визуальной полировки.

---

## Как запустить (Quick Start)

### С нуля (новый комп)
```powershell
# 1. Клонировать репозиторий
git clone <repo-url>
cd Maxmud

# 2. Зависимости
pnpm install

# 3. Поднять БД
docker compose up -d db

# 4. Применить миграции
pnpm --filter api exec prisma migrate deploy
```

### Каждый раз
```powershell
# Терминал 1 — API
pnpm dev:api
# → http://localhost:3030, swagger на /api-docs

# Терминал 2 — Mobile (web превью)
pnpm --filter mobile run web
# → http://localhost:8081

# или Expo Go (нужен телефон и компьютер в одной сети)
pnpm dev:mobile
# → сканируешь QR из Expo Go
```

### Тестовый аккаунт
- Любой телефон в формате `+998XXXXXXXXX`
- OTP-код всегда `6330` (хардкод на бэке, см. `apps/api/src/auth/auth.service.ts:DEV_OTP_CODE`)

---

## Что дальше — варианты

После C12 на выбор:

### Вариант 1 — Этап D (Backend)
**Объём:** ~1 неделя.
Создаём модели, эндпоинты, заменяем моки на реальные данные. После — продаваемый прототип с полной end-to-end работой (регистрация → данные авто из БД → реальный расчёт → создание полиса → видим в списке).

### Вариант 2 — Этап C13 (оставшиеся экраны)
**Объём:** ~3-4 дня.
Доделать визуально все оставшиеся placeholder'ы (ДТП, выплаты, партнёры, поддержка, документы, уведомления). Останется только бэк и реальные интеграции.

### Вариант 3 — Закрыть технические долги
**Объём:** ~1-2 дня.
- Вытащить все русские строки в i18n (~30 мин на экран × 12 экранов)
- Настроить `pnpm lint`
- Перейти на feature-ветки + PR-флоу
- Добавить первые тесты на auth-флоу

**Рекомендация:** Этап D следующим — основной коммерческий флоу заработает «вживую». C13 и долги можно догонять параллельно.

---

## Файлы и навигация

| Файл / папка | Что внутри |
|---|---|
| `CLAUDE.md` | главный контекст проекта |
| `DEVELOPMENT.md` | процесс разработки (ветки, конвенции, i18n, команды) |
| `PLAN.md` | архитектура и модули |
| `STAGE1.md` | **этот файл** — журнал реальных работ |
| `TASKS.md` | подготовительные задачи Этапа 0 (legacy) |
| `QUESTIONS.md` | открытые вопросы клиенту |
| `DESIGN_SYSTEM.md` | дизайн-токены |
| `SOS24/` | дизайн-референсы от фронтендера (HTML + JSX) |
| `apps/api/` | NestJS бэкенд (Prisma + JWT + OTP) |
| `apps/mobile/` | Expo + React Native приложение |
| `apps/mobile/src/components/ui/` | ~40 переиспользуемых компонентов UI-кита |
| `apps/mobile/src/components/icons/` | SVG-иконки (`react-native-svg`) |
| `apps/mobile/src/features/auth/` | M1 — авторизация |
| `apps/mobile/src/features/policies/` | M8 — Мои полисы |
| `apps/mobile/src/features/purchase/` | M4/M5/M6/M7 — каталог, калькулятор, оплата |
| `apps/mobile/src/features/profile/` | M2 — Профиль |
| `apps/mobile/src/features/garage/` | M3 — Гараж |
| `apps/mobile/src/features/main/screens/HomeScreen.tsx` | Home + bottom tab navigation |
| `apps/mobile/src/navigation/*Navigator.tsx` | стеки навигации |
