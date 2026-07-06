# STAGE1.md — Прогресс Этапа 1 (разработка)

> Журнал реальных работ Этапа 1. Что сделано, что отложено, где остановились, как продолжить.
>
> **Последнее обновление:** 2026-07-06 — **Модуль «Здоровье» (M14)** фулстек + интерактивный европротокол; **ПРОД задеплоен** (API+admin, миграции health, MED_ENCRYPTION_KEY); **iOS build 6** готов к TestFlight (архив делает пользователь в Xcode). До этого (06-24) — B2B-кабинет партнёров.

---

## Где остановились (2026-07-06)

> **Статус 2026-07-06 — Модуль «Здоровье» (M14) целиком + интерактивный европротокол. ПРОД обновлён, iOS build 6 готовится к TestFlight. Ветка `main`.**
>
> **Модуль «Здоровье» (M14)** — фулстек (API+мобилка+админка). Вкладка «Здоровье»: хаб, **ИИ-триаж (mock)** → предв. диагноз, **врачи/клиники + запись** (модель `Doctor` поверх `partners`/`PartnerBooking`), **мед.карта** с field-level шифрованием (`MED_ENCRYPTION_KEY`, AES-256-GCM) + автозаполнение из профиля MyID + **импорт из Apple HealthKit** (группа крови/рост/вес), **экстренные контакты** (+ выбор из телефонной книги `expo-contacts`), **ЧП/SOS**: тревога реально оповещает контакты (SMS-пайплайн, mock без ключей Playmobile) + push диспетчерам + гео, диспетчер видит тревоги в админке (вкладка SOS/ЧП, «Принять»/«Закрыть»). Кнопка SOS активируется удержанием; «Скорая» → звонок диспетчеру 1024. Админка: раздел «Здоровье» (Врачи CRUD, Записи, SOS/ЧП). Нативные модули (healthkit+nitro+expo-contacts) — dev-client пересобирали. ТЗ — `docs/HEALTH.md`.
>
> **Европротокол (шаг 3) — интерактив:** зоны первого удара (мультивыбор 8 зон вокруг силуэта авто) и повреждённые детали (17 тап-маркеров по схеме), итог текстом в PDF-бланк.
>
> **ПРОД (2026-07-06):** образы API+admin выкачены, миграции health применены Job-ом, `MED_ENCRYPTION_KEY`+`TRIAGE_MODE=mock`+`SMS_MOCK=true` в секрете. Проверено сквозняком (`/health/*` живёт, шифрование ОК, admin обновлён). `kubeconfig` = `~/.kube/sos24.yaml`, нужен VPN. **⚠️ admin-Dockerfile тоже требует `--build-context pnpmstore=...`**.
>
> **⏳ НЕЗАВЕРШЕНО:** (1) засеять **врачей в прод** (0 сейчас) — `kubectl port-forward svc/postgresql 5435:5432` + `DATABASE_URL=...localhost:5435... pnpm exec ts-node --transpile-only apps/api/prisma/seed-health.ts`. (2) **TestFlight build 6** — пользователь делает Xcode Archive → Distribute (Team `SRGDG34MV6`), APNs prod-ключ `M59GZ76982`. Дальше по модулю: оплата приёма (M14.6), видео-заглушки (G).

---

## Где остановились (ранее)

> **Статус 2026-06-24 — B2B-кабинет партнёров `partner.sos24.uz` собран и задеплоен в прод (3-е веб-приложение). Ветка `main`.**
>
> **B2B-кабинет партнёров (`apps/partner`, partner.sos24.uz).** Два типа кабинета в одном приложении, тип определяется привязкой пользователя. Prisma: роль **PARTNER** в `UserRole`; `ownerId` (уник., FK→User, **1:1**) на `InsuranceCompany` и `Partner` (миграция `20260624140000_partner_cabinet_ownership`). Бэк: `POST /auth/partner/login` (пускает только PARTNER, возвращает `kind: INSURER|SERVICE`); модуль `apps/api/src/partner-portal` (`/cabinet/*`, `PartnerGuard`) — **строгая изоляция «только своя сущность»** (проверка владения на каждой операции), переиспользует `InsuranceService`/`PartnersService`. Эндпоинты: `me`; для страховой — компания/логотип/продукты/планы/статистика по полисам; для сервиса — профиль/лого/обложка/услуги/записи (подтвердить-отменить-завершить с push клиенту)/отзывы. Админка: в «Пользователях» роль **Партнёр** + блок привязки к компании ИЛИ точке (`linkCompanyId/linkPartnerId` в `admin.service`, селектор в `UserFormModal`). Фронт `apps/partner` зеркалит admin (OTP-логин `/auth/partner/login`, токен `sos24_partner_token`, Sidebar по типу кабинета через `/cabinet/me`, бренд `SosMark`+favicon): страницы Обзор/Компания/Продукты+тарифы (страховая) и Профиль/Услуги/Записи/Отзывы (сервис). Smoke-тест бэка пройден (вкл. 403 при заходе в чужой раздел). **ПРОД:** образ `sos24-partner` (NodePort 30040, 2 реплики), миграция применена Job-ом, nginx vhost `partner.sos24.uz` + upstream `sos24_partner`, **SSL выпущен acme.sh** (Google CA, ec-256) — https работает. ⚠️ Партнёрских аккаунтов в проде ещё нет — создаются в админке (Пользователи → роль Партнёр → привязать к компании/точке).
>
> **Статус 2026-06-21 — два больших модуля (Поддержка + Партнёры) + проверка полиса по QR + управление пользователями. ПРОД задеплоен, TestFlight (build 5) залит и проверен.** Ветка `main`.
>
> **Модуль «Поддержка» (M13) — realtime-чат.** Тикетная модель: Prisma `SupportTicket` + `SupportMessage` (роли USER/SUPPORT/SYSTEM, типы TEXT/IMAGE/FILE/AUDIO/SYSTEM, денормализованные счётчики непрочитанных/превью), enum-ы статусов/категорий. Роль **SUPPORT** в `UserRole`. Бэк `apps/api/src/support`: **Socket.IO-gateway** namespace `/support` (JWT в handshake) + **Redis-адаптер** (`@socket.io/redis-adapter`, мультиреплика, см. `redis-io.adapter.ts` + `main.ts`); REST для пользователя (`/me/support/*`) и оператора (`/admin/support/*`), курсорная пагинация; `SupportGuard` (SUPPORT/ADMIN), вход операторов в админку. Доставка: сообщение → БД → сокет → если получатель **не в чате**, push (`SUPPORT_REPLY`, deeplink `SupportChat`); проверка присутствия через `isUserInTicketRoom` (как в Telegram). Админка `/support`: двухпанельный чат, вложения, claim/close, **звук (Web Audio) + десктоп-уведомления + счётчик во вкладке** (`lib/agentAlerts.ts`); оператор SUPPORT видит только «Поддержку». Мобайл `features/support`: hub (M13.1, статичный FAQ), обращения, чат (M13.2, фото через image-picker, «печатает», AppState — выход из комнаты при сворачивании → пуш). Вход: **Профиль → Поддержка** (SOS-кнопка осталась под экстренную помощь).
>
> **Модуль «Партнёры» (M16).** Prisma: `PartnerCategory` (гибкие категории), расширенный `Partner` (категория, лого/баннер, `workingHours` Json, email/сайт/описание, рейтинг/reviewCount, гео), `PartnerService` (цены), `PartnerReview` (после визита), `PartnerBooking` (+статусы). Бэк `apps/api/src/partners`: публично — каталог (поиск/категория/**nearby haversine**/openNow/теги), деталь, отзывы, **слоты из графика** (занятые гасятся), создание записи (защита от двойной брони), мои записи, отмена, отзыв (только после COMPLETED); админ — CRUD категорий/партнёров/услуг (+presigned лого/баннер), записи со сменой статуса (+push `PARTNER_BOOKING`), модерация отзывов. Админка: раздел «Партнёры» (вкладки Партнёры/Категории/Записи + редактор с графиком и услугами). Мобайл `features/partners`: каталог (список + **карта `react-native-maps`** Apple Maps, ключ не нужен), деталь (M16.2), запись (M16.3, дата+слоты), мои записи + отзывы; на Home «Партнёры рядом» по геолокации. В прод засеяны 6 реалистичных партнёров (Roodell, AKFA Medline, Medion, Avto-Soz, Yo'l Yordam, Aqua) + 4 категории, изображения в MinIO (`prisma/seed-partners-real.ts`).
>
> **Проверка полиса по QR.** Поле `Policy.publicToken` (+ленивое создание для активных). Публичная HTML-страница `GET /v/<token>` (`policy-public.controller.ts`): баннер действителен/недействителен + данные + заглушка «Скачать PDF — скоро» (PDF после НАПП). QR в приложении теперь = URL проверки (`qrPayload`). dev: `PUBLIC_BASE_URL=http://192.168.13.88:3030` в `.env`; прод — дефолт `https://api.sos24.uz`. Тот же подход у европротокола (`/p/<token>`).
>
> **Управление пользователями (админка).** `POST/PATCH /admin/users` + фильтр по роли (`admin.service`/`dto/user-management.dto`); страница `/users` — создание/редактирование с ролями (USER/SUPPORT/ADJUSTER/ADMIN), бейджи. Так создаются операторы поддержки.
>
> **Брендинг + favicon.** Фирменный знак-«S» (`SosMark`) в админке (сайдбар, логин) и на публичных страницах (полис `/v`, европротокол `/p`). Иконка приложения (1024) → `favicon.ico` (16/32/48) для admin/landing/partner + `FaviconController` (StreamableFile) на API.
>
> **Доработки мобайла.** Европротокол — список под дизайн **M10.1** (статусы/прогресс/поиск/табы). **HEIC→JPEG** конвертация всех картинок при загрузке (`expo-image-manipulator`) — iPhone-фото видны в админке. Профиль: убран статичный «О приложении», снизу версия + **git-hash** сборки (`app.config.js`). Home: **pull-to-refresh**. Фикс: QR полиса вынесен в корневой модал (`MainStack`) — больше не засоряет вкладку «Полисы» (раньше зависал).
>
> **ПРОД задеплоен (2026-06-21).** Образы API+admin пересобраны (офлайн amd64) → реестр; миграции `support_chat`/`partners_module`/`policy_public_token` применены; rollout обеих деплойментов. **nginx ВМ** (`api.sos24.uz`) дополнен WebSocket-upgrade — проверено `HTTP/1.1 101` (realtime-чат по WSS). Прод-партнёры/категории засеяны (port-forward Postgres + MinIO через `s3.sos24.uz`). Секрет не менялся (REDIS_URL/APNS уже были). ⚠️ В процессе: отвалился VPN + Docker упал по диску (хост был на 96%) — почищено ~25 ГБ (наш `ios/build` + кэши, Xcode DerivedData не трогали).
>
> **TestFlight — build 5 залит и проверен на устройстве, всё работает.** iOS `buildNumber 4→5`, `aps-environment=production`, прод-APNs (M59GZ76982). Релиз ходит на `api.sos24.uz` (+ `wss://…/support`).
>
> **Открытые хвосты:** реальный SMS-OTP (Playmobile; сейчас 6330); реальные лого/контент партнёров (фото сейчас демо-picsum); живые операторы поддержки в проде; голосовые/файлы-документы в чате (нужна 1 нативная пересборка — `expo-audio`/`expo-document-picker`); PDF полиса (после НАПП — страница `/v` готова); платный ключ imagin; Android FCM. ⚠️ Диск Mac под контроль.

> **Статус 2026-06-20 (вечер) — большой блок фич + ПРОД-деплой. Готово к заливке TestFlight.** Ветка `main`.
>
> **Каталог страховых компаний (маркетплейс).** SOS24 — платформа-агрегатор, полисы выдают компании. Prisma: `InsuranceCompany`, `InsuranceProduct` (контент Json, `pricingMode` COEFFICIENT|PLANS, `baseRate`), `ProductPlan` (цена/покрытие/features); `Policy` += companyId/productId/planId. Бэк `apps/api/src/insurance` (публичные GET + admin CRUD + загрузка логотипа в MinIO). Админка: раздел `/insurance` (компании + продукты с тарифами, редактор контента). Мобайл: новый флоу **Компания → Продукты → Деталь → оформление** (`features/purchase`, экраны CompanySelect/CompanyProducts; ProductDetail тянет из API + выбор тарифа). Расчёт цены: база из `baseRate` (COEFFICIENT) или цены плана (PLANS). Покупка больше **не модалка** — обычные push-страницы. Карточки продуктов — дизайнерские (ProductCard, КАСКО тёмная). Кнопка «+» оформления в Гараже и Полисах — плавающая FAB.
>
> **Картинки авто в Гараже.** Крупные карточки с изображением. Рендеры через **imagin.studio** с кэшем в MinIO (`apps/api/src/vehicles/car-image.service.ts`, env `IMAGIN_CUSTOMER_KEY`). ⚠️ Публичный demo-ключ imagin **отключён** → отдаёт заглушку «авто под красным чехлом»; пользователю она ок как временная. Для реальных рендеров нужен **платный лицензионный ключ imagin** (TODO). Приоритет картинки: фото юзера (`Vehicle.photoKey`, загрузка expo-image-picker → `/me/vehicles/:id/photo`) → рендер → иконка-фолбэк. Деталь авто: hero с фото + «Добавить/Изменить фото».
>
> **Погода на главной.** `apps/mobile/src/api/weather.ts` — **Open-Meteo** (без ключа, бесплатно) + геолокация (фолбэк Ташкент) + reverse-geocode города; иконки `WeatherIcons`. Тап по виджету = обновить. ⚠️ `AbortSignal.timeout` НЕ работает в Hermes — использовать свой `withTimeout`.
>
> **Профиль/навигация:** иконка-бургер на главной → кнопка профиля (вкладка Profile).
>
> **Модуль уведомлений (push) — полностью.** Модели `Notification` (in-app история) + `DeviceToken`. `NotificationsModule` (@Global). Отправка: `NotificationsService.send()` пишет в БД + кладёт job в **BullMQ-очередь `push`** (Redis; attempts:5, backoff, DLQ) → `PushProcessor` шлёт прямой **FCM** (firebase-admin) / **APNs** (@parse/node-apn .p8); чистка мёртвых токенов; фолбэк inline. Триггеры: полис оформлен/истекает (крон 09:00 BullMQ), аджастер смена статуса, европротокол смена статуса, ошибка оплаты. Админ-рассылка всем: `/notifications` в админке (`POST /admin/notifications/broadcast`). Мобайл: `expo-notifications`+`expo-device`, регистрация токена, бейдж колокольчика, экран M11.1 (`features/notifications`), **тап → прочитано + deeplink** (`navigationRef`, само-повтор до ~12с от гонки cold start; данные из content.data И trigger.payload). Dev-тест: `POST /me/notifications/test`. Документация — `docs/PUSH_SETUP.md`. Связано: память [[project-push-notifications]].
>
> **⚠️ APNs ключи (правило):** dev-сборка (aps-environment=development) → Sandbox-ключ `BQPM29GUB8` + `APNS_PRODUCTION=false`; прод/TestFlight (aps-environment=production) → Production-ключ `M59GZ76982` + `APNS_PRODUCTION=true`. Несовпадение → `BadEnvironmentKeyInToken`.
>
> **ПРОД задеплоен (2026-06-20).** Образы API+admin пересобраны (офлайн amd64) и выкачены в `sos24-dev`. Secret обновлён: `REDIS_URL` (redis-master в кластере, с паролем), прод-`APNS_*` (ключ M59GZ76982, PRODUCTION=true). Миграции применены (insurance/vehicle_photo/notifications; разрулен конфликт `public_token` через `migrate resolve --applied`). В логах прод-API: BullMQ init, APNs инициализирован, планировщик. `api.sos24.uz`/`admin.sos24.uz` живы. ⚠️ Dockerfile: шаг `pnpm deploy` теперь с ретраями (флаки npm под эмуляцией). Каталог страховых засеян в прод (компания заказчика + 5 продуктов) через port-forward + `prisma/seed-prod-catalog.ts`. Вход в прод-админку: `+998993286330`/`6330`.
>
> **TestFlight — готово к архиву.** Локальный `ios/`: `aps-environment=production`, `CFBundleVersion=4`, bundle `uz.sos24.client`, Team `SRGDG34MV6`, новая иконка. Пользователь архивирует в Xcode сам (НЕ запускать `expo prebuild` — сбросит entitlement/build). Release → `api.sos24.uz`, JS вшит.
>
> **Открытые хвосты:** реальный SMS-OTP (Playmobile; сейчас 6330); платный ключ imagin; Android FCM (`google-services.json` + service-account); прод-каталог — контент/логотип компании дозаполнить в админке.

> **Статус 2026-06-20 — Европротокол: визард шага 2–3 доведён, подпись стороны B = MyID, отдельная страница-детали в админке, PDF quick-view, s3.sos24.uz, dev-client на телефоне.** Ветка `main`.
>
> **Источник госданных скрыт в UI.** Из мобильных строк убрано слово «НАПП»/«NAPP» (конфиденциально — госисточник). Тронуты только UI-тексты; эндпоинты, код модуля, имена файлов — без изменений.
>
> **s3.sos24.uz (MinIO наружу).** A-запись → nginx-ВМ; в nginx проксирование на S3-API MinIO (порт 80, HTTPS-сертификат GTS пользователь ставит сам). Доступ только к S3-API (консоль не публикуем), bucket приватный. Загрузка из мобайла — **presigned POST-policy** (`apps/mobile/src/api/files.ts` → `uploadFileToS3`, фолбэк `POST /files/upload`), чтение/скачивание — presigned GET. Важно: на minio-клиентах явно задан `region='us-east-1'`, иначе region-lookup ломался TLS-ошибкой self-signed.
>
> **Прод-обновление API+admin.** Образы пересобраны и задеплоены (см. ниже про offline-сборку). Хотфикс прод-БД: колонка `public_token` отсутствовала (миграция помечена applied, но ALTER не прошёл из-за обрыва VPN) → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` через `$executeRawUnsafe`.
>
> **Европротокол — шаг 2 (участники).** Сторона A: после MyID (`runMyIdCode()` без аргумента — MyID отклоняет «pinfl без birth_date») показываются авто → действующие ОСАГО; если в профиле нет ВУ — собираем его на шаге 2 (`myDl*`), при submit сохраняем в профиль (`upsertDocument('license')`) → попадает в PDF; адрес A автозаполняется из MyID при step-up. Сторона B: **MyID = подпись** (заменил OTP), `signedBAt` ставится на submit при наличии participantId; зарегистрированный B автозаполняет авто (+vin)/ОСАГО/телефон/адрес/ВУ; незарегистрированный — ручной ввод с валидаторами; адрес B берётся из MyID `participant.address` для **любого** участника (симметрично A). Статус-сообщения «найдено/не найдено» показываются всегда.
>
> **⚠️ Тестовый MyID не отдаёт адрес.** `api.devmyid.uz` для текущих ПИНФЛ возвращает всю ветку `data.profile.address` = `null` (permanent/temporary). Поэтому адрес A и B на тесте пустой — это **отсутствие данных, не баг**; поля редактируемые (ручной фолбэк), на проде с боевым MyID заполнятся автоматически.
>
> **Европротокол — шаг 3 (схема).** Иллюстрации схем (rear/front/side) красят контур в белый при выборе (на тёмной плашке чёрный рисунок был не виден); красный значок удара виден на обоих фонах. Порядок колонок обстоятельств: **Номер → А → Описание → Б**. «ТС может двигаться?» = Нет → местоположение ТС = адрес ДТП с шага 1 (GPS, `s.place`), показывается read-only, отдельно не спрашиваем. Плейсхолдеры переведены на русский, нативный date-picker (`@react-native-community/datetimepicker`).
>
> **Европротокол — детали/PDF.** Админка: отдельная **страница-детали** `europrotocols/[id]` (вместо drawer), блоки «Сторона A» и «Сторона B» симметричны (общий `apps/admin/src/lib/euro.ts`), фикс скролла контента, кнопка скачивания PDF; подпись B подписана «Подпись (MyID)». PDF: штамп подписи B `OTP`→`MyID`; публичная QR-страница проверки `GET /p/:token` (валидна, если обе подписи и статус≠REJECTED). Мобайл `EuroDetailScreen`: PDF открывается **quick-view** (Modal + `react-native-webview`), «Поделиться» — уже из превью.
>
> **Сборка dev-client на телефон (iOS).** bundle id **`uz.sos24.client`** (приложение в App Store/TestFlight создано под ним — НЕ менять). Сборка: `xcodebuild -workspace SOS24.xcworkspace -scheme SOS24 -configuration Debug -destination "id=<UDID>" -allowProvisioningUpdates -allowProvisioningDeviceRegistration build`, установка — `xcrun devicectl device install app --device <UDID> <App>.app`. **Грабли:** Metro надо запускать из `apps/mobile` (`npx expo start --dev-client`), иначе на :8081 поднимается Metro из корня монорепо и валит `UnableToResolveError: ./index`. Точка входа приложения — `.expo/.virtual-metro-entry`. Ещё грабли: несколько зомби-инстансов `pnpm dev:api` держат :3030 и отдают старый код (EADDRINUSE у новых) → при странном «правка не применилась» убить все и поднять один.
>
> **Следующее по Европротоколу:** реальный SMS-OTP (Playmobile) — сейчас прод принимает `6330` для любого телефона; НАПП-пробивка ВУ для незарегистрированного B (сейчас ручной ввод); выкатка симметрии админки A/B на прод (готово локально). Открытый вопрос — куда уходит готовый пакет (страховая / claims / диспетчер).

> **Статус 2026-06-15 — Европротокол доведён до «полного»: генерация PDF бланка, файловое хранилище MinIO, расширенный визард в мобайле.** Ветка `main`.
>
> **PDF бланка «Йўл-транспорт ҳодисаси тўғрисидаги хабарнома» (2 стр.).** Подход — воссоздан в HTML/CSS точь-в-точь
> и печатается headless Chromium (Puppeteer), а не координатным впечатыванием в плоский PDF (старый путь буксовал,
> см. `docs/europrotocol/PDF_FILL.md`). Шаблоны: `apps/api/src/europrotocol/pdfgen/{template.hbs,partyBlock.hbs}`
> + `render.ts` (Handlebars-хелперы, singleton-браузер, типы `EuroPdfData`, 22 обстоятельства). Сборка копирует `.hbs`
> в `dist/src` (`nest-cli.json` assets). Dev-рендер для выверки: `node src/europrotocol/pdfgen/render-dev.mjs [out.pdf] [--blank]`.
> `EuroprotocolPdfService.buildData()` маппит `EuroProtocol`+`User`/MyID+`Vehicle`(+НАПП)+`Document`(ВУ)+`Policy` в шаблон,
> рисует штампы подписей (MyID/A, OTP/B), встраивает схему из MinIO. Эндпоинты: `GET /europrotocol/:id/pdf` (свой),
> `GET /admin/europrotocols/:id/pdf`. В админке — кнопка «↓ PDF извещения» в drawer (`apps/admin/.../europrotocols/page.tsx`).
>
> **MinIO (self-hosted S3).** `docker-compose` сервис `minio` (S3 :9000, консоль :9001, логин `sos24`/`sos24minio`).
> `FilesModule` (@Global) + `MinioService` (ensureBucket, put/get, presigned GET/PUT, remove). Эндпоинт `POST /files/upload`
> (multipart, фото/видео ≤80 МБ → MinIO). Env `MINIO_*` (dev в `.env`; прод — плейсхолдеры в `secret.example.yaml`,
> `minio.<ns>.svc`). Аудит полей бланка ↔ наши данные: `docs/europrotocol/FIELD_MAPPING.md`.
>
> **Схема `EuroProtocol` расширена** (миграция `euro_full_fields`): общая часть (medCheck/witnesses/officialRegistered/
> officerBadgeNo), 22 обстоятельства A/B (Json bool[22]), доп. поля стороны A, ручной ввод стороны B (ВУ/адрес/СК/дата полиса),
> оборот (driverRole/canMove/cannotMovePlace/remarks), schemeImageKey, подписи signedAAt/signedBAt.
>
> **Мобильный визард расширен** (поля в существующие 5 шагов): шаг1 — медосвид./свидетели/ГАИ; шаг2 — ручные поля «В»;
> шаг3 — 22 обстоятельства (чекбоксы А/В) + повреждения/возражения + оборот; шаг4 — **видео** (доп. к фото) + кнопка
> «Пропустить фото (DEV)»; шаг5 — заливка фото/видео в MinIO, **OTP-подпись «В»**, submit со всеми полями.
> `uploadEuroMedia()`/`signOtherParty()` в API-клиенте; `components/EuroFields`; `circumstances.ts` (22 пункта).
> Решения: оборот = 1 экз. (сторона A); подпись «В» = OTP. Submit-фиксы: безопасный парсинг дат (невалид→null),
> dev-mock участник без записи в БД → participantId=null.
>
> **TestFlight (iOS).** Локальная сборка на Mac mini через Xcode Archive (Team **Semurg `SRGDG34MV6`**, bundle `uz.sos24.app`).
> Чинены сборочные пробелы pnpm: `@expo/config-plugins`, `babel-preset-expo` объявлены прямыми dev-зависимостями mobile.
> Имя приложения → **SOS24** (было «mobile»), иконка → брендовый логотип (`assets/icon.png` + AppIcon), build number = 3.
> Нативный сплеш Expo очищен (убран плейсхолдер `SplashScreenLegacy`) → бесшовно в свой JS-сплеш.
>
> **Локальный дев-стек** (одной командой каждый): docker `sos24-db` (:5434) + `sos24-minio` (:9000/:9001);
> `pnpm dev:api` (:3030); `pnpm dev:admin` (:3000); `pnpm dev:mobile` (Metro :8081). `expo run:ios` собирает дев-билд на симулятор.
> Если Docker закрылся — `open -a Docker`, затем `docker compose up -d db minio`.
>
> **Следующее по Европротоколу:** реальный SMS-OTP (Playmobile) вместо dev-кода для подписи «В»; опционально date-picker
> для дат ВУ/полиса (сейчас текст-ввод); конструктор схемы ДТП (сейчас шаблоны rear/front/side); куда уходит готовый пакет
> (страховая/НАПП claims/диспетчер) — открытый вопрос в `FIELD_MAPPING.md`.

> **Статус 2026-06-11 — ПЕРВЫЙ ПРОД-ДЕПЛОЙ API+admin готов и доступен снаружи по HTTPS.** Ветка `main`.
>
> **Инфраструктура (DevOps).** Кластер RKE2 v1.35.5 — **3 ноды, все control-plane,etcd (HA)**:
> `10.10.38.11/12/13` (SSH `ubuntu@`, пароль у пользователя). Namespace **`sos24-dev`**. Insecure-реестр
> `10.10.38.11:30500`. Postgres (PG 18.4, `postgresql-0`, PVC local-path) + Redis уже подняты в кластере.
> Внешний nginx-ВМ `10.10.38.30` (nginx-quic, HTTP/3), белый IP **`146.120.18.70`**, домены
> `api.sos24.uz`/`admin.sos24.uz` (SSL есть). kubeconfig на Mac: `~/.kube/sos24.yaml`.
>
> **Что задеплоено.** Образы `sos24-api`/`sos24-admin` (amd64) в реестре; манифесты `deploy/k8s/`
> (Deployment×2 реплики + NodePort 30030/30035 + migrate-Job); секрет из `apps/api/.env` (БД на
> кластерный Postgres, пароль `%40`-кодирован). nginx проксирует домены в NodePort всех 3 нод
> (`deploy/nginx/live/`). Проверено снаружи: `https://api.sos24.uz/api-docs` 200, `/partners` JSON,
> `https://admin.sos24.uz/login` 200, сертификаты валидны → **iOS ATS ок**.
>
> **Dev-аккаунт в проде (засеян).** `+998993286330` / код `6330` → Азиз Каримов, `MYID_VERIFIED`,
> `role=ADMIN` (вход и в приложение, и в админку), с машинами/полисами/картами/партнёрами.
>
> **Подсказки скрыты на проде.** OTP-хинт в мобайле (`__DEV__`), `devCode` в API (`NODE_ENV`),
> «Dev: …» на логине админки (`NODE_ENV`) + нейтральные плейсхолдеры.
>
> **Нюансы сборки (исправлено).** Dockerfile API: `pnpm deploy --legacy` + `prisma generate` внутри
> `/app` (иначе runtime падал `Cannot find module '.prisma/client/default'`). node1 не имел
> `registries.yaml` → создан по образцу node2 + рестарт rke2. Сборка amd64 на Mac — `--platform linux/amd64`.
>
> **Мобильный API-хост** теперь по окружению (`apps/mobile/src/api/client.ts`): `EXPO_PUBLIC_API_URL` →
> иначе `__DEV__ ? LAN-IP : https://api.sos24.uz`. Release/TestFlight автоматически на прод.
>
> **🔒 Перед публичным запуском (КРИТИЧНО):** SMS-OTP пока нет — на проде код `6330` принимает вход для
> ЛЮБОГО номера и авто-создаёт юзера. Подключить Playmobile + реальную проверку OTP, убрать `DEV_OTP_CODE`.
> Также: prod-ключи MyID (тест-ключи работают только с лицами команды), whitelist IP `146.120.18.70` у НАПП.
>
> Полный runbook — `docs/DEPLOY.md`. Память: `memory/project-deploy-infra.md`.
>
> **Apple / TestFlight (подготовка).** Команда подписи переключена с бесплатной персональной на
> организацию **Semurg Venture Capital, MCHJ** — Team ID **`SRGDG34MV6`** (Organization). Прописано в
> `app.json` → `expo.ios.appleTeamId` (источник истины, пишет DEVELOPMENT_TEAM при `expo prebuild`); bundle
> id `uz.sos24.app`. Память: `memory/project-ios-signing.md`. **Осталось для TestFlight:** App ID
> `uz.sos24.app` в аккаунте Semurg (Xcode создаст при Archive) → App Store Connect создать app →
> `Apple Distribution` сертификат (automatic signing) → Archive → Distribute → Upload → тестировщики.
>
> **Локальный dev-запуск (для теста на телефоне).** БД — docker `sos24-db` (postgres:16, `localhost:5434`,
> `.env`). API: `pnpm dev:api` → `:3030`. Metro: `pnpm dev:mobile` (`expo start --lan`, БЕЗ `CI=1` — иначе
> hot-reload выключен) → `:8081`. Mac с двумя IP (en0 **192.168.13.88**, en1 .89); `DEV_API_HOST` в
> `client.ts` захардкожен на **.88**. На телефоне в Dev Client URL `http://192.168.13.88:8081`. Dev-аккаунт
> `+998993286330` / `6330` засеян и в локальной, и в прод-БД.

---

> **Статус 2026-06-10 (вечер) — S13 Европротокол, основной флоу ГОТОВ end-to-end.** Ветка `main`.
>
> **Мобайл (визард M9.3, модуль `apps/mobile/src/features/europrotocol/`):** вход — Home «Европротокол»
> → список **EuroList** (initialRouteName) → «Оформить» (FAB/кнопка) → **M9.1 EuroStart** (выбор:
> европротокол / инспектор→Аджастер / обычное) → **EuroCheck** (скрининг 5 условий) → **Шаг1**
> (дата/время/кол-во ТС read-only-антифрод + место по GPS) → **Шаг2** (сторона A: шаг-ап MyID + авто из
> гаража; сторона B: MyID-верификация участника + авто по техпаспорту из НАПП + валидация полиса) →
> **Шаг3** (схема-шаблон + описание) → **Шаг4** (фото `expo-image-picker`, только камера, антифрод) →
> **Шаг5** (итог + подтверждение → отправка на бэкенд) → **EuroSuccess** (№) → назад в список.
> **EuroDetail (M10.2)** — статус-герой + вертикальный трекер 5 шагов + детали. `useEuroStore` (Zustand).
>
> **Бэкенд (`apps/api/src/europrotocol/`):** `EuroParticipant` (find-or-create по ПИНФЛ) + `EuroProtocol`
> (статусы SUBMITTED/REVIEW/NEED_INFO/APPROVED/REJECTED/PAID). Эндпоинты: `POST /europrotocol/me/step-up`,
> `participant/verify`, `validate-policy`, `POST /europrotocol` (submit), `GET /europrotocol/mine|:id`,
> admin `GET /admin/europrotocols(+stats,/:id)` `PATCH /admin/europrotocols/:id`. `MyidService.fetchProfileByCode`
> публичный; `NappService.getOsagoPolicyBySeriaNumber` + мок-полис при `NAPP_MOCK_FALLBACK`.
>
> **Админка:** страница `/europrotocols` (KPI + фильтр + таблица + drawer со сменой статуса/примечанием).
>
> **Решения по флоу (зафиксированы):** второй участник = отдельная сущность `EuroParticipant` (не User);
> полис 2-го — ввод серии/номера + валидация НАПП (мок при fallback); авто 2-го — техпаспорт→НАПП; шаг-ап
> инициатора = MyID-лицо каждый раз (сверка ПИНФЛ). **PDF пока НЕ делаем** — только сбор и показ данных.
>
> **Нюансы окружения (важно для теста на устройстве):**
> - API-хост в `apps/mobile/src/api/client.ts` — **ХАРДКОД** `DEV_API_HOST = '192.168.13.88'` (LAN-IP Mac,
>   en0). Менять при смене сети (`ipconfig getifaddr en0`). Телефон+Mac в одной сети.
> - Европротокол — **push-страницы, НЕ модалка** (иначе нативный MyID SDK не презентует экран → зависает).
> - MyID реальный (`MYID_MOCK=false`) — работает только на устройстве с лицами команды; на симуляторе —
>   DEV-кнопки «Симулировать» (локальные). Камера — только на устройстве.
> - `expo-image-picker` добавлен → для камеры на устройстве нужна была пересборка (сделана).
>
> **Дальше (на завтра):** доработки по тесту · PDF-генерация бланка (через `fieldmap`/калибровку) ·
> M9.4 «обычное заявление» · SOS ИИ-чат (`SOS24/screens-sos.jsx`).
>
> _(Предыдущий статус дня: UI-доработки авто/Полисы/Гараж/Профиль; см. коммиты до `8560901`.)_

**Последние завершённые задачи:** S11 MyID Native iOS SDK — нативная интеграция с реальными ключами, тест на iPhone 13 Pro Max (Odya). ProfileScreen + DocumentScreen read-only для верифицированных. Админ-страница `/myid-test` с полными данными MyID.

**Следующий шаг:** обсудить вариант реализации Европротокола (Вариант A MVP vs Вариант B полный) → нужен дизайн → реализация C13.

**Моков в проекте больше нет** — `MOCK_PARTNERS` был последним, убран в S5. Все экраны работают на реальном API.

**MyID хранит полный профиль** — 7 новых типизированных полей на User + `myidRaw JSONB` для полного сырого ответа. Document(PASSPORT) заполняется целиком: issuedAt, issuedBy, expiresAt из MyID.

**Админ-панель (S8) готова и подключена к реальному API.** Dashboard с KPI + графики (Recharts), таблицы полисов и пользователей с поиском/фильтрами/пагинацией. JWT auth через двухшаговую форму (phone → OTP → проверка role=ADMIN). Все данные из `GET /admin/stats`, `GET /admin/users`, `GET /admin/policies`.

```
Дерево запущенных процессов:
  pnpm dev:api          → http://localhost:3030 (NestJS)
  npx next dev :3035    → http://localhost:3035 (Admin Next.js)
  npx expo run:ios      → iPhone 17 симулятор (Mobile)

Вход в админку:
  http://localhost:3035
  +998993286330 / OTP 6330 → role=ADMIN → Dashboard → /adjuster для Аджастера

Важно при рестарте API:
  После любого `prisma migrate deploy` нужно убедиться что `prisma generate` тоже запустился
  (иначе NestJS стартует со старым Prisma-клиентом — новые поля не сохраняются)
```

**MyID верификация реализована (S7).** Обязательный шаг после OTP: нельзя войти в приложение без прохождения MyID. В дев-режиме — мок (`MYID_MOCK=true` + "Симулировать MyID" кнопка в `__DEV__`).

```
Логин (+998993286330 / OTP=6330)
   ├─ НЕ верифицирован → MyIdNavigator → MyIdOnboardingScreen
   │     └─ Пройти MyID (прод: SDK) / Симулировать (дев) → authenticated → Home
   └─ Верифицирован → Home (имя из /me, полисы из /me/policies)
           ├─ Полисы (M8) → /me/policies, /policies/:id → Деталь + QR
           ├─ Гараж (M3) → /me/vehicles + NAPP lookup, GarageEdit → create/update через API
           ├─ Профиль (M2) → /me, /me/documents → Document edit; бейдж «MyID верифицирован»
           └─ Quick action «Страховой полис / Аджастер» →
                   Catalog → ProductDetail → Calc → Checkout → Payment → Success
```

**Текущая ветка:** `main` (смержена с `feat/native-tabs` 2026-05-20).

**Тестовый юзер:** `+998993286330` (Азиз Каримов), OTP всегда `6330`. Сид создаёт 2 авто (Cobalt + Sonata), 2 водителя, паспорт+ВУ (VERIFIED), 2 ACTIVE полиса, кошелёк 500 000, 2 карты, промокод `SOS10` (−10%), 6 партнёров в Ташкенте, полные MyID-поля (nameEn, gender, birthPlace, nationality, address, myidRaw).

**Активные ветки git:**
- `main` — рабочая, совместима с Expo Go. Кастомный bottom tab bar с Liquid Glass (`expo-glass-effect`) + Reanimated pop-анимация + swipe-to-switch. Морф-«капельки» нет.
- `feat/native-tabs` — переход на **нативный** `UITabBarController` (iOS 26 Liquid Glass от Apple). Готова, но **требует dev build** — Expo Go несовместим (см. ниже). Не смержена в main намеренно.

---

## Что сделано

### Этап A — Backend foundation (раньше)
- `docker-compose.yml`: Postgres 16 на `localhost:5434`
- Prisma 6 + миграция `init`: модель `User`
- `AuthModule`: `POST /auth/request-otp`, `POST /auth/verify-otp` (OTP=`6330`), `POST /auth/refresh`
- `UsersModule`: `GET /me`, `PATCH /me/profile`
- Swagger на `/api-docs`, ValidationPipe, CORS, JWT 15м/30д

### Этап B — Mobile foundation (раньше)
- Зависимости: NativeWind v4 + Tailwind 3.4, React Navigation v7, TanStack Query, Zustand, RHF + Zod, axios, AsyncStorage, expo-secure-store, expo-blur, expo-font, expo-linear-gradient, react-native-svg, react-native-qrcode-svg, react-native-reanimated, i18next + react-i18next
- 4 локали (`uz-Latn`, `uz-Cyrl`, `ru`, `en`), ru — основная
- `RootNavigator` переключает AuthStack ↔ MainNavigator
- `api/client.ts` с автоматическим refresh при 401, `authStore` Zustand

### Этап C — Экраны (раньше)
| Блок | Что | Источник |
|---|---|---|
| C0 | UI-кит ~40 примитивов | дизайн |
| C1–C6 | M1 — авторизация | пиксель |
| C7 | Home + Bottom Tab Bar | пиксель |
| C8 | M8 Полисы — список + деталь + QR | пиксель |
| C9 | M4 Каталог + ProductDetail | пиксель |
| C10 | M5 Калькулятор 4 шага | пиксель |
| C11 | M6 Чекаут → M7 Оплата → Успех → MyCards | пиксель |
| C12 | M2 Профиль + Редактор + Documents, M3 Гараж + Add | спецификация |

### Этап D — Дизайн-обновление 2026-05-20
Дизайнер обновил эталоны (`SOS24/`). Перенесено в код:
- **Home плитки 2×2 пересобраны:** Страховой полис / Аджастер / Партнёры / Европротокол + новые Lucide-style иконки в `QuickActionIcons.tsx`
- **SosBanner новый текст:** «SOS — экстренная помощь» / «ДТП, мед. помощь, угон — поможем разобраться»
- **Глобальный ребрендинг «комиссар» → «инспектор»** (4 i18n локали + IllusOnboardingHelp + CatalogScreen + ProductDetailScreen)
- **Catalog: 5 продуктов** (добавлены Здоровье, Дом и имущество, Финансовая защита) + контент ProductDetail для них (covers/exceptions/steps/FAQ в стиле бренда)
- Для не-авто продуктов CTA «Рассчитать» сразу ведёт в Checkout (фикс-цена, без калькулятора авто)
- Поле промокода в Checkout (`SOS10` → −10%)
- `WalletPayOption` компонент — кошелёк SOS24 с балансом, sufficient/insufficient

### Этап E — Liquid Glass + UI-улучшения 2026-05-20
- **`expo-glass-effect`** для iOS 26 Liquid Glass: `GlassPill`, `IconButton`, `PartnerCard`, `ActionTile (light)` переведены с BlurView. На iOS<26 / Android — фоллбэк BlurView из самого пакета. `borderRadius`+`overflow:hidden` на самом GlassView (иначе обрезается родителем)
- **Floating TopBar** на Home: `position:absolute`, контент скроллится под ним
- **Fade-overlay сверху и снизу** на Home: `pageBg α=0 → pageBg α=1` (важно — не `transparent`, иначе будет грязный серый интерполяционный)
- **PhoneFrame пропсы** `topSafeArea` / `bottomSafeArea` — для fullbleed экранов
- **Клавиатура:** PhoneScreen сдвигает heading-блок при kbOpen; ProfileSetup/ProfileEdit/Document/GarageEdit получили `keyboardShouldPersistTaps="handled"` + `automaticallyAdjustKeyboardInsets`

### Эксперимент: @expo/ui SwiftUI glass-кнопки (отклонён)
Попробовали заменить `RedButton`/`OutlineButton` на AuthChoose на `<Button buttonStyle('glassProminent')>` через `@expo/ui/swift-ui`. **Не подошло:** SwiftUI glass Button hugging по контенту, `frame({width,height})` не растягивает. Откатили, оставили `RedButton`/`OutlineButton`. `@expo/ui` остался в зависимостях для будущих use-case (DatePicker, Menu, inline-pills). Память: `[[feedback-expo-ui-glass-button-fixed-size]]`.

### Этап D-2 — Backend для остального (2026-05-20)
**8 новых модулей, ~30 endpoints, 4 миграции, seed.**

**S1 — Vehicles + NAPP mock:**
- `Vehicle` (User 1:N, unique [userId,plate])
- `VehiclesModule`: `GET/POST/PATCH/DELETE /me/vehicles` + `GET /me/vehicles/:id`
- `NappModule`: `POST /napp/provider/osago/vehicle` — мок в **реальном формате НАПП**
  (см. ниже «NAPP mock → формат NAPP» 2026-06-04)

### NAPP mock приведён к реальному формату (2026-06-04)
Мок поиска авто переведён со старого `GET /napp/vehicle/:plate` на структуру реального
НАПП-эндпоинта `POST /api/provider/osago/vehicle` — чтобы при подключении реального НАПП
заменить только внутренности, не трогая контракт.
- **Запрос:** `{ techPassportSeria, techPassportNumber, govNumber }` (`ProviderVehicleDto`)
- **Ответ:** конверт `{ error, error_message, result }` с `TechPassportInfo` (20 полей:
  modelName, issueYear, vehicleTypeId, bodyNumber, engineNumber, horsePowers, vehicleColor,
  fullWeight, fuelType, seats, owner, pinfl, division и т.д.)
- Тестовый кейс «не найдено»: `techPassportNumber = "0000000"` → `error: 1`
- Mobile `vehicles.ts`: `TechPassportInfo`, `NappEnvelope<T>`, `lookupVehicleByTechPassport()`,
  хелпер `mapTechPassportToForm()` (парсит `modelName` → марка + модель)
- `GarageEditScreen`: добавлены поля «Серия техпаспорта» + «Номер техпаспорта»;
  кнопка «Найти» активна когда заполнены госномер + серия + номер ТП;
  объём двигателя НАПП не отдаёт — вводится вручную
- Модель `Vehicle` в БД не менялась (маппинг на существующие brand/model/year/power/vin/color)

**S2 — Documents:**
- `Document` enum `PASSPORT`/`DRIVER_LICENSE`, unique [userId,kind]
- `DocumentsModule`: `GET /me/documents`, `GET/PUT /me/documents/:kind` (upsert)
- Валидация: PINFL обязателен для паспорта (400)

**S3 — Policies + Drivers + Promo:**
- `Policy` (5 ProductType, статусы DRAFT→PENDING_PAYMENT→ACTIVE→EXPIRED/CANCELLED)
- `Driver` — **отдельная сущность** для доверенности (один юзер может вписать в полис нескольких водителей, в т.ч. чужих по ФИО+ВУ без аккаунта)
- `PolicyDriver` M:N
- `Promo` (code unique, discountPct, validFrom/Until, maxUses)
- `DriversModule` CRUD `/me/drivers`
- `PromoModule`: `POST /promo/validate` (404 если истёк/исчерпан/неактивен)
- `PoliciesModule`: `POST /policies/calculate` (коэф-ты для ОСАГО/КАСКО, фикс для health/home/finance), `POST /policies` (создаёт DRAFT), `GET /me/policies`, `GET /policies/:id`
- `pricing.ts`: BASE_PRICE + коэф-ты периода (12=1.0, 6=0.55, 3=0.32), территории (Ташкент 1.15), стажа (8лет 0.95), лимита водителей (LIMITED 0.9, UNLIMITED 1.25)

**S4 — Cards + Wallet + Payments mock:**
- `Card` (token mock-Uzcard tokenization, brand UZCARD/HUMO/VISA/MC, last4, expiry, isDefault, **balance** — mock)
- `Wallet` (1:1 user, balance), `WalletTransaction` (TOPUP/PAYMENT/REFUND/BONUS)
- `Payment` (status PENDING/SUCCESS/FAILED/REFUNDED, method WALLET/CARD/**PAYME/CLICK**)
- `CardsModule`, `WalletModule`, `PaymentsModule`
- `POST /payments/uzcard` — **mock-Uzcard**: 1.5с задержка, **90% success / 10% random fail**. При SUCCESS списывает с кошелька (если method=WALLET) и активирует полис через `PoliciesService.activate` (генерация policyNumber + qrPayload)

**Сид (`prisma/seed.ts`, `pnpm --filter api exec prisma db seed`):**
- Пользователь `+998993286330` (Азиз Каримов Эркинович, родился 1990-05-14)
- 2 авто: Chevrolet Cobalt `01 A 123 BB` 2021, Hyundai Sonata `10 R 555 AC` 2019
- Документы VERIFIED: паспорт AA 4587213 + ВУ AB 2345678 (категории B,C)
- 2 водителя: сам + жена (Каримова М.Х., 4 года стажа, по доверенности)
- 2 ACTIVE полиса: КАСКО Cobalt (№ 1225 7821 3344) + ОСАГО Sonata (№ 1224 5566 7788)
- Промо `SOS10` (10% до 2026-12-31)
- Кошелёк 500 000 сум + 2 карты (Uzcard 4582 default + Humo 1190)

### Этап S7 — MyID верификация (2026-05-21)

Обязательная идентификация через государственную систему MyID. Без неё пользователь не может пользоваться приложением в проде.

**Бэкенд (`apps/api`):**
- Prisma: `pinfl String? @unique`, `verificationStatus VerificationStatus` (`NOT_VERIFIED`/`MYID_VERIFIED`) в `User`
- Миграция `20260521120000_add_myid_verification`
- `MyidModule`: `POST /myid/session` (создаёт MyID-сессию) + `POST /myid/verify` (принимает code → получает данные из MyID → обновляет User + upsert Document(PASSPORT))
- `MYID_MOCK=true` в `.env` → детерминированные мок-данные (ПИНФЛ 12345678901234, Каримов Азиз Эркинович)
- При `MYID_MOCK=false`: реальные запросы к MyID API (`/api/v1/auth/clients/access-token` → `/api/v1/sdk/data?code=`)
- `auth/verify-otp` теперь возвращает `verificationStatus` в ответе

**Мобильный (`apps/mobile`):**
- `authStore`: новый статус `needs_verification`; `setVerified()` → `authenticated`; `hydrate()` читает `verificationStatus` из MMKV (без сетевого запроса при старте)
- `MyIdNavigator` + `MyIdOnboardingScreen`: кнопка «Пройти MyID» + TODO-заглушка для реального SDK; `__DEV__` — кнопка «Симулировать MyID (DEV)»
- `RootNavigator`: `needs_verification` → `MyIdNavigator` (навигация автоматически без `nav.navigate`)
- `OtpScreen`: упрощён — `setSession(tokens, sub, verificationStatus)`, навигация через RootNavigator
- `ProfileScreen`: бейдж «MyID верифицирован» + скрыта кнопка редактирования для верифицированных

**Когда придут ключи MyID:**
1. `MYID_MOCK=false` в `apps/api/.env`
2. Установить `myid-rn-sdk` (закрытый GitLab) + написать Expo Config Plugin
3. Заменить TODO в `MyIdOnboardingScreen.startMyId()` на `MyIdClient.start()`

### Этап S8 — Admin Panel (2026-05-21)

Веб-админка страховой компании на реальных данных из API.

**Бэкенд (`apps/api`):**
- `UserRole` enum (`USER` / `ADMIN`) добавлен в Prisma schema + миграция `20260521130000_add_user_role`
- Сид: тестовый юзер `+998993286330` получил `role: ADMIN` + `verificationStatus: MYID_VERIFIED`
- `JwtPayload` расширен полем `role`; `issueTokens` принимает `role`, пишет в токен
- `POST /auth/admin/login` — проверяет OTP **и** `user.role === ADMIN`; возвращает JWT + role
- `AdminGuard` (`apps/api/src/admin/admin.guard.ts`) — чтение `request.user.role === 'ADMIN'` без запроса в БД
- `AdminModule` (`apps/api/src/admin/`) — `AdminService` + `AdminController`, закрыт `JwtAuthGuard + AdminGuard`:
  - `GET /admin/stats` — 12 параллельных запросов: KPI (totalPolicies, activePolicies, pendingPolicies, totalUsers, verifiedUsers, revenue), recentPolicies/Users (10 шт.), trend (30 дней → `{date,osago,kasko}[]`), typeDistribution (ACTIVE полисы по типу)
  - `GET /admin/users?page&limit&search&verified` — пагинация, поиск по phone/name/surname
  - `GET /admin/policies?page&limit&search&type&status` — пагинация, поиск по номеру/держателю/номеру авто

**Фронтенд (`apps/admin/`):**
- Next.js 15 + Tailwind v4 + Recharts + lucide-react + Inter (Google Fonts)
- **Auth:** `app/login/page.tsx` — двухшаговая форма phone → OTP, `sos24_admin_token` в `localStorage`
- **Layout:** тёмный сайдбар `#111` с красным (#e61428) индикатором активного пункта; белый Header; route group `(dashboard)`
- **Dashboard:** KpiCard ×4 (полисы, активные, пользователи, ожидают оплаты), TrendChart (AreaChart, ОСАГО/КАСКО за 30 дней), TypeDonut (PieChart donut + легенда), таблицы последних полисов/пользователей со ссылками «Все →»
- **Users page:** таблица (avatar-инициалы, телефон, статус верификации, кол-во полисов, роль, дата), поиск + фильтр верификации + пагинация
- **Policies page:** таблица (тип+иконка+номер, держатель, авто, период, премия, статус), поиск + фильтр типа + фильтр статуса + пагинация
- Все страницы `'use client'` + TanStack Query (JWT из localStorage → Bearer в axios interceptor)
- Skeleton-лоудеры на всех блоках

**Фиксы в рамках S8:**
- `myid.controller.ts`: `@CurrentUser() userId: string` → `@CurrentUser() user: JwtPayload` + `user.sub` (декоратор возвращает объект, не строку)
- `PoliciesListScreen.tsx` + `PolicyDetailScreen.tsx`: `formatDate` — `iso.slice(0, 10).split('-')` (API возвращает полный ISO `2026-01-15T00:00:00.000Z`, без `.slice` `d` становился `"15T00:00:00.000Z"`)

### S5 — Partners (2026-05-21)

Последний мок в проекте (`MOCK_PARTNERS`) заменён реальным API.

**Бэкенд:**
- `PartnerType` enum: `STO` / `CLINIC` / `TOWING`
- `Partner` модель: id, name, type, address, phone?, rating (Float), isOpen, city, lat?, lng?
- Миграция `20260521150000_add_partners`
- `PartnersModule`: `GET /partners?type=&city=` — публичный (без JWT), сортировка по рейтингу
- Seed: 6 партнёров Ташкента (3×STO, 2×CLINIC, 1×TOWING)

**Мобильный:**
- `apps/mobile/src/api/partners.ts` — `Partner` тип + `usePartners(type?, city?)` хук
- `HomeScreen`: убран `MOCK_PARTNERS`, карточки рендерятся из `usePartners()`
- `PARTNER_TYPE_LABEL`: `STO→'СТО'`, `CLINIC→'Клиника'`, `TOWING→'Эвакуатор'`

### ProfileEditScreen — реальный API + readonly при MyID (2026-05-21)

**Мобильный (`apps/mobile/src/features/profile/screens/ProfileEditScreen.tsx`):**
- Данные из `useMe()` вместо `MOCK_USER` (убрана зависимость от `mockProfile.ts`)
- Сохранение через `useUpdateProfile()` → `PATCH /me/profile`
- При `MYID_VERIFIED`: поля имя/фамилия/отчество/дата рождения → `editable={false}` + `opacity: 0.5`
- Зелёный баннер «Данные подтверждены MyID» с объяснением блокировки
- Кнопка меняется на «Закрыть» (`nav.goBack()`) для верифицированных
- Убрано несуществующее поле `address` (нет в модели User — хранится через MyID flow)

### MyID — расширенное хранилище данных (2026-05-21)

По документации MyID v2 (`GET /api/v1/sdk/data`) API возвращает гораздо больше полей чем хранилось ранее. Изучена полная структура ответа `UserDataResponse.data.profile.*`.

**Бэкенд (`apps/api`):**
- 7 новых typed-полей на `User`: `nameEn`, `surnameEn`, `gender`, `birthPlace`, `nationality`, `citizenship`, `address`
- `myidRaw Json?` — полный сырой ответ MyID API (для аудита, `comparison_value`, `reuid`, справочники ЦБ)
- Миграция `20260521160000_user_myid_fields` (`ALTER TABLE users ADD COLUMN ...`)
- `MyIdUserData` interface расширен: passportIssuedAt/By/ExpiresAt, nameEn, surnameEn, gender, birthPlace, nationality, citizenship, permanentAddress, comparisonValue, jobId, raw
- `applyVerification`: теперь записывает все новые поля + Document.issuedAt/issuedBy/expiresAt заполняются из MyID (ранее issuedAt было захардкожено `new Date('2020-01-01')`)
- `fetchUserData`: поддерживает вложенный v2 (`profile.common_data.*`) и плоский v1 (старый формат)
- `MOCK_USER_DATA`: дополнен всеми новыми полями
- Seed: тестовый юзер содержит полные MyID-поля

**Мобильный:**
- `MeResponse` в `apps/mobile/src/api/auth.ts`: +nameEn, surnameEn, gender, birthPlace, nationality, citizenship, address

**Что хранится из MyID и зачем:**
| Поле | Источник | Зачем |
|---|---|---|
| `nameEn` / `surnameEn` | `first_name_en` / `last_name_en` | Green Card, международные полисы |
| `gender` | `common_data.gender` | Тарифы страхования здоровья |
| `birthPlace` | `common_data.birth_place` | Обязательно в договоре полиса |
| `nationality` / `citizenship` | `common_data.nationality/citizenship` | Страховые условия |
| `address` | `address.permanent_address` | Страхование жилья, адрес в договоре |
| `myidRaw` | весь ответ API | Аудит, `comparison_value` (liveness), `reuid`, справочники ЦБ |
| `Document.issuedAt/By/expiresAt` | `doc_data.issued_date/by/expiry_date` | Валидность паспорта в договоре |

### S9 — Аджастер (полный модуль) 2026-05-28

Вызов аварийного комиссара: подача заявки, отслеживание статуса, назначение аджастера из админки.

#### Бэкенд (`apps/api`)

**Prisma / БД:**
- `UserRole` enum расширен: добавлен `ADJUSTER` (было USER/ADMIN)
- Новая модель `AdjusterRequest`:
  - Статусы: `NEW → ACCEPTED → EN_ROUTE → COMPLETED / CANCELLED`
  - Типы инцидентов: `ACCIDENT / DAMAGE / THEFT`
  - Поля: `userId`, `policyId?`, `address`, `lat?`, `lng?`, `comment?`, `adjusterNote?`
  - Назначение системного аджастера: `assignedAdjusterId` (FK → User с ролью ADJUSTER)
  - Назначение одноразового аджастера: `adjusterName?`, `adjusterPhone?`
  - Именованные Prisma-отношения: `@relation("RequestOwner")` и `@relation("AssignedAdjuster")` — два FK на одну таблицу User
- Миграции: `20260528000000_add_adjuster_requests`, `20260528000001_adjuster_note`, `20260528000002_adjuster_assignment`
- `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADJUSTER'` — безопасное добавление в существующий enum PostgreSQL

**Сервис:**
- `enrichItems()` — standalone async функция для batch-обогащения заявок: загружает полисы (для Policy display) и назначенных аджастеров одним запросом
- Вычисляет `adjusterDisplayName` и `adjusterDisplayPhone`:
  - Если назначен системный аджастер → берёт из User (surname + name + phone)
  - Иначе → берёт из полей `adjusterName` / `adjusterPhone`
- `findByUser(userId)` — заявки текущего пользователя, enriched
- `findAll(status?, page, limit)` — все заявки с пагинацией, enriched
- `updateStatus(id, dto)` — обновляет статус + опционально назначает аджастера (системного или ручного)
- `findAdjusterUsers()` — список пользователей с role=ADJUSTER
- `createAdjusterUser(dto)` — создаёт нового или апгрейдит существующего пользователя до ADJUSTER

**Эндпоинты:**
- `POST /adjuster` — создать заявку (мобиль)
- `GET /me/adjuster` — история заявок текущего пользователя (мобиль)
- `GET /admin/adjuster/stats` — KPI: new/inProgress/completedToday/cancelledToday
- `GET /admin/adjuster?status=&page=&limit=` — все заявки с фильтрацией
- `PATCH /admin/adjuster/:id` — обновить статус + назначить аджастера
- `GET /admin/adjusters` — список аджастеров-пользователей
- `POST /admin/adjusters` — добавить/апгрейдить аджастера

**Важный баг и решение:** После `prisma migrate deploy` нужно запустить `prisma generate`, иначе NestJS поднимается со старым Prisma-клиентом и молча игнорирует новые поля при update. Перезапуск `pnpm dev:api` исправляет.

#### Мобильное приложение (`apps/mobile`)

**API-слой** (`apps/mobile/src/api/adjuster.ts`):
- Типы: `AdjusterRequest`, `AdjusterStatus`, `IncidentType`, `CreateAdjusterDto`
- Хуки: `useMyAdjusterRequests()`, `useActiveAdjusterRequest()` (с `refetchInterval: 15_000`, select активной), `useAdjusterRequest(id)`, `useCreateAdjusterRequest()`

**Навигация** (`apps/mobile/src/navigation/types.ts`):
- `AdjusterStackParamList`: `AdjusterRequest`, `AdjusterSent { requestId }`, `AdjusterStatus { requestId }`
- `MainStackParamList.Adjuster` поддерживает вложенный `{ screen, params }` для прямого перехода на статус-экран

**Экраны** (`apps/mobile/src/features/adjuster/screens/`):
- `AdjusterRequestScreen` — форма: тип инцидента (3 кнопки), адрес + GPS-кнопка (`expo-location`), комментарий, выбор полиса
- `AdjusterSentScreen` — подтверждение отправки, ожидание назначения аджастера
- `AdjusterStatusScreen` — полный экран статуса:
  - Карточка текущего статуса (пульсирующая точка)
  - Timeline прогресса (4 шага: NEW→ACCEPTED→EN_ROUTE→COMPLETED) с анимацией
  - Карточка назначенного аджастера (жёлтый стиль) — отображается при `adjusterDisplayName != null`
  - Карточка диспетчера SOS24 (всегда видна)
  - Кнопки: «Позвонить аджастеру» (primary, красная) + «Позвонить диспетчеру» (outline) + «На главную»
  - **UX-фикс кнопок (2026-05-28):** `LinearGradient` fade (прозрачный → pageBg) над кнопочной зоной + сплошной фон `tokens.pageBg` под кнопками. `paddingBottom` скролла увеличен с 140 до 260px (для 3 кнопок × 52px + gap + padding)

**Компоненты** (`apps/mobile/src/components/ui/`):
- `AdjusterActiveBanner` — баннер на HomeScreen для активной заявки. Пульсирующая точка (анимация). Подзаголовок: имя+телефон аджастера (если назначен) или адрес

**HomeScreen** (`apps/mobile/src/features/main/screens/HomeScreen.tsx`):
- `useActiveAdjusterRequest()` — подписка на активную заявку
- `AdjusterActiveBanner` между приветствием и полисами
- Умная навигация по тайлу «Аджастер»: есть активная заявка → `AdjusterStatus`, нет → `AdjusterRequest`
- Тайл «Аджастер» показывает активную точку (`activeDot`) и подпись текущего статуса (`sublabel`) когда заявка активна

#### Админ-панель (`apps/admin`)

**Страница** (`apps/admin/src/app/(dashboard)/adjuster/`):
- `page.tsx` — основная страница:
  - KPI-чипсы: ожидают / в работе / завершено сегодня / отменено
  - Переключатель «Таблица / Карта»
  - Таблица заявок с колонками: Клиент, Инцидент, Адрес, Полис, Статус, **Аджастер**, Действие, Дата
  - Колонка «Аджастер» — имя + телефон (с кнопкой звонка) если назначен
  - Колонка «Полис» — `POLICY_TYPE_LABEL[type]` + госномер (не UUID)
  - Колонка «Дата» — дата + elapsed time (время с момента создания, красным для NEW)
  - Строка NEW — синяя левая граница
  - Клик по строке → открывает `AdjusterDetailDrawer`
  - Кнопка «Принята» → открывает `AcceptModal` (AssignModal)
  - После назначения → `setSelectedItem(updated)` → drawer открывается автоматически с данными аджастера
  - Polling через `refetchInterval: 30_000`

- `AdjusterDetailDrawer.tsx` — боковой drawer:
  - Клиент (аватар, имя, телефон, кнопка звонка)
  - Инцидент (тип, адрес, GPS-ссылка на Google Maps, комментарий, информация о полисе)
  - Назначенный аджастер (жёлтая карточка с инициалами, имя, телефон, кнопка звонка) — если есть
  - Информация (ID заявки, дата создания)
  - Кнопки смены статуса: ACCEPTED/EN_ROUTE/COMPLETED/CANCELLED

- `AcceptModal.tsx` — модал назначения аджастера:
  - Два режима: «Из системы» (выбор из списка пользователей с role=ADJUSTER) + «Вручную» (разовый, ФИО + телефон)
  - Возможность добавить нового аджастера прямо в модале (POST /admin/adjusters)
  - Поле «Примечание диспетчера» (общее для обоих режимов)

- `MapView.tsx` — карта Leaflet (react-leaflet v5):
  - OpenStreetMap тайлы
  - Маркеры цветом по статусу: синий=NEW, жёлтый=ACCEPTED/EN_ROUTE
  - `divIcon` кастомные маркеры
  - Dynamic import с `ssr: false` (Next.js + Leaflet несовместимы с SSR)
  - Центр по умолчанию: Ташкент (41.2995, 69.2401)

**Хуки** (`apps/admin/src/lib/admin-hooks.ts`):
- `useAdjusterStats()` — KPI
- `useAdjusterRequests(status, page, limit)` — список заявок
- `useUpdateAdjusterStatus()` — мутация PATCH (статус + назначение аджастера)
- `useAdjusterUsers()` — список пользователей-аджастеров
- `useCreateAdjusterUser()` — создать аджастера

#### Текущие данные в БД

```
Тестовые заявки: 3 штуки у пользователя +998993286330 (роль ADMIN, он же создавал)
 - одна NEW (для теста полного флоу назначения)
 - две COMPLETED

Тестовые пользователи:
 - +998993286330  role=ADMIN (Азиз Каримов) — основной тестовый аккаунт
 - +998901234567  role=USER — дополнительный

Аджастеров в системе нет — создаются через POST /admin/adjusters или через AcceptModal
```

---

### Этап F — Mobile integration (S6) 2026-05-20
**API-слой полностью:** `apps/mobile/src/api/` — types.ts + 9 domain-файлов (auth, vehicles, documents, drivers, policies, promo, cards, wallet, payments). Каждый файл содержит TypeScript-типы, функции-обёртки axios и React Query хуки (useX / useCreateX / ... ) в одном месте.

**Интеграция в экранах:**
| Экран | API |
|---|---|
| Home | `useMe` (имя), `usePolicies('ACTIVE')` (карточки полисов) |
| GarageList | `useVehicles` |
| Profile | `useMe`, `useDocuments` (статусы паспорта+ВУ) |
| Document edit | `useDocument(kind)`, `useUpsertDocument(kind)` |
| CalcVehicle | `useVehicles` + auto-select first |
| CalcDrivers | `useDrivers` + auto-select all при LIMITED |
| Checkout | `useValidatePromo` (промокод server-side), `useCreatePolicy` (создаёт draft + сохраняет `draftPolicyId` в store) |
| Payment | `usePolicy(draftPolicyId)` (точная totalPrice), `useWallet` (real balance), `useCards`, `usePayPolicy` (mock Uzcard) |
| Success | `usePolicy(draftPolicyId)` — реальный policyNumber + qrPayload + vehicle |

**Маппинг enum** lowercase mobile ↔ UPPERCASE API в `CheckoutScreen` (TYPE_TO_API), `PaymentScreen` (BRAND_MAP), `Document/ProfileScreen` (statusFromApi).

### Прочие фиксы 2026-05-20
- **JWT TTL .env**: `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=30d` (не `900`/`2592000` — jsonwebtoken-гетча). Память: `[[reference-jwt-ttl-format]]`.
- **SDK 54 → 55** (RN 0.83.6, react 19.2) — был нужен для `@expo/ui`, оставили после эксперимента
- **`react-native-screens` 4.25.1** пин поверх SDK 55 default 4.23 — нужно для нативного `createNativeBottomTabNavigator`
- **Xcode 26.5** на Mac mini M4 — native tab bar (`UITabBarController`) с iOS 26 Liquid Glass через ветку `feat/native-tabs`. main-ветка с Expo Go — устаревший fallback

### Пакет фиксов после тестов на Expo Go (2026-05-18 — 2026-05-20)
- **Prisma postinstall** — `apps/api/package.json` получил `postinstall: prisma generate`, иначе на свежем clone типы `@prisma/client` пустые.
- **NativeWind JSX-wrapper отключён** — `jsxImportSource: 'nativewind'` и `nativewind/babel` убраны из `babel.config.js`. Wrapper ломал inline-`style` функции на `Pressable` в Expo Go iOS (контейнер-стили не применялись). `className` в проекте нигде не используется — потерь нет; Tailwind-токены остаются справочником в `tailwind.config.js` / `theme/colors.ts`.
- **Expo `--lan` режим** — скрипты `lan` / `lan:clear` / `localhost` / `tunnel` в `apps/mobile/package.json`. Metro биндится к LAN-IP, не 127.0.0.1.
- **Клавиатура** — `DismissKeyboardView` (тап вне поля закрывает) + `useKeyboardHeight` (bottom-кнопка поднимается над клавиатурой) на всех формах: Phone, ProfileSetup, ProfileEdit, Document, GarageEdit.
- **Home quick-actions** — навигация «Оформить ОСАГО/КАСКО» / AddPolicyTile была потеряна, восстановлена через `getParent()` (Purchase route на уровне MainStack).
- **Reanimated 4** — babel-плагин `react-native-reanimated/plugin` → `react-native-worklets/plugin` (Reanimated 4 вынес worklets в отдельный пакет `react-native-worklets`). Без этого — краш `Exception in HostFunction: NativeWorklets`.
- **Liquid Glass на bottom tab bar** — добавлен `expo-glass-effect`. На `main` — кастомный бар с `GlassView` (iOS 26+) / `BlurView` fallback. Морф-«капелька» как в App Store **не получилась** на кастомных GlassView (merge считается по layout-bounds, не transform) → решено перейти на нативный таб-бар (ветка `feat/native-tabs`).

### Ветка `feat/native-tabs` — нативный iOS tab bar
Решение (с согласия дизайнера): отказаться от кастомной плавающей капсулы в пользу **родного `UITabBarController`** — на iOS 26 он сам даёт Liquid Glass + морфинг от Apple.
- `react-native-screens` 4.16 → **4.25.1** (требование native bottom tabs)
- `MainNavigator` → `createNativeBottomTabNavigator` из `@react-navigation/bottom-tabs/unstable`
- Иконки — SF Symbols (`house`/`shield`/`car`/`person`)
- Кастомный `BottomTabBar.tsx` удалён
- `eas.json` с профилем `development`
- **Expo Go несовместим** — после апгрейда `react-native-screens` нужен dev build. Поэтому ветка отдельная, в `main` не мержена.
- TODO: SF Symbols на Android не рендерятся — нужны PNG-иконки табов.

### Подход к нативности — «гибрид точечно» (зафиксировано 2026-05-20)
Кастомный дизайн SOS24 остаётся на RN. Нативные компоненты — **только точечно**, где они объективно лучше и не конфликтуют с брендом. Roadmap:
- **H1 — нативный date picker** (`@react-native-community/datetimepicker`) — даты рождения/выдачи/периода. Сейчас текстовый ввод `ГГГГ-ММ-ДД`.
- **H2 — haptics** (`expo-haptics`) — отклик при свайпе табов, успехе оплаты, ошибке OTP.
- **H3 — нативный bottom sheet** — выбор языка/темы в Профиле.
- **H4 — context menu** — long-press на полисе/карточке.
Полный SwiftUI-переход через `@expo/ui` отклонён — потеря кастомного дизайна + alpha-статус.

### S11 — MyID Native iOS SDK (реальная интеграция) 2026-06-02 ✅ DONE

Полная замена мок-режима — нативный `MyIdSDK 3.1.3` подключён и протестирован на устройстве.

**Тест-ключи (dev-среда `api.devmyid.uz`):**
- `client_id` = `semurg_venture_capital_sdk-UYh1Z8mQa8HOhVzKdba1Tz02UmMPXZ5nWKLfJUxL`
- `client_hash_id` = `256c429d-a5cb-49fd-b961-7e93563c64ae`
- `client_hash` — RSA public key (в `apps/api/.env`)
- Ключи работают только с лицами сотрудников команды — для продакшена нужны prod-ключи от MyID

**Пакет `packages/myid-sdk/`:**
- `ios/MyIdSdkModule.swift` — Swift-мост: `@objc(MyIdSdkModule)` + `MyIdDelegateHandler` (NSObject conforming MyIdClientDelegate)
- `myid-sdk.podspec` — зависит от `ExpoModulesCore` + `MyIdSDK ~> 3.1.3`
- `src/index.ts` — TS-обёртка через `NativeModules.MyIdSdkModule`

**Config Plugin `apps/mobile/plugins/withMyIdSdk.js`:**
- Пишет `MyIdSdkModule.swift` + `MyIdSdkModule.m` в `ios/mobile/`
- Добавляет оба файла в `project.pbxproj` через `withXcodeProject`
- Добавляет `pod 'MyIdSDK', '~> 3.1.3'` в Podfile
- Добавлен в `app.json` plugins

**Backend:**
- `MYID_MOCK=false`, `MYID_BASE_URL=https://api.devmyid.uz`
- `POST /myid/session` теперь возвращает `{ sessionId, clientHash, clientHashId, environment }` — мобильному приложению не нужно хранить ключи в JS-бандле
- Опциональный `pinfl` в теле запроса — если передан, SDK пропускает экран ввода паспорта

**Мобильный MyID флоу (реальный):**
1. `POST /myid/session` → бэкенд создаёт сессию в `api.devmyid.uz`, возвращает sessionId + SDK-конфиг
2. Нативный SDK запускается: экран ввода ПИНФЛ или серии паспорта → face capture (liveness)
3. SDK возвращает `code` (TTL 5 мин, одноразовый)
4. `POST /myid/verify` → бэкенд получает полный профиль из MyID, сохраняет в БД
5. Пользователь переходит на Home

**Важные нюансы интеграции:**
- `RCTPromiseResolveBlock` / `RCTPromiseRejectBlock` нужны в bridging header: `#import <React/RCTBridgeModule.h>` добавлен в `mobile-Bridging-Header.h`
- `result.code` и `exception.message` в SDK 3.1.3 — **non-optional** String (без `??`)
- `gender` приходит как `"1"` (мужской) / `"2"` (женский) — не `"M"`/`"F"`
- `nameEn` может быть пустой строкой `""` — обрабатывается как null
- Автолинкинг Expo не находит `packages/myid-sdk` через pnpm symlinks → Swift/ObjC кладутся напрямую в `ios/mobile/` через Config Plugin

**Сборка на устройство:**
```bash
cd apps/mobile
npx expo prebuild --platform ios --no-install
cd ios && pod install && cd ..
npx expo run:ios --device "00008110-00026DA60AA1401E"   # iPhone 13 Pro Max (Odya.uz)
```

**ProfileScreen — секция «Личные данные (MyID)»:**
Появляется только у верифицированных. Показывает ПИНФЛ, пол, место рождения, национальность, гражданство, адрес прописки, имя латиницей. Все поля read-only.

**DocumentScreen — Паспорт read-only:**
При `verificationStatus === MYID_VERIFIED`: все поля заблокированы (`editable={false}`, opacity 0.55), кнопка «Закрыть», зелёный баннер «Данные подтверждены MyID». Загрузка фото скрыта. ВУ — всегда редактируемое.

**Admin — страница `/myid-test`:**
- `GET /admin/users/myid-verified` — список верифицированных (сейчас 4 реальных пользователя в БД)
- `GET /admin/users/:id/myid` — полные MyID-поля: профиль, паспорт, `myidRaw` (сырой JSON от API)
- Страница `/myid-test` в сайдбаре (иконка Fingerprint): список слева, детали справа + кнопка «Показать myidRaw»

---

### S10 — Финансы (Finance-экран + карты с балансом + Payme/Click) 2026-05-28 ✅ DONE

**Бэкенд:**
- Миграция `add_card_balance_payme_click`: поле `Card.balance Int @default(5000000)` + `PAYME`/`CLICK` в enum `PaymentMethod`
- `CardsService`: `create()` — рандомный mock-баланс 2M–8M сум; `setDefault()` — смена основной карты; `debitBalance()` — списание при оплате
- `PATCH /me/cards/:id/set-default` — новый endpoint
- `PaymentsService.payForPolicy()` — для CARD: проверяет `card.balance ≥ totalPrice`, при успехе `debitBalance()`
- `POST /payments/payme/init` — создаёт Payment(PENDING), возвращает redirect URL Payme (`checkout.paycom.uz/<base64>`)
- `POST /payments/click/init` — создаёт Payment(PENDING), возвращает redirect URL Click (`my.click.uz/services/pay?...`)
- `POST /payments/payme/callback` — полный Payme JSON-RPC webhook (Check/Create/Perform/CancelTransaction)
- `POST /payments/click/callback` — Click webhook (action=0 Prepare / action=1 Complete)
- `GET /payments/history` — история платежей пользователя (последние 50)
- Seed карт: Uzcard balance=6_500_000, Humo balance=3_200_000
- Конфиг из env: `PAYME_MERCHANT_ID`, `PAYME_BASE_URL`, `PAYME_SECRET_KEY`, `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`

**Мобильное приложение:**
- `api/types.ts`: `PaymentMethod` — добавлены `'PAYME' | 'CLICK'`
- `api/cards.ts`: поле `balance: number` в `CardApi`; `useSetDefaultCard()` → `PATCH /me/cards/:id/set-default`
- `api/payments.ts`: `useInitPayme()`, `useInitClick()`, `usePaymentHistory()`; `usePayPolicy` теперь инвалидирует `['cards']` и `['payments']`
- `navigation/types.ts`: `Finance` добавлен в `ProfileStackParamList`
- `ProfileNavigator`: зарегистрирован `FinanceScreen`
- `ProfileScreen`: раздел «Финансы» — строка с балансом кошелька + кол-во карт
- `FinanceScreen` (новый экран):
  - Тёмная карточка кошелька (баланс + кнопка «Пополнить» → bottom-sheet с суммой)
  - Список карт `SavedCardBig` с балансом; long-press → Alert: «Сделать основной» / «Удалить»
  - Добавить карту (bottom-sheet: Uzcard/Humo segmented + last4 + expiry)
  - История операций: wallet transactions + card payments
- `SavedCardBig`: новый prop `balance?: number` — отображает сумму под номером карты
- `PaymentScreen`: добавлены тайлы **Payme** (синий) и **Click** (оранжевый); при выборе → `initPayme/initClick` → `Linking.openURL(redirectUrl)` → Alert «вернитесь после оплаты»
- `IconWallet` добавлен в `LineIcons.tsx`

**Важно:**
- Для Payme/Click нужны реальные credentials в `.env`. Без них работают с mock URL (платёж открывается но не завершается)
- `PAYME_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` — запросить у заказчика

---

## Что НЕ сделано (отложено)

### Admin — Claims, Partners, Reports (дизайн нужен)
Админка S8 Phase 2: управление убытками (M9), выплаты, уведомления, управление партнёрами (одобрение СТО/клиник), тарифный редактор, отчёты/выгрузка 1С, управление контентом лендинга. Без дизайна от дизайнера — не начинать.

### Mobile — MyID prod-ключи (когда будет продакшен-договор)
Текущие ключи тестовые (`api.devmyid.uz`), работают только с лицами команды.
Для продакшена:
1. Получить prod `client_id` / `client_secret` / `client_hash` / `client_hash_id` от MyID
2. Поменять `MYID_BASE_URL=https://api.myid.uz` + `MYID_ENVIRONMENT=production` в `.env`
3. Изменить `config.environment = .production` в Config Plugin (или через env)
4. Пересобрать приложение

### Этап C13 — Оставшиеся экраны (дизайн нужен от дизайнера)
- M9 — Урегулирование (заявление о ДТП, европротокол)
- M10 — Статус выплат
- M11 — Уведомления
- M12 — Документы (PDF-полисы)
- M13 — Поддержка
- M16 — Партнёры (каталог, деталь, запись)

### Технические долги
- **i18n** — на C7–C12 русские строки захардкожены в JSX, не вынесены в `packages/i18n-strings`. См. `[[feedback-dev-md-lazy]]`. Большой проход.
- **Lint** — `pnpm lint` не подключен к turbo pipeline (eslint-конфиги в `apps/api` есть)
- **Тесты** — ни юнит, ни E2E. Когда подключим S5 — начнём с интеграционных на auth/me/policies + e2e через Maestro
- **Git-флоу** — feat/native-tabs стала «всем подряд». Стоит мержить в main и начать дробить ветки.
- **Sentry / Pino structured logs** — отложили в S4

### Открытые бизнес-вопросы клиенту
См. `QUESTIONS.md`. Главные: Uzcard-договор, NAPP-API, лицензии, тарифы КАСКО от Махмуд-аки, спеки серверов. Не блокируют разработку UI/моков, блокируют релиз.

---

## Как запустить (Quick Start)

### С нуля (новый комп)
```bash
# 1. Клонировать
git clone <repo-url>
cd sos24_claude

# 2. Toolchain (один раз)
nvm install 22 && nvm use 22
corepack enable && corepack prepare pnpm@11.1.2 --activate

# 3. Зависимости
pnpm install

# 4. БД
docker compose up -d --wait db

# 5. apps/api/.env (создать) — пример:
# DATABASE_URL=postgresql://sos24:sos24@localhost:5434/sos24?schema=public
# JWT_ACCESS_SECRET=<openssl rand -hex 32>
# JWT_REFRESH_SECRET=<openssl rand -hex 32>
# JWT_ACCESS_TTL=15m    ← ВАЖНО: формат "15m", не "900" (см. [[reference-jwt-ttl-format]])
# JWT_REFRESH_TTL=30d
# PORT=3030

# 6. Миграции + seed
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed

# 7. iOS (на Mac):
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer  # один раз
brew install cocoapods  # один раз
```

### Каждый раз (dev)
```bash
# Терминал 1 — API
pnpm dev:api
# → http://localhost:3030, swagger /api-docs

# Терминал 2 — Admin panel
cd apps/admin
npx next dev --port 3035
# → http://localhost:3035  (логин: +998993286330 / OTP 6330)
# → /myid-test — страница просмотра MyID-данных

# Терминал 3а — iOS Симулятор (без MyID SDK, DEV-кнопка симуляции)
cd apps/mobile
xcrun simctl boot "iPhone 17 Pro" && open -a Simulator
npx expo run:ios --device "iPhone 17 Pro"

# Терминал 3б — Реальное устройство iPhone 13 Pro Max (с MyID SDK)
cd apps/mobile
npx expo run:ios --device "00008110-00026DA60AA1401E"
# UDID: xcrun xctrace list devices | grep iPhone
```

> **Заметка по портам:** 3031 занят системным процессом macOS — использовать 3035.

### После изменений в нативном коде (MyID плагин, новые поды)
```bash
cd apps/mobile
npx expo prebuild --platform ios --no-install  # применить Config Plugin
cd ios && pod install && cd ..                  # обновить CocoaPods
npx expo run:ios --device "00008110-00026DA60AA1401E"
```

### Альтернативы для mobile
```bash
# Веб-превью (без iOS, для быстрой проверки)
pnpm --filter mobile run web   # → http://localhost:8081
```

### Ветка `feat/native-tabs` — тестирование (нужен dev build, не Expo Go)
```bash
git checkout feat/native-tabs
pnpm install

# Вариант 1 — Mac + Xcode 26 + бесплатный Apple ID (на устройство, 7 дней):
cd apps/mobile
npx expo prebuild --platform ios
npx expo run:ios --device

# Вариант 2 — Mac + Xcode 26 → iOS Simulator (без Apple ID вообще):
npx expo run:ios

# Вариант 3 — EAS cloud build (нужен Apple Developer Program $99/год):
eas login
eas device:create
eas build --profile development --platform ios
```
Для iOS 26 Liquid Glass нужен **Xcode 26+**. После установки dev-client работает как Expo Go (Metro + hot reload). Подробнее — раздел «Что дальше».

### Тестовый аккаунт
- **Телефон:** `+998993286330` (из seed, с готовыми данными)
- **OTP:** `6330` (хардкод на бэке, `auth.service.ts:DEV_OTP_CODE`)
- Любой другой номер тоже сработает (OTP тот же), создаст пустого юзера

---

## Что дальше — варианты

### ~~Вариант B — Дотянуть mobile-интеграцию~~ ✅ DONE 2026-05-20
GarageEdit, MyCards, PoliciesList/PolicyDetail/QrFullscreen — все на реальном API, mock'и убраны.

### ~~Вариант E — Merge в main~~ ✅ DONE 2026-05-20
`feat/native-tabs` смержена в `main`.

### ~~S7 — MyID верификация~~ ✅ DONE 2026-05-21
Обязательный флоу регистрации через MyID. Мок на бэке + DEV-кнопка на мобиле.

### ~~S8 — Admin Panel~~ ✅ DONE 2026-05-21
Dashboard + KPI + графики + таблицы users/policies + JWT auth. Реальные данные из API.

### ~~S5 — Partners~~ ✅ DONE 2026-05-21
`Partner` модель + `GET /partners` + `usePartners()` + HomeScreen. Последний мок убран.

### ~~ProfileEdit fix~~ ✅ DONE 2026-05-21
Реальный API, readonly при MYID_VERIFIED, зелёный баннер.

### ~~MyID расширенное хранилище~~ ✅ DONE 2026-05-21
7 новых typed-полей + `myidRaw JSONB`. Document заполняется полностью. Поддержка v1/v2 форматов.

### ~~S9 — Аджастер~~ ✅ DONE 2026-05-28
Полный модуль: бэкенд (миграции, enrichItems, 2 режима назначения) + мобиль (форма, баннер, статус-экран) + админка (таблица, карта, drawer, AcceptModal). UX-фикс кнопок с LinearGradient.

### S10 — Финансы ✅ DONE 2026-05-28
Finance-экран + карты с mock-балансом + Payme/Click init + история. Документация в разделе выше.

### ~~S11 — MyID Native iOS SDK~~ ✅ DONE 2026-06-02
Нативная интеграция `MyIdSDK 3.1.3` через Config Plugin. Тест-ключи подключены, протестировано на iPhone 13 Pro Max. ProfileScreen + DocumentScreen read-only. Admin `/myid-test`. Полное описание выше в журнале.

### ~~S14 — НАПП живой sandbox~~ ✅ DONE 2026-06-08
Мок NAPP заменён на живой sandbox (`sandboxerspapiv2.e-osgo.uz`). Новый `NappAuthService` — OAuth2 password grant + кэш токена (буфер 60 c) + авто-refresh через `refresh_token` + single-flight. `NappService.getVehicleByTechPassport()` стал async: ходит на `POST /api/provider/osago/vehicle` с Bearer-токеном, на 401 сбрасывает кэш токена. Тоггл `NAPP_MOCK` (офлайн-мок) + `NAPP_MOCK_FALLBACK` (если sandbox вернул not-found/недоступен → детерминированный мок-авто из POOL, логируется). Контракт DTO/конверт не изменился — мобиль не трогали.
- **Проверено вживую:** токен выдаётся (`expires_in ≈ 12 дней`), эндпоинт отвечает, DI собирается, typecheck чистый, dotenv корректно читает пароль со спецсимволами (одинарные кавычки).
- **⚠️ Ограничения:** в sandbox нет наших тест-авто (любой техпаспорт → `404 не найдено`) → пока работает fallback-мок. Прод (`erspapiv2.e-osgo.uz`) выдаёт токен, но данные висят по таймауту — нужен **whitelist IP** наших серверов у НАПП.
- **Дальше (P1):** `driver-summary-v2` (водитель + КБМ), регистрация е-полиса `POST /api/v3/osago/contract` + `confirm-payed`.

### ~~S15 — НАПП: справочники + хранение данных авто + админка~~ ✅ DONE 2026-06-08
Расширение живой НАПП-интеграции (проверено вживую на реальных данных ГБДФЛ):
- **Prisma Vehicle** +18 полей НАПП (techPassport*, vehicleTypeId, bodyNumber, engineNumber, fuelType, seats/stands, массы, division, owner*, pVehicleId) + `nappRaw` + `nappOrgRaw` JSONB + `nappSyncedAt`. Миграция `vehicle_napp_fields`.
- **NappReferenceService** — кэш справочников НАПП (44 шт., TTL 24ч). `GET /napp/references/:name`. Расшифровка `vehicleTypeId` → «Легковые автомобили» и т.д. ⚠️ Справочника топлива НАПП не отдаёт — `fuelType` хранится кодом.
- **NappService** +методы: `getOrganizationByInn` (/provider/inn), `getPersonByPassport` (/provider/passport-birth-date-v2), `getPersonByPinfl` (/provider/pinfl-v2). Нюансы НАПП: `transactionId` — строка; `senderPinfl` проверяется по контрольной цифре (env `NAPP_SENDER_PINFL`).
- **Сохранение при создании авто:** `POST /me/vehicles` принимает techPassportSeria/Number → backend re-fetch из НАПП, сохраняет промо-поля + nappRaw; если владелец юрлицо — тянет карточку организации по ИНН (nappOrgRaw). Данные человека по-прежнему через **MyID** (НАПП person — только админ-инструмент).
- **Admin API:** `GET /admin/vehicles` (список+поиск), `GET /admin/vehicles/:id` (полные данные+decoded), авто в карточке пользователя, `POST /admin/napp/lookup/passport|pinfl`.
- **Admin UI:** страница «Автомобили» (список+детали со всеми НАПП-полями и организацией), блок «Авто» в карточке пользователя (myid-test), страница «Пробить (НАПП)» по паспорту/ПИНФЛ. Пункты в Sidebar.
- **Mobile:** `GarageEditScreen` передаёт техпаспорт при сохранении.
- **⚠️ Прод:** нужен whitelist IP + реальный `NAPP_SENDER_PINFL` компании Semurg.

### ~~S16 — «Отдел NAPP»: все инструменты пробивки в админке~~ ✅ DONE 2026-06-08
- **NappService +8 методов:** driver-license, driver-summary (ВУ+КБМ), driver-coefficient (КБМ), is-pensioner, provided-discounts, gtk-vehicle (иностранное авто), passenger-license, cadaster. Все проверены вживую на sandbox.
- **`NappToolsController`** (`/admin/napp/lookup/*`, admin-guarded) — 12 инструментов; passport/pinfl перенесены сюда из AdminController.
- **Admin UI:** конфиг-движок `nappTools.ts` + универсальный рендер результата; страница `/napp` (рабочее место с подменю слева); раздел «Отдел NAPP» в Sidebar (раскрывающийся, по группам: Человек / Водитель / Авто / Компания и имущество). Старая `/napp-lookup` удалена.
- Новый инструмент добавляется одной записью в `nappTools.ts`.

### S17 — Android-часть ← СЛЕДУЮЩИЙ ФРОНТ (анализ готов, см. `docs/ANDROID.md`)
Переходим к тестированию Android. Полный анализ готовности — в **`docs/ANDROID.md`**. Ключевое:
- 🔴 **Блокеры:** `android.package` не задан; **MyID только iOS** (а он обязателен в регистрации → на Android не пройти); таб-бар на SF Symbols (iOS-only); `android/` не сгенерирован; окружение сборки не настроено (нет JAVA_HOME/ANDROID_HOME, хотя Android Studio установлена).
- ✅ **Готово кросс-платформенно:** все экраны/навигация/API/стейт/i18n/шрифты, нативные зависимости (autolinking), API-клиент уже знает про `10.0.2.2`.
- **План:** (1) `android.package` + временный байпас MyID на Android (OTP-only) для разблокировки теста; (2) иконки таб-бара под Android; (3) настроить SDK/JDK/AVD; (4) `expo prebuild -p android` → `run:android`; (5) позже — нативный MyID Android SDK.

### S12 — Оффлайн + Apple/Google Wallet ← ОБСУЖДЕНО, НЕ НАЧАТО
Обсуждены варианты оффлайн-режима (2026-06-02):
- **Вариант 1 (минимум):** персистентный кэш TanStack Query — MMKV. Полисы/авто/QR доступны без сети.
- **Вариант 2:** Apple Wallet Pass (PKPass) + Google Wallet Pass — полис как карточка в Wallet, работает с lock screen.
- **Вариант 3:** Offline европротокол.
- **Вариант 4:** SQLite offline-first (полный оффлайн).

**Блокеры для Apple Wallet:** нужен платный Apple Developer Program ($99/год) — без него PKPass сертификат не выдаётся.
**Google Wallet:** бесплатно, верификация бизнеса 1-3 дня. Можно начать без Apple Developer.

### S13 — Европротокол ← СЛЕДУЮЩИЙ КРУПНЫЙ (нужен дизайн + решение по варианту)
Исследование завершено — `EUROPROTOCOL.md`. Два варианта:
- **Вариант A (MVP, ~3–4 нед.)** — один телефон, QR-ссылка для второго водителя, OTP-подписи
- **Вариант B (полный, ~+4–6 нед.)** — real-time синхронизация двух устройств, WebSocket, конструктор схемы

Блокеры: дизайн 11 экранов + решение от клиента (какой вариант + API полисов УЗ?).

### Вариант D — i18n cleanup + lint + тесты (~2 дня)
Вынести русские строки C7–C12 в `packages/i18n-strings`, настроить lint в turbo, написать первые integration-тесты.

### Admin Phase 2 (нужен дизайн)
Управление убытками, выплатами, партнёрами, тарифный редактор, отчёты/1С.

**Рекомендованный порядок:** S13 Европротокол → Admin Phase 2 → D (i18n/тесты).

---

## Память Claude (~/.claude memory)

В `/Users/odya/.claude/projects/-Users-odya-Documents-projects-sos24-claude/memory/` накопились reference/feedback файлы. Главные:
- `reference-jwt-ttl-format.md` — формат TTL в `.env`
- `feedback-expo-ui-glass-button-fixed-size.md` — @expo/ui Button hugging
- `reference-test-user.md` — состав seed
- `reference-api-module-layout.md` — паттерн `apps/mobile/src/api/<domain>.ts`
- `reference-enum-case-mapping.md` — UPPERCASE backend ↔ lowercase mobile

`MEMORY.md` — индекс. Читается автоматически.

---

## Файлы и навигация

| Файл / папка | Что внутри |
|---|---|
| `CLAUDE.md` | главный контекст проекта |
| `DEVELOPMENT.md` | инженерный процесс |
| `PLAN.md` | архитектура и модули |
| `STAGE1.md` | **этот файл** — журнал работ |
| `EUROPROTOCOL.md` | исследование Европротокола — условия УЗ, форма, этапы, варианты реализации |
| `QUESTIONS.md` | открытые вопросы клиенту |
| `DESIGN_SYSTEM.md` | дизайн-токены |
| `SOS24/` | дизайн-эталоны |
| `apps/api/` | NestJS бэк (14 модулей, Prisma 6, seed) |
| `apps/api/src/{auth,users,vehicles,napp,documents,drivers,policies,promo,cards,wallet,payments,admin,partners,adjuster,myid}` | модули |
| `apps/api/prisma/{schema.prisma,migrations,seed.ts}` | БД |
| `apps/mobile/` | Expo + RN |
| `apps/mobile/plugins/withMyIdSdk.js` | Config Plugin — MyID SDK: пишет Swift/ObjC, добавляет в xcodeproj, pod |
| `apps/mobile/ios/mobile/MyIdSdkModule.swift` | Swift-мост для MyID SDK (генерируется плагином) |
| `apps/mobile/ios/mobile/MyIdSdkModule.m` | ObjC bridge RCT_EXTERN_MODULE (генерируется плагином) |
| `apps/mobile/ios/mobile/mobile-Bridging-Header.h` | Bridging header: `#import <React/RCTBridgeModule.h>` |
| `apps/mobile/src/api/` | API-слой: types + 12 domain-файлов с хуками (+ myid.ts) |
| `apps/mobile/src/components/ui/` | UI-кит ~40 примитивов + `AdjusterActiveBanner` |
| `apps/mobile/src/features/{auth,policies,purchase,profile,garage,main,adjuster,myid}/` | бизнес-фичи |
| `apps/mobile/src/navigation/*Navigator.tsx` | стеки |
| `packages/myid-sdk/` | Expo-совместимый нативный пакет (podspec + Swift + TS) |
| `apps/admin/` | Next.js 15 — веб-админка страховой |
| `apps/admin/src/app/(dashboard)/` | Dashboard, Users, Policies, Adjuster, MyID Test страницы |
| `apps/admin/src/app/(dashboard)/myid-test/` | Тест-страница MyID данных — все поля + myidRaw JSON |
| `apps/admin/src/app/(dashboard)/adjuster/` | page.tsx, AdjusterDetailDrawer, AcceptModal, MapView |
| `apps/admin/src/components/{layout,dashboard}/` | Sidebar (+ MyID пункт), Header, KpiCard, TrendChart, TypeDonut |
| `apps/admin/src/lib/{api.ts,admin-hooks.ts}` | axios-клиент + TanStack Query хуки |
