# ANDROID.md — Анализ готовности Android (apps/mobile)

> Дата анализа: **2026-06-08**. Цель: подготовить мобильное приложение к тестированию на Android.
> До этого вся нативная работа велась под iOS (MyID SDK, Liquid Glass tab bar, тест на iPhone).

---

## 1. Краткий вывод

Бизнес-логика, экраны, навигация, API, стейт, i18n — **кросс-платформенные**, работают на Android без изменений.
Но есть **жёсткие блокеры нативного уровня**, без которых Android-сборку не запустить и не пройти регистрацию:

| # | Блокер | Критичность |
|---|---|---|
| 1 | `android.package` не задан в `app.json` | 🔴 не соберётся |
| 2 | **MyID — только iOS** (нативный модуль и Config Plugin без Android), а MyID **обязателен** в регистрации → на Android не пройти дальше OTP | 🔴 приложение неюзабельно |
| 3 | Таб-бар использует **SF Symbols** (iOS-only) — на Android иконки не отрисуются | 🟠 ломается нижняя навигация |
| 4 | `android/` не сгенерирован (`expo prebuild` под Android не запускали) | 🔴 нет нативного проекта |
| 5 | Окружение сборки на машине не настроено (нет `JAVA_HOME`, `ANDROID_HOME`, `adb`) | 🔴 нечем собирать |

---

## 2. Что уже готово к Android (менять не нужно)

- **Все экраны и UI-компоненты** (`features/*`, `components/ui/*`) — чистый RN, кросс-платформенные.
- **Навигация** — React Navigation v7 (stack/tab) работает на обеих платформах.
- **API-клиент** — уже знает про Android-эмулятор: `client.ts` отдаёт хост `10.0.2.2` для `Platform.OS === 'android'` (loopback к localhost хоста). Для физического устройства — `EXPO_PUBLIC_API_HOST` (LAN IP).
- **Хранилище** — `secure.ts` корректно ветвится для native (iOS/Android).
- **Клавиатура** — `useKeyboardHeight.ts` уже использует `keyboardDidShow/Hide` для Android.
- **Нативные зависимости — кросс-платформенные** (autolinking сам соберёт под Android): `expo-blur`, `expo-location`, `expo-secure-store`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-screens`, `react-native-safe-area-context`, `react-native-svg`, `react-native-qrcode-svg`.
- **Шрифты** (NeueMontreal, Manrope) — через `expo-font`, работают на Android.
- **Adaptive icon**, `edgeToEdgeEnabled: true`, `predictiveBackGestureEnabled: false` — в `app.json` уже заданы.

---

## 3. Что нужно сделать (по приоритету)

### P0 — без этого не собрать / не протестировать

**3.1. Задать `android.package`** в `app.json` → `expo.android.package = "uz.sos24.app"` (зеркало iOS `bundleIdentifier`).

**3.2. Решить вопрос MyID на Android** (главный блокер). Два пути:

- **Вариант A — временный байпас для тестирования (быстро, рекомендую на старте):**
  на Android разрешить регистрацию без MyID (OTP-only) — пропускать MyID-гейт, ставить статус, позволяющий войти в `MainNavigator`. Это разблокирует тестирование **всего остального** приложения на Android уже сейчас. MyID-экран на Android показывает заглушку «доступно только на iOS / скоро».
  - Точки правки: `MyIdOnboardingScreen.tsx` (заглушка на Android), `RootNavigator` (на Android не загонять в MyId-гейт), бэкенд `verificationStatus` (разрешить вход без MYID_VERIFIED для Android-сборки).

- **Вариант B — нативный MyID Android SDK (полноценно, отдельная задача):**
  у MyID есть Android-SDK (`gitlab.myid.uz/myid-public-code/myid-android-sdk`, Kotlin). Нужно:
  1. Kotlin-модуль-мост в `packages/myid-sdk/android/` (аналог `ios/MyIdSdkModule.swift`).
  2. Расширить Config Plugin `plugins/withMyIdSdk.js` Android-веткой: `withProjectBuildGradle`/`withAppBuildGradle` (maven-репозиторий MyID + `implementation`), `withMainApplication`/package registration, разрешение CAMERA.
  3. Те же тест-ключи (`api.devmyid.uz`) — но проверить, что Android-SDK их принимает.

**3.3. `expo prebuild -p android`** — сгенерировать нативный `android/` проект (применит плагины и `app.json`).

**3.4. Настроить окружение сборки** (Android Studio уже установлена, но env не задан):
  - `JAVA_HOME` → JDK, встроенный в Android Studio (`/Applications/Android Studio.app/Contents/jbr/Contents/Home`).
  - `ANDROID_HOME` → `~/Library/Android/sdk` (поставить через Android Studio → SDK Manager: Platform 35, build-tools, platform-tools, emulator, системный образ).
  - PATH += `$ANDROID_HOME/platform-tools` (adb), `$ANDROID_HOME/emulator`.
  - Создать AVD (эмулятор) или подключить устройство (USB-debugging).

### P1 — чтобы UI был корректным

**3.5. Иконки таб-бара под Android.** `MainNavigator.tsx` использует `type: 'sfSymbol'` (iOS-only). Для Android нужно ветвление: `Platform.OS === 'ios'` → sfSymbol, иначе `type: 'image', source: require('...png')` (нужны 4 пары иконок: дом/полисы/гараж/профиль, active+inactive). Liquid Glass на Android нет — будет нативный Material-таб-бар (это нормально).

**3.6. Разрешения Android.** Добавить в `app.json` `android.permissions` по мере необходимости: `CAMERA` (для MyID, когда Вариант B), `ACCESS_FINE_LOCATION` (аджастер — добавляется плагином expo-location), `INTERNET` (по умолчанию). Лишние не добавлять.

**3.7. Blur на Android.** `expo-blur` на Android по умолчанию слабый; для заметного эффекта добавить проп `experimentalBlurMethod="dimezisBlurView"` на ключевых `BlurView` (карточки, оверлеи) — проверить на устройстве.

### P2 — позже (не для первого теста)

- **Релизный keystore** + подпись для сборки APK/AAB (для дистрибуции/Play Market).
- **Push (FCM)** — пока не интегрирован (notifee/firebase не подключены) — общий для iOS/Android пункт.
- **react-native-maps / vision-camera** — в зависимостях ещё нет; появятся при работе над картой аджастера/камерой.
- Прогон всех экранов на разных размерах/плотностях Android, проверка edge-to-edge инсетов.

---

## 4. Рекомендованный порядок для теста «уже сейчас»

1. `android.package` + временный **байпас MyID на Android** (Вариант A) — разблокирует приложение.
2. Иконки таб-бара под Android (Platform-ветка + PNG).
3. Настроить `JAVA_HOME` / `ANDROID_HOME`, SDK через Android Studio, создать AVD.
4. `expo prebuild -p android` → `expo run:android`.
5. Прогнать основные флоу (логин OTP → Home → Полисы/Гараж/Профиль → оформление ОСАГО → добавление авто с НАПП).
6. Параллельно/после — полноценный **MyID Android SDK** (Вариант B) как отдельная задача.

---

## 5. Окружение сборки — текущее состояние машины (2026-06-08)

| Компонент | Статус |
|---|---|
| Android Studio | ✅ установлена (`/Applications/Android Studio.app`) |
| JDK на PATH | ❌ нет (есть встроенный в Android Studio jbr) |
| `ANDROID_HOME` / SDK | ❌ не задан / не установлен через SDK Manager |
| `adb`, `emulator` | ❌ нет на PATH |
| AVD (эмулятор) | ❌ не создан |

> Перед сборкой: открыть Android Studio → SDK Manager (поставить SDK Platform 35, build-tools, platform-tools, emulator, system image) → создать AVD; затем задать env-переменные.

---

## 6. Сделано 2026-06-08 (байпас MyID — Вариант A)

- ✅ `android.package = "uz.sos24.app"` в `app.json`.
- ✅ **Байпас MyID на Android:** `authStore.resolveAuthStatus()` — на Android `NOT_VERIFIED → authenticated` (MyID-гейт пропускается). Регистрация по OTP, дальше — всё приложение. TODO: убрать после MyID Android SDK.
- ✅ Таб-иконки SF Symbols обёрнуты в `Platform.OS === 'ios'`; на Android пока лейблы без иконок (допилить PNG).
- ✅ Окружение сборки настроено: cmdline-tools установлены, лицензии приняты, ставится системный образ `android-36;google_apis;arm64-v8a`.
- ✅ Скрипт окружения: `apps/mobile/scripts/android-env.sh` (`source` его → adb/emulator/JAVA_HOME).

### Быстрый старт (Android)

```bash
# 1. окружение (один раз на сессию терминала)
source apps/mobile/scripts/android-env.sh

# 2. запустить эмулятор
emulator -avd sos24_pixel &        # список: emulator -list-avds

# 3. поднять приложение на эмуляторе (из apps/mobile)
cd apps/mobile && npx expo run:android
```

> На эмуляторе API-хост уже `10.0.2.2` (loopback к localhost Mac) — бэкенд на `:3030` доступен автоматически.
> MyID-экран на Android не показывается (байпас) — вход по OTP `6330`.
