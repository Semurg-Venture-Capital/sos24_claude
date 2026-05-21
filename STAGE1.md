# STAGE1.md — Прогресс Этапа 1 (разработка)

> Журнал реальных работ Этапа 1. Что сделано, что отложено, где остановились, как продолжить.
>
> **Последнее обновление:** 2026-05-20

---

## Где остановились

**Полный end-to-end флоу страхового полиса на реальном API.** От Home → Catalog → ProductDetail → Calc (4 шага для ОСАГО/КАСКО, фикс-цена для health/home/finance) → Checkout (промокод SOS10) → Payment (кошелёк + карты) → Success — всё через бэкенд, никаких mock-ов в этой цепочке.

```
Логин (+998993286330 / OTP=6330) → Home (имя из /me, полисы из /me/policies)
   ├─ Полисы (M8) → /me/policies, /policies/:id → Деталь + QR ⚠️ экран на моках
   ├─ Гараж (M3) → /me/vehicles (read), Add через /napp/vehicle/:plate ⚠️ GarageEdit на моках
   ├─ Профиль (M2) → /me, /me/documents → Document edit /me/documents/:kind
   └─ Quick action «Страховой полис / Аджастер» →
           Catalog (5 продуктов, statiс) → ProductDetail (по type) →
           Calc Vehicle (/me/vehicles) → Drivers (/me/drivers) → Period → Result →
           Checkout (/promo/validate + /policies) → Payment (/me/wallet + /me/cards + /payments/uzcard) →
           Success (/policies/:id с реальным policyNumber + QR)
```

**Текущая ветка:** `feat/native-tabs`. **6 новых коммитов** относительно `main` (см. `git log main..feat/native-tabs`). `main` устарела — для продакшена пора мержить.

**Тестовый юзер:** `+998993286330` (Азиз Каримов), OTP всегда `6330`. Сид создаёт 2 авто (Cobalt + Sonata), 2 водителя, паспорт+ВУ (VERIFIED), 2 ACTIVE полиса, кошелёк 500 000, 2 карты, промокод `SOS10` (−10%).

---

## Что сделано

### Этап A — Backend foundation (раньше)
- `docker-compose.yml`: Postgres 16 на `localhost:5434`
- Prisma 6 + миграция `init`: модель `User`
- `AuthModule`: `POST /auth/request-otp`, `POST /auth/verify-otp` (OTP=`6330`), `POST /auth/refresh`
- `UsersModule`: `GET /me`, `PATCH /me/profile`
- Swagger на `/api-docs`, ValidationPipe, CORS, JWT 15м/30д

### Этап B — Mobile foundation (раньше)
- Зависимости: NativeWind v4 + Tailwind 3.4, React Navigation v7, TanStack Query, Zustand, RHF + Zod, axios, AsyncStorage, expo-secure-store, expo-blur, expo-font, expo-linear-gradient, react-native-svg, react-native-qrcode-svg, react-native-reanimated, i18next + react-i18next
- 4 локали (`uz-Latn`, `uz-Cyrl`, `ru`, `en`), ru — основная
- `RootNavigator` переключает AuthStack ↔ MainNavigator
- `api/client.ts` с автоматическим refresh при 401, `authStore` Zustand

### Этап C — Экраны (раньше)
| Блок | Что | Источник |
|---|---|---|
| C0 | UI-кит ~40 примитивов | дизайн |
| C1–C6 | M1 — авторизация | пиксель |
| C7 | Home + Bottom Tab Bar | пиксель |
| C8 | M8 Полисы — список + деталь + QR | пиксель |
| C9 | M4 Каталог + ProductDetail | пиксель |
| C10 | M5 Калькулятор 4 шага | пиксель |
| C11 | M6 Чекаут → M7 Оплата → Успех → MyCards | пиксель |
| C12 | M2 Профиль + Редактор + Documents, M3 Гараж + Add | спецификация |

### Этап D — Дизайн-обновление 2026-05-20
Дизайнер обновил эталоны (`SOS24/`). Перенесено в код:
- **Home плитки 2×2 пересобраны:** Страховой полис / Аджастер / Партнёры / Европротокол + новые Lucide-style иконки в `QuickActionIcons.tsx`
- **SosBanner новый текст:** «SOS — экстренная помощь» / «ДТП, мед. помощь, угон — поможем разобраться»
- **Глобальный ребрендинг «комиссар» → «инспектор»** (4 i18n локали + IllusOnboardingHelp + CatalogScreen + ProductDetailScreen)
- **Catalog: 5 продуктов** (добавлены Здоровье, Дом и имущество, Финансовая защита) + контент ProductDetail для них (covers/exceptions/steps/FAQ в стиле бренда)
- Для не-авто продуктов CTA «Рассчитать» сразу ведёт в Checkout (фикс-цена, без калькулятора авто)
- Поле промокода в Checkout (`SOS10` → −10%)
- `WalletPayOption` компонент — кошелёк SOS24 с балансом, sufficient/insufficient

### Этап E — Liquid Glass + UI-улучшения 2026-05-20
- **`expo-glass-effect`** для iOS 26 Liquid Glass: `GlassPill`, `IconButton`, `PartnerCard`, `ActionTile (light)` переведены с BlurView. На iOS<26 / Android — фоллбэк BlurView из самого пакета. `borderRadius`+`overflow:hidden` на самом GlassView (иначе обрезается родителем)
- **Floating TopBar** на Home: `position:absolute`, контент скроллится под ним
- **Fade-overlay сверху и снизу** на Home: `pageBg α=0 → pageBg α=1` (важно — не `transparent`, иначе будет грязный серый интерполяционный)
- **PhoneFrame пропсы** `topSafeArea` / `bottomSafeArea` — для fullbleed экранов
- **Клавиатура:** PhoneScreen сдвигает heading-блок при kbOpen; ProfileSetup/ProfileEdit/Document/GarageEdit получили `keyboardShouldPersistTaps="handled"` + `automaticallyAdjustKeyboardInsets`

### Эксперимент: @expo/ui SwiftUI glass-кнопки (отклонён)
Попробовали заменить `RedButton`/`OutlineButton` на AuthChoose на `<Button buttonStyle('glassProminent')>` через `@expo/ui/swift-ui`. **Не подошло:** SwiftUI glass Button hugging по контенту, `frame({width,height})` не растягивает. Откатили, оставили `RedButton`/`OutlineButton`. `@expo/ui` остался в зависимостях для будущих use-case (DatePicker, Menu, inline-pills). Память: `[[feedback-expo-ui-glass-button-fixed-size]]`.

### Этап D-2 — Backend для остального (2026-05-20)
**8 новых модулей, ~30 endpoints, 4 миграции, seed.**

**S1 — Vehicles + NAPP mock:**
- `Vehicle` (User 1:N, unique [userId,plate])
- `VehiclesModule`: `GET/POST/PATCH/DELETE /me/vehicles` + `GET /me/vehicles/:id`
- `NappModule`: `GET /napp/vehicle/:plate` (deterministic mock из пула 8 моделей по hash plate)

**S2 — Documents:**
- `Document` enum `PASSPORT`/`DRIVER_LICENSE`, unique [userId,kind]
- `DocumentsModule`: `GET /me/documents`, `GET/PUT /me/documents/:kind` (upsert)
- Валидация: PINFL обязателен для паспорта (400)

**S3 — Policies + Drivers + Promo:**
- `Policy` (5 ProductType, статусы DRAFT→PENDING_PAYMENT→ACTIVE→EXPIRED/CANCELLED)
- `Driver` — **отдельная сущность** для доверенности (один юзер может вписать в полис нескольких водителей, в т.ч. чужих по ФИО+ВУ без аккаунта)
- `PolicyDriver` M:N
- `Promo` (code unique, discountPct, validFrom/Until, maxUses)
- `DriversModule` CRUD `/me/drivers`
- `PromoModule`: `POST /promo/validate` (404 если истёк/исчерпан/неактивен)
- `PoliciesModule`: `POST /policies/calculate` (коэф-ты для ОСАГО/КАСКО, фикс для health/home/finance), `POST /policies` (создаёт DRAFT), `GET /me/policies`, `GET /policies/:id`
- `pricing.ts`: BASE_PRICE + коэф-ты периода (12=1.0, 6=0.55, 3=0.32), территории (Ташкент 1.15), стажа (8лет 0.95), лимита водителей (LIMITED 0.9, UNLIMITED 1.25)

**S4 — Cards + Wallet + Payments mock:**
- `Card` (token mock-Uzcard tokenization, brand UZCARD/HUMO/VISA/MC, last4, expiry, isDefault)
- `Wallet` (1:1 user, balance), `WalletTransaction` (TOPUP/PAYMENT/REFUND/BONUS)
- `Payment` (status PENDING/SUCCESS/FAILED/REFUNDED)
- `CardsModule`, `WalletModule`, `PaymentsModule`
- `POST /payments/uzcard` — **mock-Uzcard**: 1.5с задержка, **90% success / 10% random fail**. При SUCCESS списывает с кошелька (если method=WALLET) и активирует полис через `PoliciesService.activate` (генерация policyNumber + qrPayload)

**Сид (`prisma/seed.ts`, `pnpm --filter api exec prisma db seed`):**
- Пользователь `+998993286330` (Азиз Каримов Эркинович, родился 1990-05-14)
- 2 авто: Chevrolet Cobalt `01 A 123 BB` 2021, Hyundai Sonata `10 R 555 AC` 2019
- Документы VERIFIED: паспорт AA 4587213 + ВУ AB 2345678 (категории B,C)
- 2 водителя: сам + жена (Каримова М.Х., 4 года стажа, по доверенности)
- 2 ACTIVE полиса: КАСКО Cobalt (№ 1225 7821 3344) + ОСАГО Sonata (№ 1224 5566 7788)
- Промо `SOS10` (10% до 2026-12-31)
- Кошелёк 500 000 сум + 2 карты (Uzcard 4582 default + Humo 1190)

### Этап F — Mobile integration (S6) 2026-05-20
**API-слой полностью:** `apps/mobile/src/api/` — types.ts + 9 domain-файлов (auth, vehicles, documents, drivers, policies, promo, cards, wallet, payments). Каждый файл содержит TypeScript-типы, функции-обёртки axios и React Query хуки (useX / useCreateX / ... ) в одном месте.

**Интеграция в экранах:**
| Экран | API |
|---|---|
| Home | `useMe` (имя), `usePolicies('ACTIVE')` (карточки полисов) |
| GarageList | `useVehicles` |
| Profile | `useMe`, `useDocuments` (статусы паспорта+ВУ) |
| Document edit | `useDocument(kind)`, `useUpsertDocument(kind)` |
| CalcVehicle | `useVehicles` + auto-select first |
| CalcDrivers | `useDrivers` + auto-select all при LIMITED |
| Checkout | `useValidatePromo` (промокод server-side), `useCreatePolicy` (создаёт draft + сохраняет `draftPolicyId` в store) |
| Payment | `usePolicy(draftPolicyId)` (точная totalPrice), `useWallet` (real balance), `useCards`, `usePayPolicy` (mock Uzcard) |
| Success | `usePolicy(draftPolicyId)` — реальный policyNumber + qrPayload + vehicle |

**Маппинг enum** lowercase mobile ↔ UPPERCASE API в `CheckoutScreen` (TYPE_TO_API), `PaymentScreen` (BRAND_MAP), `Document/ProfileScreen` (statusFromApi).

### Прочие фиксы 2026-05-20
- **JWT TTL .env**: `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=30d` (не `900`/`2592000` — jsonwebtoken-гетча). Память: `[[reference-jwt-ttl-format]]`.
- **SDK 54 → 55** (RN 0.83.6, react 19.2) — был нужен для `@expo/ui`, оставили после эксперимента
- **`react-native-screens` 4.25.1** пин поверх SDK 55 default 4.23 — нужно для нативного `createNativeBottomTabNavigator`
- **Xcode 26.5** на Mac mini M4 — native tab bar (`UITabBarController`) с iOS 26 Liquid Glass через ветку `feat/native-tabs`. main-ветка с Expo Go — устаревший fallback

---

## Что НЕ сделано (отложено)

### Backend — S5 Partners
Прямо следующий sprint. `Partner` модель + `GET /partners` (фильтр по локации/типу). Сейчас Home показывает `MOCK_PARTNERS` — 4 захардкоженные карточки. **~2-3ч.**

### Mobile — недоделанные интеграции
- **`GarageEditScreen`** — форма добавления авто работает на `MOCK_VEHICLES`. Подключить `useCreateVehicle` + `useUpdateVehicle` + `useNappLookup`. ~30 мин.
- **`MyCardsScreen`** — `useCards` + `useCreateCard` + `useDeleteCard`. ~30 мин.
- **`PoliciesListScreen` / `PolicyDetailScreen`** — пока на mock'е, нужны `usePolicies()` + `usePolicy(id)`. ~30 мин.

### Этап C13 — Оставшиеся экраны (дизайн нужен от дизайнера)
- M9 — Урегулирование (заявление о ДТП, европротокол)
- M10 — Статус выплат
- M11 — Уведомления
- M12 — Документы (PDF-полисы)
- M13 — Поддержка
- M16 — Партнёры (каталог, деталь, запись)

### Технические долги
- **i18n** — на C7–C12 русские строки захардкожены в JSX, не вынесены в `packages/i18n-strings`. См. `[[feedback-dev-md-lazy]]`. Большой проход.
- **Lint** — `pnpm lint` не подключен к turbo pipeline (eslint-конфиги в `apps/api` есть)
- **Тесты** — ни юнит, ни E2E. Когда подключим S5 — начнём с интеграционных на auth/me/policies + e2e через Maestro
- **Git-флоу** — feat/native-tabs стала «всем подряд». Стоит мержить в main и начать дробить ветки.
- **Sentry / Pino structured logs** — отложили в S4

### Открытые бизнес-вопросы клиенту
См. `QUESTIONS.md`. Главные: Uzcard-договор, NAPP-API, лицензии, тарифы КАСКО от Махмуд-аки, спеки серверов. Не блокируют разработку UI/моков, блокируют релиз.

---

## Как запустить (Quick Start)

### С нуля (новый комп)
```bash
# 1. Клонировать
git clone <repo-url>
cd sos24_claude

# 2. Toolchain (один раз)
nvm install 22 && nvm use 22
corepack enable && corepack prepare pnpm@11.1.2 --activate

# 3. Зависимости
pnpm install

# 4. БД
docker compose up -d --wait db

# 5. apps/api/.env (создать) — пример:
# DATABASE_URL=postgresql://sos24:sos24@localhost:5434/sos24?schema=public
# JWT_ACCESS_SECRET=<openssl rand -hex 32>
# JWT_REFRESH_SECRET=<openssl rand -hex 32>
# JWT_ACCESS_TTL=15m    ← ВАЖНО: формат "15m", не "900" (см. [[reference-jwt-ttl-format]])
# JWT_REFRESH_TTL=30d
# PORT=3030

# 6. Миграции + seed
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed

# 7. iOS (на Mac):
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer  # один раз
brew install cocoapods  # один раз
```

### Каждый раз (на `feat/native-tabs`, dev-build)
```bash
# Терминал 1 — API
pnpm dev:api
# → http://localhost:3030, swagger /api-docs

# Терминал 2 — iOS симулятор + Metro
cd apps/mobile
xcrun simctl boot "iPhone 17 Pro" && open -a Simulator
npx expo run:ios --device "iPhone 17 Pro"
# первый билд ~5-10 мин, потом инкрементально
```

### Альтернативы для mobile
```bash
# Веб-превью (без iOS, для быстрой проверки)
pnpm --filter mobile run web   # → http://localhost:8081

# main-ветка с Expo Go (устаревшая)
git checkout main
pnpm --filter mobile run lan
```

### Тестовый аккаунт
- **Телефон:** `+998993286330` (из seed, с готовыми данными)
- **OTP:** `6330` (хардкод на бэке, `auth.service.ts:DEV_OTP_CODE`)
- Любой другой номер тоже сработает (OTP тот же), создаст пустого юзера

---

## Что дальше — варианты

### Вариант A — S5 Partners (~2-3ч)
`Partner` модель + `GET /partners`, заменить `MOCK_PARTNERS` на Home. Это закрывает последний mock в основном флоу. **Рекомендую.**

### Вариант B — Дотянуть mobile-интеграцию (~1.5ч)
GarageEdit, MyCards, PoliciesList/PolicyDetail на API-хуки. Закрывает все оставшиеся mock'и в боковых экранах.

### Вариант C — Этап C13 (~3-4 дня)
Дизайны M9/M10/M11/M12/M13/M16 от дизайнера → переносим. Без дизайна — можно собирать по спеке (как было с M2/M3 в C12), но риск переделок.

### Вариант D — i18n cleanup + lint + тесты (~2 дня)
Вынести строки в i18n, настроить lint в turbo, написать первые integration-тесты на auth+/me/policies.

### Вариант E — Подготовка к merge в main
Сейчас `feat/native-tabs` стала magnetom. Раздробить коммиты, мержить в main, начать feature-branch flow.

**Рекомендованный порядок:** A → B → E (merge) → D → C13.

---

## Память Claude (~/.claude memory)

В `/Users/odya/.claude/projects/-Users-odya-Documents-projects-sos24-claude/memory/` накопились reference/feedback файлы. Главные:
- `reference-jwt-ttl-format.md` — формат TTL в `.env`
- `feedback-expo-ui-glass-button-fixed-size.md` — @expo/ui Button hugging
- `reference-test-user.md` — состав seed
- `reference-api-module-layout.md` — паттерн `apps/mobile/src/api/<domain>.ts`
- `reference-enum-case-mapping.md` — UPPERCASE backend ↔ lowercase mobile

`MEMORY.md` — индекс. Читается автоматически.

---

## Файлы и навигация

| Файл / папка | Что внутри |
|---|---|
| `CLAUDE.md` | главный контекст проекта |
| `DEVELOPMENT.md` | инженерный процесс |
| `PLAN.md` | архитектура и модули |
| `STAGE1.md` | **этот файл** — журнал работ |
| `QUESTIONS.md` | открытые вопросы клиенту |
| `DESIGN_SYSTEM.md` | дизайн-токены |
| `SOS24/` | дизайн-эталоны |
| `apps/api/` | NestJS бэк (8 модулей, Prisma 6, seed) |
| `apps/api/src/{auth,users,vehicles,napp,documents,drivers,policies,promo,cards,wallet,payments}` | модули |
| `apps/api/prisma/{schema.prisma,migrations,seed.ts}` | БД |
| `apps/mobile/` | Expo + RN |
| `apps/mobile/src/api/` | API-слой: types, 9 domain-файлов с хуками |
| `apps/mobile/src/components/ui/` | UI-кит ~40 примитивов |
| `apps/mobile/src/features/{auth,policies,purchase,profile,garage,main}/` | бизнес-фичи |
| `apps/mobile/src/navigation/*Navigator.tsx` | стеки |
