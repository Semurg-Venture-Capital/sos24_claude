# PUSH_SETUP.md — Настройка push-уведомлений (FCM + APNs)

> Как получить ключи и куда их вписать, чтобы заработали нативные push.
> Архитектура: backend шлёт **напрямую** — Android через **FCM**, iOS через **APNs (.p8)**.
> Клиент (`expo-notifications`) получает нативный токен и регистрирует его на бэке.
> Пока ключей нет — уведомления работают **только in-app** (push не отправляется), код менять не нужно.
>
> Связано: модуль `apps/api/src/notifications`, `apps/mobile/src/lib/push.ts`, env в
> `apps/api/.env` (dev) и `deploy/k8s/secret.yaml` (prod), плейсхолдеры — `deploy/k8s/secret.example.yaml`.

**Идентификаторы приложения:**
- iOS bundle: **`uz.sos24.client`**, Apple Team: **`SRGDG34MV6`**.
- Android package: **`uz.sos24.app`** (см. `apps/mobile/app.json` → `android.package`).

---

## 1. iOS — APNs Auth Key (.p8)

Нужен один **token-based** ключ (.p8): не протухает, один на все приложения команды.

**Где взять** (нужна роль Admin/Account Holder в Apple Developer аккаунте Semurg):
1. https://developer.apple.com/account → **Certificates, Identifiers & Profiles**.
2. **Keys** → **+** (создать ключ).
3. Имя: `SOS24 APNs`. Отметить **Apple Push Notifications service (APNs)** → Continue → Register.
4. **Скачать `.p8`** (даётся **один раз!**). Записать **Key ID** (10 символов, рядом с ключом).
5. **Team ID** = `SRGDG34MV6` (вверху страницы аккаунта / Membership).
6. Проверить, что App ID `uz.sos24.client` имеет включённую **Push Notifications** capability
   (Identifiers → App IDs → uz.sos24.client → Capabilities → Push Notifications ✓).
   Для dev-сборки это включит сам Xcode (`-allowProvisioningUpdates`).

**Что в итоге передать:** файл `AuthKey_XXXXXXXXXX.p8`, **Key ID**, **Team ID**.

---

## 2. Android — Firebase / FCM

Нужны: `google-services.json` (в приложение) + service-account JSON (для отправки с бэка).

**Где взять:**
1. https://console.firebase.google.com → **Создать проект** (напр. `SOS24`).
2. В проекте → **Add app → Android**:
   - **Android package name:** `uz.sos24.app` (точно как в app.json).
   - App nickname: `SOS24`.
   - Скачать **`google-services.json`**.
3. Для отправки с сервера: **⚙ Project settings → Service accounts → Generate new private key**
   → скачается JSON service-account (это и есть `FCM_SERVICE_ACCOUNT`).
   *(FCM v1 включается автоматически вместе с service-account.)*

**Что в итоге передать:** `google-services.json` (для клиента) + service-account `.json` (для бэка).

> ⚠️ iOS через Firebase подключать НЕ нужно — iOS у нас идёт напрямую через APNs.

---

## 3. Куда вписать ключи

### 3.1 Backend (отправка push)

Переменные окружения API:

| Переменная | Значение |
|---|---|
| `FCM_SERVICE_ACCOUNT` | Содержимое service-account JSON **одной строкой** |
| `APNS_KEY` | Содержимое `.p8` (переводы строк как есть или экранированные `\n`) |
| `APNS_KEY_ID` | Key ID из шага 1 |
| `APNS_TEAM_ID` | `SRGDG34MV6` |
| `APNS_BUNDLE_ID` | `uz.sos24.client` |
| `APNS_PRODUCTION` | `false` для dev-сборки (sandbox APNs), `true` для TestFlight/прод |

- **dev:** в `apps/api/.env`.
- **prod:** в `deploy/k8s/secret.yaml` (не коммитится; шаблон — `secret.example.yaml`).

Минимизировать JSON service-account в одну строку:
```bash
jq -c . service-account.json        # вывод вставить в FCM_SERVICE_ACCOUNT
```
`.p8` можно вставить как есть в кавычках (многострочно) или одной строкой с `\n`.

### 3.2 Mobile (получение токена на Android)

1. Положить `google-services.json` в `apps/mobile/` (рядом с app.json).
2. В `apps/mobile/app.json` добавить:
   ```json
   "android": { "googleServicesFile": "./google-services.json", ... }
   ```
3. (iOS ничего дополнительно — APNs работает через capability при сборке.)

---

## 4. Применить и проверить

1. **Пересобрать dev-client** (добавлены нативные модули `expo-notifications`/`expo-device`;
   плюс `google-services.json` на Android) — `xcodebuild` для iOS / `expo run:android` для Android.
   См. [[project-mobile-devclient]] / `docs/STAGE1.md`.
2. Перезапустить API с заданными env.
3. В логе API при старте должно появиться `FCM инициализирован` и/или `APNs инициализирован`
   (вместо `Push не настроен …`).
4. На телефоне разрешить уведомления → приложение зарегистрирует токен (`POST /me/devices`).
5. Тест: оформить полис (активация) → придёт push + запись в «Уведомлениях».

---

## 5. Чек-лист

- [ ] APNs `.p8` + Key ID + Team ID (iOS)
- [ ] `google-services.json` (Android-клиент) → в app.json
- [ ] Service-account JSON (Android-сервер) → `FCM_SERVICE_ACCOUNT`
- [ ] env заданы в `.env` (dev) и `secret.yaml` (prod)
- [ ] dev-client пересобран
- [ ] в логе API: `FCM/APNs инициализирован`
- [ ] токен устройства зарегистрировался, тестовый push дошёл
