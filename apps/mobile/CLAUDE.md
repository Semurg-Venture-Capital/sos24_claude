# apps/mobile — SOS24 Mobile App

> Этот файл дополняет корневой `CLAUDE.md` контекстом, специфичным для мобильного приложения. Корневой читается первым, потом этот.

## Что это

Мобильное приложение **SOS24** для клиентов: оформление полисов ОСАГО/КАСКО, электронный полис с QR, вызов аварийного комиссара, европротокол, история убытков.

## Стек

- **Runtime:** React Native через **Expo SDK** (managed с CNG)
- **Workflow:** Expo + Dev Client, без EAS-облака. Билды локально на Mac mini / Android Studio
- **Язык:** TypeScript strict
- **Навигация:** React Navigation v7
- **Стилизация:** NativeWind (Tailwind для RN) + кастомные компоненты по дизайн-системе
- **Server state:** TanStack Query
- **Client state:** Zustand
- **Формы:** React Hook Form + Zod
- **Хранилище:** MMKV (encrypted) для данных, react-native-keychain для секретов
- **Биометрия:** react-native-biometrics + PIN fallback
- **Карты:** react-native-maps (Google Maps)
- **Камера:** react-native-vision-camera
- **QR:** react-native-qrcode-svg
- **Push:** FCM + APNs через notifee
- **i18n:** i18next + react-i18next (4 локали из `@sos24/i18n-strings`)
- **Crash:** @sentry/react-native
- **Analytics:** posthog-react-native
- **OTA:** expo-updates с self-hosted сервером
- **Tests:** Jest + React Native Testing Library (unit), Maestro (E2E)

## Команды

```bash
pnpm install                          # из корня монорепо
pnpm dev:mobile                       # запустить Metro bundler
pnpm --filter mobile run android      # билд + запуск на Android
pnpm --filter mobile run ios          # билд + запуск на iOS (нужен Mac)
pnpm --filter mobile run web          # запуск в браузере (для дев-проверки)
pnpm --filter mobile run test         # юнит-тесты
pnpm --filter mobile run typecheck    # tsc --noEmit
```

## Структура (план, формируется по мере разработки)

```
apps/mobile/
├── src/
│   ├── app/                  # навигация (роуты)
│   ├── components/           # переиспользуемые UI-компоненты
│   ├── features/             # бизнес-фичи (auth, policy, claims, partners)
│   ├── hooks/                # общие хуки
│   ├── lib/                  # утилиты, обёртки над нативными API
│   ├── services/             # API-клиент, интеграции (MyID, OneID, Uzcard)
│   ├── stores/               # Zustand-сторы
│   ├── theme/                # токены NativeWind, цвета, типографика
│   └── i18n/                 # инициализация i18next
├── assets/                   # картинки, шрифты
├── app.json                  # Expo конфиг
├── babel.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

## Конвенции

- **Импорты из workspace:** `@sos24/api-types`, `@sos24/i18n-strings`
- **Файлы компонентов:** PascalCase (`PolicyCard.tsx`), хуки — camelCase с `use` (`usePolicy.ts`)
- **Цвета и spacing — только через NativeWind-классы**, никаких inline-стилей кроме экзотики
- **Все строки — через i18n**, никаких хардкоженных русских/узбекских текстов в компонентах
- **Серверные данные — только через TanStack Query**, никаких ручных fetch в компонентах

## Workflow разработки страницы

1. Получаем дизайн от Figma (как HTML/png/спецификация)
2. Обсуждаем поведение, граничные случаи, состояния (loading, error, empty)
3. Реализуем компоненты + интеграцию с API
4. Проверяем на эмуляторе и реальном устройстве
5. PR в `main` с описанием

## Что не делаем здесь

- Не запускаем `expo eject` — всё через CNG (`expo prebuild`)
- Не добавляем нативные модули без Config Plugin (если плагина нет — пишем свой)
- Не используем Expo Go для тестирования — только Dev Client с нашими нативными зависимостями
