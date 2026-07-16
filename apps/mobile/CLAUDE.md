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
- **Все строки — через i18n** (см. раздел «i18n — обязательно» ниже)
- **Серверные данные — только через TanStack Query**, никаких ручных fetch в компонентах

## i18n — обязательно (переводы делаются СРАЗУ)

Локализация мобилки завершена: **69/69 экранов на `t()`, 1304 ключа × 4 языка** (uz-Latn, uz-Cyrl, ru, en). **Правило: любой новый или изменённый пользовательский текст оформляется через i18n немедленно, в том же изменении — НЕ хардкодить и НЕ откладывать.**

Как добавлять текст:
1. В компоненте: `const { t } = useTranslation();` → `t('namespace.key')`. Интерполяция: `t('key', { var })` + `{{var}}` в переводе.
2. Ключ добавить во **ВСЕ 4 локали** `packages/i18n-strings/src/locales/{ru,uz-Latn,uz-Cyrl,en}.json` с **реальным переводом** (узбекский грамотно, латиница с `oʻ/gʻ`; не побуквенный транслит). Деревья ключей во всех 4 файлах держать идентичными (паритет).
3. Namespace по домену: `common` (общие глаголы: save/cancel/back/next/retry/loading/seeAll/comingSoon), `home`, `policies`, `health`, `euro`, `purchase`, `partners`, `support`, `adjuster`, `garage`, `profile`, `sos`, `productTypes`, … Переиспользуй `common.*` вместо дублей.
4. Модульные map-константы с русскими значениями, которые рендерятся → хелпер `(k) => t('ns.map.'+k)` внутри компонента (module-scope не может `t()`).

НЕ переводить: данные из API (ФИО, названия клиник/компаний, тексты с бэка), enum-значения, бренды/аббревиатуры (SOS24, MyID, WHOOP, PDF, QR, ОСАГО, КАСКО, VIN, №), комментарии, seed-фразы LLM.

Enforcement: PostToolUse-хук `.claude/hooks/check-i18n.sh` предупреждает при захардкоженной кириллице в JSX/пропсах отредактированного `apps/mobile/**/*.tsx`. Увидел предупреждение — вынеси строку в ключ и переведи. Детали и схема массовой миграции — в памяти `feedback-always-i18n` / `project-i18n-migration`.

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
