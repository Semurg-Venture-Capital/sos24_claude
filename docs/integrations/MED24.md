# MED24 API — справочник интеграции (справочник «Здоровье»)

> Официальный доступ к API med24 предоставлен med24 (июль 2026). Тянем справочник **клиник и врачей**
> в раздел «Здоровье» приложения. На 2026-07-11 залит **пробный срез: 9 клиник + 127 врачей** (тест на 10).
> В будущем — полный импорт всей базы. Связка с [[docs/HEALTH.md]] и модулем `apps/api/src/health`.

## 1. Основное

- **База:** `https://main.med24.uz`
- **Docs (OpenAPI 3.0):** `https://main.med24.uz/docs` — авторизация `Bearer` (схема `apiAuth`), **но эндпоинты отвечают и без токена** (публично). Сырой спек по `/docs.json`, `/openapi.json` и т.п. отдаёт 404 — API изучен «вживую».
- **⚠️ User-Agent обязателен.** Без заголовка `User-Agent` эндпоинт `app/doctors` отдаёт **403**. Всегда слать браузерный UA (напр. `Mozilla/5.0 …`).
- **Пагинация:** `?page=<n>&per_page=<n>` (проверено `per_page` до **500**), `meta.last_page`, `meta.total`, `links.next`.
- **Язык:** поля идут в парах `*_ru` / `*_uz` (либо `name` + `name_ru`), плюс встречается `?lang=`.

## 2. Клиники

**Список:** `GET /api/v1/app/clinics?per_page&page`
Поля строки: `id, slug, name, logo, reviews_count, reviews_score, work_time, phones[]`. Масштаб: `meta.last_page ≈ 2440`.

**Деталь:** `GET /api/v1/app/clinics/{id}`
Поля: `id, slug, name, logo, reviews_count, reviews_score, description, address, latitude, longitude, phones[], types, work_days, work_hours, weekend_days`.
- `phones[0]` — **ресепшн клиники** (публичный бизнес-контакт). Это телефон и для «Позвонить» у врачей.
- `description` — содержательный текст («Специализация врачей: …» + «Описание клиники: …»).
- `work_days`/`work_hours` — строки вида «Пн – Сб» / «09:00 – 16:00».
- **Города/области НЕТ** — только `address` (улица) + координаты. Область определяем по координатам.
- ⚠️ Часть id отдаёт **500** (напр. `3563`) — баг на их стороне, импортёр пропускает.

## 3. Врачи

**Плоский список «врач@клиника» (лучший для импорта):** `GET /api/v1/app/doctors?per_page&page`
Поля строки: `id, name, rank, photo, experience, academic_degree, reviews_count, reviews_score, clinic_id, clinic_name, clinic_phones[], available_time, doctor_booking_type, doctor_integration_id, specialties[{id,slug,name}]`.
- Один врач в нескольких клиниках = **несколько строк** (по строке на клинику), у каждой свой `clinic_id`/`clinic_phones`. `meta.total ≈ 6848`.

**Полный список врачей:** `GET /api/v1/doctors?per_page&page`
Поля: `name_ru/name_uz, specialties[{name_ru}], work_places[{clinic_id, clinic_name_ru, clinic_address_ru, …}], experience, rank, academic_degree, photo, reviews_score`. `work_places[].clinic_id` — привязка к клинике.

**⚠️ Серверный фильтр по клинике НЕ работает.** `?clinic_id=` / `?clinic_slug=` / `?clinic=` **игнорируются** (возвращают дефолтный список чужих врачей). `/api/v1/doctors/findByClinic` и `/api/v1/app/clinics/{id}/doctors` → **404**.
→ Чтобы получить врачей конкретных клиник: **пагинируем `app/doctors` и фильтруем локально** по `clinic_id ∈ {наши клиники}`. При `per_page=500` вся база врачей ≈ **14 страниц**.

## 4. Прочие эндпоинты (на будущее)

- `GET /api/v1/doctors-specialties` (+ `/search`, `/app`) — справочник специальностей.
- `GET /api/v1/doctors/{slugOrId}`, `/reviews`, `/search` — деталь/отзывы/поиск врача.

## 5. Маппинг в наши модели

| med24 | SOS24 | Примечание |
|---|---|---|
| clinic (`/app/clinics/{id}`) | `Partner` | `healthDirectory=true` (видна только в «Здоровье», не в каталоге «Партнёры») |
| clinic.phones[0] | `Partner.phone` | ресепшн |
| clinic.description / address / lat,lng / work_* | `Partner.description/address/lat/lng/workingHours` | часы парсятся «Пн–Сб/09:00–16:00» → `{mon:{open,close},…}` |
| — (нет поля) | `Partner.region` | по координатам: ближайший из 14 центров РУз (имена строго как `HealthService.REGIONS`) |
| doctor (`/app/doctors` row) | `Doctor` | `bookingEnabled=false` → кнопка «Позвонить» на ресепшн клиники |
| doctor.clinic_id | `Doctor.partnerId` = `med24-clinic-<clinic_id>` | |
| doctor.specialties[0].name | `Doctor.specialty` | |
| doctor.experience / reviews_score / reviews_count | `Doctor.experienceY/rating/reviewCount` | |

**Стабильные ключи upsert (идемпотентно):** `Partner.id = med24-clinic-<clinicId>`, `Doctor.id = med24-doc-<doctorId>-<clinicId>`.

**Картинки (пока НЕ импортируем):** `clinic.logo` (`clinics/…jpg`) и `doctor.photo` — относительные пути med24. Решить: хранить ссылки med24 vs скачивать в MinIO.

## 6. Импортёр

`apps/api/prisma/import-med24.ts` (запуск: `pnpm exec ts-node --transpile-only prisma/import-med24.ts`).
- `MED24_MODE=clinics|doctors|both` (по умолч. `both`), `MED24_LIMIT` (клиник, по умолч. 10), `MED24_TOKEN` (необяз.), `MED24_BASE`.
- `clinics`: тянет N клиник (список → деталь каждой) → upsert `Partner`.
- `doctors`: читает уже импортированные клиники из БД → пагинирует `app/doctors` (per_page=500, UA, пауза 400мс) → upsert `Doctor` по совпадению `clinic_id`.

## 7. План полного импорта (будущее)

1. **Клиники:** пагинировать `/api/v1/app/clinics` (≈2440 стр.); для координат/описания нужна **деталь** каждой (`/app/clinics/{id}`) — это тысячи запросов, гнать батчами с паузами и ретраями, пропускать 500-е.
2. **Врачи:** один проход `app/doctors` (per_page=500, ≈14 стр.) → upsert всех, чьи `clinic_id` есть среди импортированных клиник.
3. **Область** — по координатам (или, если появится, через `?location=<slug>`; сейчас location принимается, но список слагов не подтверждён).
4. Бережно к API: UA, паузы, ретраи на 429/5xx; логировать пропуски (500-е клиники).
5. Деплой: то же на прод (сейчас всё на локальном деве).

**Статус 2026-07-11:** пробно залито 9 клиник (id: 8973, 21743, 24226, 24815, 42625, 95513, 148373, 148406, 148529) + 127 врачей. Одна клиника (3563) — 500 на их стороне.
