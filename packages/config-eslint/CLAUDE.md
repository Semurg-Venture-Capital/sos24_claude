# packages/config-eslint — Shared ESLint Configs

ESLint flat-конфиги для всех приложений.

## Файлы

- `base.js` — общая основа
- `next.js` — правила для Next.js
- `react-native.js` — правила для RN/Expo
- `node.js` — правила для NestJS

Каждое приложение в своём `eslint.config.mjs` импортирует нужный конфиг и при необходимости добавляет локальные правила.
