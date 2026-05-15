# packages/api-types — Shared API Types

Сгенерированные TypeScript-типы из OpenAPI-схемы `apps/api`. Используются всеми клиентами (mobile, admin, partner, landing) для типобезопасных вызовов API.

## Workflow

1. NestJS экспортирует Swagger/OpenAPI JSON при старте (`/api-docs-json`)
2. Скрипт `pnpm --filter @sos24/api-types generate` запускает `openapi-typescript` и кладёт результат в `src/generated.ts`
3. Клиенты импортируют типы из `@sos24/api-types`

## Что НЕ делать

- Не редактировать сгенерированные файлы вручную — всё перетрётся
- Не добавлять бизнес-логику — это пакет ТОЛЬКО для типов
