# STAGE1.md — Прогресс Этапа 1 (разработка)

> Журнал реальных работ Этапа 1. Что сделано, что отложено, где остановились, как продолжить.
>
> **Последнее обновление:** 2026-05-20

---

## Где остановились

Полный визуальный прототип основного флоу (C1–C12) + пакет фиксов после тестов на Expo Go + начат гибридный заход на нативность iOS:

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

**Активные ветки git:**
- `main` — рабочая, совместима с Expo Go. Кастомный bottom tab bar с Liquid Glass (`expo-glass-effect`) + Reanimated pop-анимация + swipe-to-switch. Морф-«капельки» нет.
- `feat/native-tabs` — переход на **нативный** `UITabBarController` (iOS 26 Liquid Glass от Apple). Готова, но **требует dev build** — Expo Go несовместим (см. ниже). Не смержена в main намеренно.

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

### Каждый раз (ветка `main`, Expo Go)
```powershell
# Терминал 1 — API
pnpm dev:api
# → http://localhost:3030, swagger на /api-docs

# Терминал 2 — Mobile
pnpm --filter mobile run web        # web-превью на :8081
pnpm --filter mobile run lan        # Expo Go (LAN), QR в терминале
pnpm --filter mobile run lan:clear  # то же с очисткой кэша Metro
pnpm --filter mobile run tunnel     # если телефон не в одной сети
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
- Любой телефон в формате `+998XXXXXXXXX`
- OTP-код всегда `6330` (хардкод на бэке, см. `apps/api/src/auth/auth.service.ts:DEV_OTP_CODE`)

---

## Что дальше — варианты

### Вариант 0 — Протестировать `feat/native-tabs` на Mac
На Mac (куда переезжает разработка): `git checkout feat/native-tabs` → `npx expo run:ios` (симулятор) или `--device`. Нужен **Xcode 26+** для iOS 26 Liquid Glass. Если нативные табы устраивают — мержим ветку в `main` (но тогда `main` тоже потеряет совместимость с Expo Go — весь дальнейший тест только через dev build / симулятор).

### Вариант 1 — Гибрид-нативность H1 (date picker)
Самый дешёвый видимый выигрыш. `@react-native-community/datetimepicker` вместо текстового ввода дат. Работает и в Expo Go, и в dev build.

### Вариант 2 — Этап D (Backend)
**Объём:** ~1 неделя.
Модели Prisma (Vehicle/Policy/Driver/Document/Card/Claim/Partner), эндпоинты, замена моков на реальные данные через TanStack Query, seed-скрипт. После — полный end-to-end (регистрация → данные авто из БД → реальный расчёт → создание полиса → видим в списке).

### Вариант 3 — Этап C13 (оставшиеся экраны)
**Объём:** ~3-4 дня.
Доделать placeholder'ы: M9 ДТП, M10 выплаты, M11 уведомления, M12 документы, M13 поддержка, M16 партнёры.

### Вариант 4 — Технические долги
i18n-ключи (русские строки в JSX → `t()`), `pnpm lint`, тесты.

**Рекомендация:** определиться с tab bar (Вариант 0 — протестировать на Mac, мержить или нет), затем Этап D — основной коммерческий флоу «вживую».

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
