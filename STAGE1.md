# STAGE1.md — Прогресс Этапа 1 (разработка)

> Журнал реальных работ Этапа 1. Что сделано, что отложено, где остановились, как продолжить.
>
> **Последнее обновление:** 2026-05-21

---

## Где остановились

**Админ-панель (S8) готова и подключена к реальному API.** Dashboard с KPI + графики (Recharts), таблицы полисов и пользователей с поиском/фильтрами/пагинацией. JWT auth через двухшаговую форму (phone → OTP → проверка role=ADMIN). Все данные из `GET /admin/stats`, `GET /admin/users`, `GET /admin/policies`.

```
Дерево запущенных процессов:
  pnpm dev:api          → http://localhost:3030 (NestJS)
  npx next dev :3035    → http://localhost:3035 (Admin Next.js)
  npx expo run:ios      → iPhone 17 Pro симулятор (Mobile)

Вход в админку:
  +998993286330 / OTP 6330 → role=ADMIN → Dashboard
```

**MyID верификация реализована (S7).** Обязательный шаг после OTP: нельзя войти в приложение без прохождения MyID. В дев-режиме — мок (`MYID_MOCK=true` + "Симулировать MyID" кнопка в `__DEV__`).

```
Логин (+998993286330 / OTP=6330)
   ├─ НЕ верифицирован → MyIdNavigator → MyIdOnboardingScreen
   │     └─ Пройти MyID (прод: SDK) / Симулировать (дев) → authenticated → Home
   └─ Верифицирован → Home (имя из /me, полисы из /me/policies)
           ├─ Полисы (M8) → /me/policies, /policies/:id → Деталь + QR
           ├─ Гараж (M3) → /me/vehicles + NAPP lookup, GarageEdit → create/update через API
           ├─ Профиль (M2) → /me, /me/documents → Document edit; бейдж «MyID верифицирован»
           └─ Quick action «Страховой полис / Аджастер» →
                   Catalog → ProductDetail → Calc → Checkout → Payment → Success
```

**Текущая ветка:** `main` (смержена с `feat/native-tabs` 2026-05-20).

**Тестовый юзер:** `+998993286330` (Азиз Каримов), OTP всегда `6330`. Сид создаёт 2 авто (Cobalt + Sonata), 2 водителя, паспорт+ВУ (VERIFIED), 2 ACTIVE полиса, кошелёк 500 000, 2 карты, промокод `SOS10` (−10%).

**Активные ветки git:**
- `main` — рабочая, совместима с Expo Go. Кастомный bottom tab bar с Liquid Glass (`expo-glass-effect`) + Reanimated pop-анимация + swipe-to-switch. Морф-«капельки» нет.
- `feat/native-tabs` — переход на **нативный** `UITabBarController` (iOS 26 Liquid Glass от Apple). Готова, но **требует dev build** — Expo Go несовместим (см. ниже). Не смержена в main намеренно.

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

### Этап S7 — MyID верификация (2026-05-21)

Обязательная идентификация через государственную систему MyID. Без неё пользователь не может пользоваться приложением в проде.

**Бэкенд (`apps/api`):**
- Prisma: `pinfl String? @unique`, `verificationStatus VerificationStatus` (`NOT_VERIFIED`/`MYID_VERIFIED`) в `User`
- Миграция `20260521120000_add_myid_verification`
- `MyidModule`: `POST /myid/session` (создаёт MyID-сессию) + `POST /myid/verify` (принимает code → получает данные из MyID → обновляет User + upsert Document(PASSPORT))
- `MYID_MOCK=true` в `.env` → детерминированные мок-данные (ПИНФЛ 12345678901234, Каримов Азиз Эркинович)
- При `MYID_MOCK=false`: реальные запросы к MyID API (`/api/v1/auth/clients/access-token` → `/api/v1/sdk/data?code=`)
- `auth/verify-otp` теперь возвращает `verificationStatus` в ответе

**Мобильный (`apps/mobile`):**
- `authStore`: новый статус `needs_verification`; `setVerified()` → `authenticated`; `hydrate()` читает `verificationStatus` из MMKV (без сетевого запроса при старте)
- `MyIdNavigator` + `MyIdOnboardingScreen`: кнопка «Пройти MyID» + TODO-заглушка для реального SDK; `__DEV__` — кнопка «Симулировать MyID (DEV)»
- `RootNavigator`: `needs_verification` → `MyIdNavigator` (навигация автоматически без `nav.navigate`)
- `OtpScreen`: упрощён — `setSession(tokens, sub, verificationStatus)`, навигация через RootNavigator
- `ProfileScreen`: бейдж «MyID верифицирован» + скрыта кнопка редактирования для верифицированных

**Когда придут ключи MyID:**
1. `MYID_MOCK=false` в `apps/api/.env`
2. Установить `myid-rn-sdk` (закрытый GitLab) + написать Expo Config Plugin
3. Заменить TODO в `MyIdOnboardingScreen.startMyId()` на `MyIdClient.start()`

### Этап S8 — Admin Panel (2026-05-21)

Веб-админка страховой компании на реальных данных из API.

**Бэкенд (`apps/api`):**
- `UserRole` enum (`USER` / `ADMIN`) добавлен в Prisma schema + миграция `20260521130000_add_user_role`
- Сид: тестовый юзер `+998993286330` получил `role: ADMIN` + `verificationStatus: MYID_VERIFIED`
- `JwtPayload` расширен полем `role`; `issueTokens` принимает `role`, пишет в токен
- `POST /auth/admin/login` — проверяет OTP **и** `user.role === ADMIN`; возвращает JWT + role
- `AdminGuard` (`apps/api/src/admin/admin.guard.ts`) — чтение `request.user.role === 'ADMIN'` без запроса в БД
- `AdminModule` (`apps/api/src/admin/`) — `AdminService` + `AdminController`, закрыт `JwtAuthGuard + AdminGuard`:
  - `GET /admin/stats` — 12 параллельных запросов: KPI (totalPolicies, activePolicies, pendingPolicies, totalUsers, verifiedUsers, revenue), recentPolicies/Users (10 шт.), trend (30 дней → `{date,osago,kasko}[]`), typeDistribution (ACTIVE полисы по типу)
  - `GET /admin/users?page&limit&search&verified` — пагинация, поиск по phone/name/surname
  - `GET /admin/policies?page&limit&search&type&status` — пагинация, поиск по номеру/держателю/номеру авто

**Фронтенд (`apps/admin/`):**
- Next.js 15 + Tailwind v4 + Recharts + lucide-react + Inter (Google Fonts)
- **Auth:** `app/login/page.tsx` — двухшаговая форма phone → OTP, `sos24_admin_token` в `localStorage`
- **Layout:** тёмный сайдбар `#111` с красным (#e61428) индикатором активного пункта; белый Header; route group `(dashboard)`
- **Dashboard:** KpiCard ×4 (полисы, активные, пользователи, ожидают оплаты), TrendChart (AreaChart, ОСАГО/КАСКО за 30 дней), TypeDonut (PieChart donut + легенда), таблицы последних полисов/пользователей со ссылками «Все →»
- **Users page:** таблица (avatar-инициалы, телефон, статус верификации, кол-во полисов, роль, дата), поиск + фильтр верификации + пагинация
- **Policies page:** таблица (тип+иконка+номер, держатель, авто, период, премия, статус), поиск + фильтр типа + фильтр статуса + пагинация
- Все страницы `'use client'` + TanStack Query (JWT из localStorage → Bearer в axios interceptor)
- Skeleton-лоудеры на всех блоках

**Фиксы в рамках S8:**
- `myid.controller.ts`: `@CurrentUser() userId: string` → `@CurrentUser() user: JwtPayload` + `user.sub` (декоратор возвращает объект, не строку)
- `PoliciesListScreen.tsx` + `PolicyDetailScreen.tsx`: `formatDate` — `iso.slice(0, 10).split('-')` (API возвращает полный ISO `2026-01-15T00:00:00.000Z`, без `.slice` `d` становился `"15T00:00:00.000Z"`)

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

### Пакет фиксов после тестов на Expo Go (2026-05-18 — 2026-05-20)
- **Prisma postinstall** — `apps/api/package.json` получил `postinstall: prisma generate`, иначе на свежем clone типы `@prisma/client` пустые.
- **NativeWind JSX-wrapper отключён** — `jsxImportSource: 'nativewind'` и `nativewind/babel` убраны из `babel.config.js`. Wrapper ломал inline-`style` функции на `Pressable` в Expo Go iOS (контейнер-стили не применялись). `className` в проекте нигде не используется — потерь нет; Tailwind-токены остаются справочником в `tailwind.config.js` / `theme/colors.ts`.
- **Expo `--lan` режим** — скрипты `lan` / `lan:clear` / `localhost` / `tunnel` в `apps/mobile/package.json`. Metro биндится к LAN-IP, не 127.0.0.1.
- **Клавиатура** — `DismissKeyboardView` (тап вне поля закрывает) + `useKeyboardHeight` (bottom-кнопка поднимается над клавиатурой) на всех формах: Phone, ProfileSetup, ProfileEdit, Document, GarageEdit.
- **Home quick-actions** — навигация «Оформить ОСАГО/КАСКО» / AddPolicyTile была потеряна, восстановлена через `getParent()` (Purchase route на уровне MainStack).
- **Reanimated 4** — babel-плагин `react-native-reanimated/plugin` → `react-native-worklets/plugin` (Reanimated 4 вынес worklets в отдельный пакет `react-native-worklets`). Без этого — краш `Exception in HostFunction: NativeWorklets`.
- **Liquid Glass на bottom tab bar** — добавлен `expo-glass-effect`. На `main` — кастомный бар с `GlassView` (iOS 26+) / `BlurView` fallback. Морф-«капелька» как в App Store **не получилась** на кастомных GlassView (merge считается по layout-bounds, не transform) → решено перейти на нативный таб-бар (ветка `feat/native-tabs`).

### Ветка `feat/native-tabs` — нативный iOS tab bar
Решение (с согласия дизайнера): отказаться от кастомной плавающей капсулы в пользу **родного `UITabBarController`** — на iOS 26 он сам даёт Liquid Glass + морфинг от Apple.
- `react-native-screens` 4.16 → **4.25.1** (требование native bottom tabs)
- `MainNavigator` → `createNativeBottomTabNavigator` из `@react-navigation/bottom-tabs/unstable`
- Иконки — SF Symbols (`house`/`shield`/`car`/`person`)
- Кастомный `BottomTabBar.tsx` удалён
- `eas.json` с профилем `development`
- **Expo Go несовместим** — после апгрейда `react-native-screens` нужен dev build. Поэтому ветка отдельная, в `main` не мержена.
- TODO: SF Symbols на Android не рендерятся — нужны PNG-иконки табов.

### Подход к нативности — «гибрид точечно» (зафиксировано 2026-05-20)
Кастомный дизайн SOS24 остаётся на RN. Нативные компоненты — **только точечно**, где они объективно лучше и не конфликтуют с брендом. Roadmap:
- **H1 — нативный date picker** (`@react-native-community/datetimepicker`) — даты рождения/выдачи/периода. Сейчас текстовый ввод `ГГГГ-ММ-ДД`.
- **H2 — haptics** (`expo-haptics`) — отклик при свайпе табов, успехе оплаты, ошибке OTP.
- **H3 — нативный bottom sheet** — выбор языка/темы в Профиле.
- **H4 — context menu** — long-press на полисе/карточке.
Полный SwiftUI-переход через `@expo/ui` отклонён — потеря кастомного дизайна + alpha-статус.

---

## Что НЕ сделано (отложено)

### Backend — S5 Partners
Прямо следующий sprint. `Partner` модель + `GET /partners` (фильтр по локации/типу). Сейчас Home показывает `MOCK_PARTNERS` — 4 захардкоженные карточки. **~2-3ч.**

### Admin — Claims, Partners, Reports (дизайн нужен)
Админка S8 Phase 2: управление убытками (M9), выплаты, уведомления, управление партнёрами (одобрение СТО/клиник), тарифный редактор, отчёты/выгрузка 1С, управление контентом лендинга. Без дизайна от дизайнера — не начинать.

### Mobile — интеграция MyID SDK (реальные ключи)
- Когда придут ключи от MyID: установить `myid-rn-sdk`, написать Expo Config Plugin, заменить TODO в `MyIdOnboardingScreen.startMyId()`
- `ProfileEditScreen` — поля ФИО/дата рождения должны быть скрыты/readonly когда `MYID_VERIFIED` (сейчас только ProfileScreen скрывает кнопку edit)

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

### Каждый раз (dev-build на iOS симуляторе)
```bash
# Терминал 1 — API
pnpm dev:api
# → http://localhost:3030, swagger /api-docs

# Терминал 2 — Admin panel
cd apps/admin
npx next dev --port 3035
# → http://localhost:3035  (логин: +998993286330 / OTP 6330)

# Терминал 3 — iOS симулятор + Metro
cd apps/mobile
xcrun simctl boot "iPhone 17 Pro" && open -a Simulator
npx expo run:ios --device "iPhone 17 Pro"
# первый билд ~5-10 мин, потом инкрементально
```

> **Заметка по портам:** 3031 занят системным процессом macOS — использовать 3035.

### Альтернативы для mobile
```bash
# Веб-превью (без iOS, для быстрой проверки)
pnpm --filter mobile run web   # → http://localhost:8081
```

### Ветка `feat/native-tabs` — тестирование (нужен dev build, не Expo Go)
```bash
git checkout feat/native-tabs
pnpm install

# Вариант 1 — Mac + Xcode 26 + бесплатный Apple ID (на устройство, 7 дней):
cd apps/mobile
npx expo prebuild --platform ios
npx expo run:ios --device

# Вариант 2 — Mac + Xcode 26 → iOS Simulator (без Apple ID вообще):
npx expo run:ios

# Вариант 3 — EAS cloud build (нужен Apple Developer Program $99/год):
eas login
eas device:create
eas build --profile development --platform ios
```
Для iOS 26 Liquid Glass нужен **Xcode 26+**. После установки dev-client работает как Expo Go (Metro + hot reload). Подробнее — раздел «Что дальше».

### Тестовый аккаунт
- **Телефон:** `+998993286330` (из seed, с готовыми данными)
- **OTP:** `6330` (хардкод на бэке, `auth.service.ts:DEV_OTP_CODE`)
- Любой другой номер тоже сработает (OTP тот же), создаст пустого юзера

---

## Что дальше — варианты

### ~~Вариант B — Дотянуть mobile-интеграцию~~ ✅ DONE 2026-05-20
GarageEdit, MyCards, PoliciesList/PolicyDetail/QrFullscreen — все на реальном API, mock'и убраны.

### ~~Вариант E — Merge в main~~ ✅ DONE 2026-05-20
`feat/native-tabs` смержена в `main`.

### ~~S7 — MyID верификация~~ ✅ DONE 2026-05-21
Обязательный флоу регистрации через MyID. Мок на бэке + DEV-кнопка на мобиле.

### ~~S8 — Admin Panel~~ ✅ DONE 2026-05-21
Dashboard + KPI + графики + таблицы users/policies + JWT auth. Реальные данные из API.

### Вариант A — S5 Partners (~2-3ч) ← СЛЕДУЮЩИЙ
`Partner` модель + `GET /partners`, заменить `MOCK_PARTNERS` на Home. Это закрывает последний mock в проекте. **Рекомендую.**

### Вариант C — Этап C13 (~3-4 дня)
Дизайны M9/M10/M11/M12/M13/M16 от дизайнера → переносим. Без дизайна — можно собирать по спеке, но риск переделок.

### Вариант D — i18n cleanup + lint + тесты (~2 дня)
Вынести строки в i18n, настроить lint в turbo, написать первые integration-тесты на auth+/me/policies.

**Рекомендованный порядок:** A → D → C13.

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
| `apps/api/` | NestJS бэк (9 модулей, Prisma 6, seed) |
| `apps/api/src/{auth,users,vehicles,napp,documents,drivers,policies,promo,cards,wallet,payments,admin}` | модули |
| `apps/api/prisma/{schema.prisma,migrations,seed.ts}` | БД |
| `apps/mobile/` | Expo + RN |
| `apps/mobile/src/api/` | API-слой: types, 9 domain-файлов с хуками |
| `apps/mobile/src/components/ui/` | UI-кит ~40 примитивов |
| `apps/mobile/src/features/{auth,policies,purchase,profile,garage,main}/` | бизнес-фичи |
| `apps/mobile/src/navigation/*Navigator.tsx` | стеки |
| `apps/admin/` | Next.js 15 — веб-админка страховой |
| `apps/admin/src/app/(dashboard)/` | Dashboard, Users, Policies страницы |
| `apps/admin/src/components/{layout,dashboard}/` | Sidebar, Header, KpiCard, TrendChart, TypeDonut |
| `apps/admin/src/lib/{api.ts,admin-hooks.ts}` | axios-клиент + TanStack Query хуки |
