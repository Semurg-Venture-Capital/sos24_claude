# apps/admin — SOS24 Admin Panel

> Этот файл дополняет корневой `CLAUDE.md` контекстом, специфичным для админки. Корневой читается первым, потом этот.

## Что это

Веб-админка для сотрудников страховой компании. Управление:
- Тарифами (ОСАГО, КАСКО — переменные коэффициенты)
- Полисами (модерация, аннулирование, перевыпуск)
- Убытками (рассмотрение, выплаты)
- Аварийными комиссарами (диспетчер, расписание)
- Партнёрской сетью (одобрение СТО и медклиник)
- Контентом лендинга (статьи, FAQ, баннеры)
- Отчётами (финансы, KPI, выгрузка в 1С)
- Пользователями админки (роли, права)

## Стек

- **Framework:** Next.js 15 (App Router, Turbopack dev)
- **Язык:** TypeScript strict
- **Стилизация:** Tailwind CSS
- **UI-компоненты:** shadcn/ui (на базе Radix UI) — для админских таблиц, форм, диалогов
- **Server state:** TanStack Query
- **Client state:** Zustand (минимально, только UI-стейт)
- **Формы:** React Hook Form + Zod
- **Графики:** Recharts (или ECharts если нужны сложные)
- **Таблицы:** TanStack Table
- **Auth:** JWT через cookies, refresh через API
- **i18n:** next-intl (4 локали, как в мобайле)

## Команды

```bash
pnpm install                       # из корня
pnpm dev:admin                     # next dev --turbopack
pnpm --filter admin run build
pnpm --filter admin run start
pnpm --filter admin run lint
pnpm --filter admin run typecheck
```

## Структура

```
apps/admin/src/
├── app/                       # App Router: страницы
│   ├── (auth)/                # экраны логина, восстановления
│   ├── (dashboard)/           # защищённые страницы
│   │   ├── policies/
│   │   ├── claims/
│   │   ├── tariffs/
│   │   ├── partners/
│   │   ├── content/
│   │   ├── reports/
│   │   └── users/
│   └── api/                   # API-роуты (только проксирование к apps/api)
├── components/                # UI-компоненты
├── lib/                       # утилиты
└── services/                  # API-клиент к apps/api
```

## Конвенции

- **Все данные — через API из apps/api**, никакой прямой работы с БД
- **Авторизация по ролям** — RBAC, флаги ролей приходят из JWT
- **Серверные компоненты по умолчанию**, клиентские (`"use client"`) — только для интерактивных частей
- **Импорты:** `@/components/*`, `@/lib/*`, `@sos24/api-types` для типов
