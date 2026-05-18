# SOS24 — Платформа автостраховой Узбекистана

> Помощник на дороге 24/7. Мобильное приложение, лендинг, админка страховой, B2B-кабинет партнёров. Этап 1 — разработка.
>
> Подробнее о состоянии проекта — `STAGE1.md`. О процессе — `DEVELOPMENT.md`. О задачах и стеке — `CLAUDE.md` и `PLAN.md`.

---

## Требования

| Что | Версия | Зачем |
|---|---|---|
| **Node.js** | **22 LTS** (есть `.nvmrc`) | runtime для всего монорепо |
| **pnpm** | **11.x** | пакетный менеджер (workspace + allowBuilds) |
| **Docker Desktop** | любая | поднять локальный PostgreSQL для бэкенда |
| **Git** | любой | склонировать репо |
| **Expo Go** на телефоне *(опционально)* | последняя | посмотреть мобильное приложение на устройстве |
| **Android Studio / Xcode** *(опционально)* | — | нативная сборка, не нужна для разработки |

### Установка Node 22 + pnpm

Если у тебя ещё нет:

**Windows (через winget):**
```powershell
winget install OpenJS.NodeJS.LTS
npm install -g pnpm@11
```

**macOS / Linux (через nvm):**
```bash
nvm install 22
nvm use 22
npm install -g pnpm@11
```

Проверка:
```powershell
node -v        # должно быть v22.x
pnpm -v        # должно быть 11.x
docker --version
```

---

## Первый запуск с нуля

```powershell
# 1. Склонировать репо
git clone https://github.com/odilxon/sos24_claude.git
cd sos24_claude

# 2. Установить все зависимости
pnpm install

# 3. Создать .env для API из шаблона
cp apps/api/.env.example apps/api/.env
# (на Windows PowerShell: Copy-Item apps/api/.env.example apps/api/.env)

# 4. Поднять PostgreSQL в Docker (порт 5434, чтобы не конфликтовать с другими проектами)
docker compose up -d db

# 5. Применить миграции Prisma (создаст таблицу users)
pnpm --filter api exec prisma migrate deploy
```

> **Важно:** API слушает `localhost:5434` для базы (не `5432`) — указано в `docker-compose.yml` и `.env.example`. Это сделано, чтобы не конфликтовать с другими локальными Postgres-инстансами.

После этого можно запускать сервисы (см. ниже).

---

## Запуск разработки

Нужно **два терминала** одновременно — один на бэкенд, один на мобайл.

### Терминал 1 — Backend API

```powershell
pnpm dev:api
```

Должен увидеть:
```
[sos24-api] listening on http://localhost:3030
[sos24-api] swagger:   http://localhost:3030/api-docs
```

Полезные ссылки:
- API: `http://localhost:3030`
- Swagger (документация): `http://localhost:3030/api-docs`
- Prisma Studio (GUI базы): `pnpm --filter api exec prisma studio` → `http://localhost:5555`

### Терминал 2 — Mobile

Выбери способ просмотра:

#### Вариант А — Web в браузере (быстрее всего)

```powershell
pnpm --filter mobile run web
```

Откроется `http://localhost:8081`. Открывай в браузере, должен увидеть Splash → Онбординг → авторизацию.

> **Минус:** некоторые модальные стеки на web рендерятся проще, чем на устройстве — это нормально, на телефоне будет красивее. Уже есть Platform.OS-conditional, чтобы web и native давали корректный UX каждый со своими паттернами.

#### Вариант Б — Expo Go на телефоне

Нужен **телефон и компьютер в одной Wi-Fi сети** (или VPN, который их объединяет).

1. Установи Expo Go на телефон ([Play Market](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779))
2. На компьютере запусти:
   ```powershell
   pnpm dev:mobile
   ```
3. Появится QR-код в терминале — отсканируй из Expo Go (Android) или Камеры (iOS).

**Если телефон и компьютер не в одной сети** (например, ты на RDP) — используй tunnel:
```powershell
pnpm --filter mobile exec expo start --tunnel
```
Это пробросит Metro через серверы Expo, можно подключаться откуда угодно. **Backend в этом режиме недоступен** — увидишь только дизайн, авторизация и API-вызовы не будут работать. Для полного флоу с бэком нужна общая сеть.

> **Первый запуск** Metro может пересобирать кеш ~30 секунд. Не пугайся.

---

## Тестовый аккаунт

- **Телефон:** любой в формате `+998XXXXXXXXX` (9 цифр после `+998`)
- **OTP-код:** **`6330`** (захардкожен на dev в `apps/api/src/auth/auth.service.ts`)

Реальной отправки SMS нет — Playmobile подключим позже. Любой код кроме `6330` вернёт `401 Unauthorized`.

---

## Полезные команды

### Все команды запускаются из корня репо

```powershell
# Разработка (отдельные приложения)
pnpm dev:api                 # NestJS на :3030
pnpm dev:mobile              # Expo Metro (для Expo Go)
pnpm --filter mobile run web # web-превью на :8081
pnpm dev:admin               # Next.js админка на :3000 (пока не используется)
pnpm dev:partner             # Next.js партнёры на :3001 (пока не используется)
pnpm dev:landing             # Next.js лендинг на :3002 (пока не используется)

# Качество кода
pnpm typecheck               # tsc по всем приложениям (api + mobile + пакеты)
pnpm lint                    # ESLint (пока не настроен)
pnpm format                  # Prettier write
pnpm format:check            # Prettier check

# База данных (apps/api)
pnpm --filter api exec prisma migrate dev --name <name>   # создать новую миграцию
pnpm --filter api exec prisma migrate deploy              # применить существующие
pnpm --filter api exec prisma studio                      # GUI базы на :5555
pnpm --filter api run prisma:generate                     # перегенерить клиент

# Сборка
pnpm build                   # все приложения
pnpm --filter mobile exec expo export --platform android  # one-shot бандл проверка

# Очистка
docker compose down                # остановить БД (volume сохраняется)
docker compose down -v             # остановить БД и стереть данные
pnpm clean                         # очистить .turbo, dist, build артефакты
rm -rf node_modules && pnpm install # ядерный вариант пересборки зависимостей
```

---

## Структура репо

```
sos24_claude/
├── apps/
│   ├── mobile/        — React Native (Expo SDK 54) приложение
│   ├── api/           — NestJS бэкенд (Prisma 6 + JWT)
│   ├── admin/         — Next.js админка (заглушка)
│   ├── partner/       — Next.js B2B кабинет (заглушка)
│   └── landing/       — Next.js лендинг (заглушка)
│
├── packages/
│   ├── api-types/     — TS-типы (генерация из OpenAPI)
│   ├── config-ts/     — общие tsconfig
│   ├── config-eslint/ — общие eslint-конфиги
│   └── i18n-strings/  — переводы (4 локали: uz-Latn, uz-Cyrl, ru, en)
│
├── SOS24/             — дизайн-референсы фронтендера (HTML/JSX, открывается в браузере)
├── assets/brand/      — лого, шрифты, бренд-ассеты
│
├── docker-compose.yml — Postgres 16 на :5434
├── turbo.json         — Turborepo pipeline
├── pnpm-workspace.yaml
│
├── CLAUDE.md          — главный контекст для Claude (правила, индекс)
├── STAGE1.md          — журнал реальных работ Этапа 1 (читать обязательно)
├── DEVELOPMENT.md     — инженерный процесс, команды, конвенции
├── PLAN.md            — технический план, архитектура
├── QUESTIONS.md       — открытые вопросы к клиенту
├── TASKS.md           — подготовительные задачи Этапа 0 (legacy)
└── DESIGN_SYSTEM.md   — дизайн-токены
```

---

## Текущий статус (кратко)

✅ **Сделано:**
- Backend: авторизация (OTP=6330), `User` модель, JWT, Swagger
- Mobile: 19 экранов — M1 авторизация, Home, Мои полисы (M8), Каталог + Калькулятор + Чекаут + Оплата (M4-M7), Профиль (M2), Гараж (M3)
- ~40 переиспользуемых UI-компонентов
- Поддержка iOS / Android (через Expo Go) и web

🔜 **Дальше:**
- Этап D — backend для остальных моделей (Vehicle, Policy, Document, и т.п.)
- C13 — ДТП-флоу (M9), выплаты (M10), партнёры (M16)
- Технические долги: i18n-ключи, lint, тесты

Полный список — в `STAGE1.md`.

---

## Известные нюансы

### Windows + pnpm

В монорепо включён `node-linker=hoisted` (`.npmrc`) — для совместимости с React Native, который не дружит с симлинками pnpm по умолчанию.

Также в `pnpm-workspace.yaml` есть `allowBuilds` — pnpm 11 блокирует postinstall-скрипты пакетов, мы явно разрешаем `prisma`, `@prisma/engines`, `@prisma/client`, `@nestjs/core`, `sharp`, `unrs-resolver`.

### Конфликты портов

Если у тебя на компьютере уже запущены другие проекты:
- **3030** — наш API. Если занят — кто-то ещё на NestJS. Меняй `PORT` в `apps/api/.env`.
- **5434** — наш Postgres (контейнер `sos24-db`). На 5432 у нас часто бывает что-то другое.
- **8081** — Expo Metro. Если занят — Expo предложит порт 8082 интерактивно.

### Prisma — версия 6, не 7

Используем `prisma@^6`, не v7. Версия 7 — ESM-only, несовместима с CommonJS NestJS. См. историю в `apps/api/package.json`.

### NativeWind на pnpm

NativeWind v4 нуждается в `react-native-css-interop` как **direct dep** (не транзитивная) — иначе Metro не найдёт `jsx-runtime`. Уже добавлен в `apps/mobile/package.json`.

---

## Если что-то сломалось

1. **Metro не стартует** или показывает странные ошибки бандла:
   ```powershell
   pnpm --filter mobile exec expo start --clear
   ```
   Сбрасывает кеш Metro.

2. **API падает с ошибкой подключения к БД:**
   - Проверь, что Docker Desktop запущен
   - `docker compose up -d db`
   - `docker ps` должен показать `sos24-db` со статусом `(healthy)`
   - Если порт 5434 занят кем-то ещё — поменяй маппинг в `docker-compose.yml`

3. **Prisma client устарел** (после `git pull`):
   ```powershell
   pnpm --filter api run prisma:generate
   ```

4. **Что-то странное с зависимостями** после большого pull:
   ```powershell
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   pnpm install
   ```

5. **На Windows** — если pnpm ругается на постинсталл-скрипты — проверь `pnpm-workspace.yaml` секцию `allowBuilds`.

---

## Контакты

| Что | Файл / ссылка |
|---|---|
| Бренд-ассеты | `assets/brand/` |
| Открытые вопросы к клиенту | `QUESTIONS.md` |
| Зафиксированные решения | `PLAN.md` → раздел 0 |
| Дизайн-референсы | `SOS24/SOS24 Design.html` (открывается в браузере как Figma) |
| Спека экранов | `SOS24/uploads/SOS24_Mobile_Screens.md` |
