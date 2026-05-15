# packages/config-ts — Shared TypeScript Configs

Базовые `tsconfig.json` для разных типов приложений в монорепо.

## Файлы

- `base.json` — общая основа (strict, ES2022, и т.д.). Зеркало `tsconfig.base.json` в корне
- `nextjs.json` — для Next.js (admin, partner, landing)
- `react-native.json` — для Expo / RN (mobile)
- `node.json` — для NestJS (api)

Каждое приложение в своём `tsconfig.json` делает `extends: "@sos24/config-ts/<flavor>.json"`.
