# DEVELOPMENT.md — Процесс разработки SOS24

> Этот файл описывает **как именно мы разрабатываем** платформу SOS24 на Этапе 1. Структуру репозитория, рабочий процесс «страница за страницей», команды, конвенции, ветки.
>
> Бизнес-контекст и продуктовые решения — в `CLAUDE.md` и `PLAN.md`. Открытые вопросы — в `QUESTIONS.md`. Здесь только инженерная сторона.

---

## 1. Структура монорепо

```
sos24/
├── CLAUDE.md                      # главный контекст проекта (читается первым)
├── DEVELOPMENT.md                 # этот файл — процесс разработки
├── PLAN.md                        # технический план, архитектура, модули
├── QUESTIONS.md                   # открытые вопросы к клиенту
├── TASKS.md                       # подготовительные задачи (Этап 0)
├── DESIGN_SYSTEM.md               # дизайн-токены и компоненты
│
├── package.json                   # корневые скрипты + devDependencies
├── pnpm-workspace.yaml            # описание воркспейсов
├── turbo.json                     # Turborepo pipeline
├── tsconfig.base.json             # общий TS-конфиг
├── .npmrc                         # pnpm node-linker=hoisted (для RN)
├── .nvmrc                         # Node 22 LTS
├── .mcp.json                      # MCP-серверы (context7)
├── .prettierrc.json, .prettierignore
├── .gitignore
│
├── assets/                        # бренд-ассеты (логотип, референсы)
│
├── apps/
│   ├── mobile/      → React Native (Expo) — клиентское приложение
│   ├── api/         → NestJS — единый бэкенд
│   ├── admin/       → Next.js — админка страховой
│   ├── partner/     → Next.js — B2B-кабинет СТО/медклиник
│   └── landing/     → Next.js — sos24.uz
│
└── packages/
    ├── api-types/        → TS-типы из OpenAPI (генерация из apps/api)
    ├── config-ts/        → общие tsconfig
    ├── config-eslint/    → общие ESLint-конфиги
    └── i18n-strings/     → переводы 4 локали (uz-Latn, uz-Cyrl, ru, en)
```

Каждая папка `apps/*` и `packages/*` содержит свой `CLAUDE.md` с локальным контекстом — Claude автоматически читает их каскадно при работе в соответствующей подпапке.

---

## 2. Команды

Все команды запускаются **из корня проекта**.

### Установка
```bash
pnpm install
```

### Разработка
```bash
pnpm dev                  # все приложения параллельно (через turbo)
pnpm dev:mobile           # только мобайл (Metro bundler)
pnpm dev:api              # только NestJS
pnpm dev:admin            # только админка
pnpm dev:partner          # только партнёрский кабинет
pnpm dev:landing          # только лендинг
```

### Качество кода
```bash
pnpm lint                 # ESLint по всем воркспейсам
pnpm typecheck            # tsc --noEmit по всем
pnpm test                 # юнит-тесты по всем
pnpm format               # Prettier write
pnpm format:check         # Prettier check (для CI)
```

### Сборка
```bash
pnpm build                # все приложения
pnpm --filter mobile run prebuild   # генерация ios/ и android/ для RN
```

### Очистка
```bash
pnpm clean                # все build-артефакты + node_modules
```

---

## 3. Рабочий процесс «страница за страницей»

Разработка идёт **итеративно по экранам/страницам**, не «сначала всё API, потом весь UI». На каждый экран — отдельный цикл:

### Шаг 1. Дизайн
Пользователь предоставляет дизайн экрана. Форматы:
- HTML-экспорт из Figma / Stitch (предпочтительный)
- Скриншот PNG + текстовое описание
- Ссылка на Figma + спецификация

### Шаг 2. Обсуждение
Перед кодом проговариваем:
- **Состояния:** loading, error, empty, success, offline (если применимо)
- **Граничные случаи:** что если данных нет? что при медленном интернете? что при отказе сервера?
- **Поведение элементов:** что происходит при тапе, свайпе, удержании
- **Валидация форм:** какие правила, какие сообщения, какие маски ввода
- **i18n:** какие тексты, какие плюрализации
- **Доступность:** обязательные labels, контрасты, размеры тач-зон
- **Аналитика:** какие события отправляем в PostHog

### Шаг 3. Реализация

Порядок:
1. **API первый** (если новый эндпоинт): описываем DTO + контроллер в `apps/api`, регенерируем `@sos24/api-types`
2. **Компоненты UI**: переиспользуемые в `apps/mobile/src/components/` или `apps/admin/src/components/`
3. **Экран**: собираем компоненты, подключаем хуки данных через TanStack Query
4. **i18n-ключи**: добавляем в `packages/i18n-strings/src/locales/uz-Latn.json`, переводим на остальные локали
5. **Тесты**: минимум — happy path; для критичных мест (платёж, OTP) — все ветки

### Шаг 4. Проверка
- Mobile: запускаем на эмуляторе Android + симуляторе iOS + реальном устройстве
- Web: проверяем в Chrome + Safari + на мобильном viewport
- Прогоняем happy path руками
- Проверяем `pnpm typecheck && pnpm lint`

### Шаг 5. PR
- Ветка `feat/<scope>-<short-name>` (например, `feat/mobile-login-otp`)
- PR в `main` с описанием изменений и скриншотами
- Самопроверка по чек-листу из шага 4

---

## 4. Git-флоу

- **Основная ветка:** `main`
- **Ветки для фич:** `feat/<scope>-<name>` (например, `feat/mobile-policy-checkout`)
- **Ветки для фиксов:** `fix/<scope>-<name>`
- **Коммиты по Conventional Commits:**
  - `feat(mobile): add OTP screen`
  - `fix(api): handle NAPP timeout`
  - `chore: bump expo to 52`
  - `docs: update partner CLAUDE.md`
- **PR-ы** в `main` после ревью
- **Не пушим прямо в `main`** для нового кода (исключения — правки документации)

---

## 5. Конвенции именования

| Что | Стиль | Пример |
|---|---|---|
| Папки | kebab-case | `policy-checkout/` |
| Файлы компонентов (React) | PascalCase | `PolicyCard.tsx` |
| Файлы хуков | camelCase с `use` | `usePolicy.ts` |
| Файлы утилит | camelCase | `formatCurrency.ts` |
| Константы | UPPER_SNAKE_CASE | `MAX_OTP_ATTEMPTS` |
| Переменные / функции | camelCase | `getUserPolicies` |
| Типы / интерфейсы | PascalCase | `Policy`, `UserDto` |
| i18n-ключи | dot.case | `policy.osago.title` |

---

## 6. Работа с зависимостями

```bash
# Добавить в конкретный воркспейс
pnpm --filter mobile add react-native-mmkv
pnpm --filter mobile add -D @types/react-native

# Добавить в корень (только dev-tools для всех)
pnpm add -Dw turbo prettier

# Добавить shared-пакет как зависимость
pnpm --filter mobile add @sos24/i18n-strings@workspace:*
```

---

## 7. Локализация (i18n)

- **Source of truth:** `packages/i18n-strings/src/locales/uz-Latn.json`
- **Все 4 файла должны иметь одинаковые ключи** — без расхождений
- **Workflow добавления ключа:**
  1. Добавили в `uz-Latn.json`
  2. Перевели в `uz-Cyrl.json`, `ru.json`, `en.json`
  3. Если перевода нет — оставляем заглушку с `// TODO`, но ключ должен существовать
- **Никаких хардкоженных строк** в компонентах. Только `t('namespace.key')`.

---

## 8. Окружения

| Окружение | URL | Назначение |
|---|---|---|
| local | `http://localhost:3000` (admin), `:3001` (partner), `:3002` (landing), `:3030` (api) | разработка |
| staging | `*-staging.sos24.uz` | внутренние тесты, демо клиенту |
| production | `sos24.uz` | продакшен |

Env-переменные — в `.env.local` (gitignored). Шаблон — `.env.example` (закоммичен).

---

## 9. CI/CD (план)

Self-hosted Gitea Actions runners на инфре заказчика:

- **PR-проверки:** typecheck, lint, тесты, prettier-check
- **Mobile builds:**
  - Внутренние сборки на Mac mini через Fastlane → TestFlight (iOS) + Internal Testing (Android)
  - Production-релизы — ручной триггер
- **Web builds:** статика собирается в Docker-образы, разворачивается через docker-compose на серверах заказчика
- **API:** Docker-образ, разворачивается через docker-compose

Подробности — в отдельном `ops/` (создадим когда дойдём до деплоя).

---

## 10. Контрольный лист перед началом новой страницы

Перед тем как писать код экрана, убедиться:

- [ ] Есть дизайн (HTML/PNG/Figma)
- [ ] Обсудили все состояния и граничные случаи
- [ ] Понимаем, какие API-эндпоинты нужны (новые или существующие)
- [ ] Знаем, какие i18n-ключи добавить
- [ ] Создана ветка `feat/<scope>-<name>`
- [ ] Открыт `apps/<app>/CLAUDE.md` и нужный экран в Figma

После реализации, перед PR:

- [ ] `pnpm typecheck` зелёный
- [ ] `pnpm lint` зелёный
- [ ] Тесты прошли (если есть)
- [ ] Проверил на эмуляторе/в браузере
- [ ] i18n-ключи во всех 4 локалях
- [ ] Скриншоты добавлены в PR

---

## 11. Полезные ссылки

- `CLAUDE.md` — продуктовый контекст SOS24
- `PLAN.md` — архитектура и модули
- `QUESTIONS.md` — открытые вопросы к клиенту
- `DESIGN_SYSTEM.md` — токены дизайна (цвета, типографика, компоненты)
- `assets/brand/` — бренд-ассеты
- Каждый `apps/<app>/CLAUDE.md` — локальные правила и команды этого приложения
