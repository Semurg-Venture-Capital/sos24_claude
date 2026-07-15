# WHOOP_PAGES_PLAN.md — Экраны показателей WHOOP (RU/UZ) с Liquid Glass

> **Что это.** План реализации раздела «Показатели WHOOP» в модуле «Здоровье» (M14):
> 5 экранов с красивыми графиками и историей метрик, на русском и узбекском (в самом
> приложении WHOOP локализации нет). Дизайн **утверждён** заказчиком (2026-07-15).
>
> **Прототип (утверждён):** `docs/mockups/whoop-pages.html` — открыть в браузере, есть
> переключатель RU/UZ. Онлайн-версия публиковалась артефактом.
> **База интеграции:** `docs/integrations/WHOOP.md` (данные, OAuth, вебхуки, лимиты).
> **Дизайн-система:** `docs/DESIGN_SYSTEM.md` (§6 — «любой плавающий элемент со стеклом»).

---

## 0. Принцип: максимум Liquid Glass

Правило проекта — **нативный iOS 26 Liquid Glass везде, где элемент «плавает»**. Для этих
экранов это ключевой приём: карточки метрик, хедеры, чипы диапазона, плитки — всё на стекле,
чтобы раздел ощущался как системный, а не «ещё один дашборд».

**Наши стеклянные компоненты (переиспользуем, НЕ изобретаем):**

| Компонент | Файл | Где применяем в WHOOP-экранах |
|---|---|---|
| `GlassView` (нативный `expo-glass-effect`, iOS 26) | — | Карточки метрик, hero-карточка кольца, плитки витальных |
| `GlassContainer` (нативный морфинг) | — | Ряд чипов диапазона (капля-выделение) |
| `GlassPill` | `components/ui/GlassPill.tsx` | Кнопки «Синхронизировать», «Подключить», бейджи статуса |
| `IconButton` | `components/ui/IconButton.tsx` | Кнопка «назад», «обновить» в хедере |
| `LiquidGlassChips` | `features/health/components/LiquidGlassChips.tsx` | Диапазон 14/30/90 дней (капля как в Telegram) |
| `Segmented` | `components/ui/Segmented.tsx` | Альтернатива для 2-3 сегментов |
| `Glass` (expo-blur, кросс-платформа) | `components/ui/Glass.tsx` | Липкий полупрозрачный хедер (как в «Врачи»), Android-фолбэк |
| `medGlass` (стиль) | `features/health/components/medGlass.ts` | Лёгкие карточки-строки, скелетон |
| `MedVital`, `MedQuickTile`, `StatPill`, `MedCardSkeleton` | `features/health/components/*` | Плитки показателей, быстрые тайлы, скелетон загрузки |

**Правила применения стекла (чтобы не «сломалось» — уроки [[project-liquid-glass-chips]]):**
- Скругление + `overflow:hidden` — на самом `GlassView` (иначе стекло режется прямоугольником).
- НЕ анимировать `opacity` на `GlassView`/родителе (ломает эффект).
- `isInteractive` — статичный (менять только через remount с новым `key`).
- Row-раскладку класть во внутренний `View`; `Glass`/`GlassView` — только фон.
- Липкий хедер: фикс-оверлей + ОДИН sticky-элемент (несколько `stickyHeaderIndices` заменяют друг друга).
- На iOS < 26 / Android — фолбэк на `expo-blur` `<Glass>` / `medGlass` (через `isLiquidGlassAvailable()`).

**Графики — `react-native-svg`** (уже в проекте): кольца, дуги-гейджи, линии трендов с заливкой,
спарклайны, столбцы фаз сна, зоны пульса. Без тяжёлых chart-библиотек.

---

## 1. Данные — что есть и чего не хватает

Из `WHOOP.md`: получаем recovery / sleep / cycle / workout. **НО сейчас в БД только снапшот**
последних значений (`WhoopSnapshot`) — **истории нет**, а именно она нужна для графиков и трендов.

| Метрика | Поля WHOOP | Статус у нас |
|---|---|---|
| Восстановление | `recovery_score, hrv_rmssd, resting_heart_rate, spo2, skin_temp` | ✅ снапшот (нет истории) |
| Сон | `sleep_performance, stages (deep/rem/light/awake), respiratory_rate, sleep_need, consistency` | ✅ снапшот частично (нет need/consistency/efficiency в истории) |
| Нагрузка (сутки) | `strain (0–21), avg/max HR, kilojoule` | ✅ снапшот (нет истории) |
| Тренировки | `sport, strain, HR zones, calories, distance` | ❌ не тянем |
| История/тренды | тайм-серии 7/14/30/90 дней | ❌ нет |

---

## 2. Модель данных (Prisma) — добавить тайм-серии

Снапшот (`WhoopSnapshot`) **оставляем** для быстрой отдачи «сегодня». Добавляем историю:

```prisma
model WhoopRecoveryDay {
  id            String   @id @default(cuid())
  userId        String
  date          DateTime // день (UTC-нормализованный)
  recoveryScore Int?
  hrvMs         Float?
  restingHr     Int?
  spo2          Float?
  skinTempC     Float?
  scoredAt      DateTime?
  @@unique([userId, date])
  @@index([userId, date])
  @@map("whoop_recovery_days")
}

model WhoopSleep {
  id               String   @id @default(cuid())
  userId           String
  start            DateTime
  end              DateTime
  performancePct   Int?
  efficiencyPct    Int?
  consistencyPct   Int?
  inBedMin         Int?
  lightMin         Int?  deepMin  Int?  remMin Int?  awakeMin Int?
  needMin          Int?  // потребность (база + долг + от нагрузки)
  respiratoryRate  Float?
  disturbanceCount Int?
  cycleCount       Int?
  isNap            Boolean @default(false)
  @@unique([userId, start])
  @@index([userId, start])
  @@map("whoop_sleeps")
}

model WhoopCycleDay {
  id       String   @id @default(cuid())
  userId   String
  date     DateTime
  strain   Float?
  kilojoule Float?
  avgHr    Int?  maxHr Int?
  @@unique([userId, date])
  @@index([userId, date])
  @@map("whoop_cycle_days")
}

model WhoopWorkout {
  id           String   @id @default(cuid())
  userId       String
  start        DateTime
  end          DateTime
  sport        String?
  strain       Float?
  avgHr        Int?  maxHr Int?
  kilojoule    Float?
  distanceM    Float?
  zoneMin      Json?   // [z1..z5] минуты
  @@index([userId, start])
  @@map("whoop_workouts")
}
```
Миграция отдельным `prisma migrate` (по правилу — уникальный тег образа для прод-деплоя,
`docs/DEVOPS.md §5`).

---

## 3. Бэкенд (`apps/api/src/health/wearables/whoop/`)

- **Запись истории:** в обработчике вебхуков (`recovery/sleep/workout.updated`) — не только
  обновлять снапшот, но и `upsert` в тайм-серии по дате/старту.
- **Бэкфилл при подключении:** после OAuth — тянем историю за ~30–90 дней пагинацией
  (`GET /v2/recovery|/activity/sleep|/cycle|/activity/workout` с `start/end`), кладём в тайм-серии.
  Через **BullMQ** (уже есть очередь), бережно к лимиту WHOOP (100 req/min).
- **Тренировки:** добавить скоуп `read:workout` (уже в списке) + маппинг зон пульса.
- **Эндпоинт истории:**
  `GET /health/wearable/whoop/history?metric=recovery|hrv|rhr|strain|sleep&range=14|30|90`
  → массив `{ date, value }` (+ база/средние для трендов). Считаем агрегаты на сервере.
- **Авто-refresh токена** и `score_state=SCORED`-фильтр — уже в сервисе.

---

## 4. Мобилка — 5 экранов (навигация + стекло по элементам)

Вход: тап по карточке **«Мои показатели»** (`WhoopCard`) в `HealthHubScreen` → стек WHOOP.
Навигация — новый `WhoopNavigator` (или маршруты в `HealthNavigator`).

Общий каркас каждого экрана (как в «Врачи», уже отлажено):
- **Липкий полупрозрачный хедер** — фикс-оверлей на `<Glass>` (blur), высота через `onLayout` → `paddingTop`, контент под статус-баром (`insets.top`). Кнопка «назад» — `IconButton` (стекло).
- Контент скроллится под хедером; тянем-обновляем (pull-to-refresh) → `sync`.
- Загрузка → `MedCardSkeleton` (стеклянный скелетон).

### 4.1 Обзор (`WhoopOverviewScreen`)
- **Hero-карточка** (`GlassView` regular): кольцо восстановления (SVG) + подпись «Высокая/Средняя/Низкая готовность» + пояснение.
- Две плитки (`GlassView`): дуга-гейдж нагрузки (0–21) и качество сна с мини-разбивкой фаз (стеклянные).
- Плитки витальных (`MedQuickTile`/`GlassView`): ВСР, пульс покоя — со спарклайнами.

### 4.2 Восстановление (`WhoopRecoveryScreen`)
- Большое кольцо (SVG) в `GlassView`-hero + пояснение «как считается».
- Плитки-стекло: ВСР (+дельта от базы), пульс покоя (база), SpO₂, темп. кожи — со спарклайнами.
- Карточка дыхания (`GlassView`) + мини-график.

### 4.3 Сон (`WhoopSleepScreen`)
- Hero (`GlassView`): качество сна %, «получено vs потребность» (стеклянный прогресс-бар), недосып.
- Карточка фаз (`GlassView`): стековый бар глубокий/REM/лёгкий/бодрствование (2px-зазоры) + легенда + пояснение.
- Плитки: регулярность, дыхание.

### 4.4 Нагрузка (`WhoopStrainScreen`)
- Hero (`GlassView`): дуга-гейдж 0–21 + пояснение «сравнивай с восстановлением».
- Плитки: средний/макс пульс, калории (кДж→ккал), сон.
- Карточка **зоны пульса** (`GlassView`): 5 горизонтальных баров.
- Список **тренировок** — строки-стекло (`medGlass`/`MedCardRow`): спорт, длительность, ккал, strain.

### 4.5 Тренды/История (`WhoopTrendsScreen`)
- **Диапазон 14/30/90** — `LiquidGlassChips` (капля-морфинг) ИЛИ `Segmented`.
- Карточки-графики (`GlassView`): линии с заливкой + акцент-точка на конце + дельта —
  Восстановление %, ВСР, пульс покоя, Сон %. Данные — `/history`.
- Карточка-инсайт (`GlassView`, тонированное стекло): текстовый вывод («ВСР растёт 4-й день…»).

**Семантические цвета данных** (из мокапа, отдельно от бренд-красного):
восстановление — зелёный/жёлтый/красный (≥67/≥34/<34), нагрузка — синий `#3f74ff`,
сон — индиго `#7b6cf0`, ВСР — бирюза `#0fb5a6`, пульс — розовый `#f0637c`, дыхание/SpO₂ — голубой.

---

## 5. Локализация (i18n)

- Все строки — в `@sos24/i18n-strings`: **uz-Latn, uz-Cyrl, ru, en** (RU/UZ-Latn — приоритет).
- Пояснения к каждой метрике (главная ценность vs самого WHOOP — там их нет).
- Форматы по локали: числа, даты, единицы; **кДж → ккал**, мс, уд/мин, вдох/мин.
- Термины (RU → UZ-Latn): Восстановление→Tiklanish, Сон→Uyqu, Нагрузка→Yuklama,
  ВСР→YuRV, Пульс покоя→Tinch puls, Дыхание→Nafas, Готовность→Tayyorlik и т.д. (см. мокап).

---

## 6. Порядок работ (этапы)

| Этап | Содержание | Результат |
|---|---|---|
| **A. История + бэкенд** | Тайм-серии в БД, бэкфилл (BullMQ), запись по вебхукам, тренировки, `/history`-эндпоинт | Данные для графиков есть |
| **B. Обзор · Восстановление · Сон** | 3 экрана на `GlassView` + липкий хедер + SVG-кольца/бары + пояснения | Ядро раздела |
| **C. Нагрузка · Тренды · Тренировки** | Гейдж, зоны пульса, список тренировок, графики истории, инсайты | Полный набор |
| **D. Локализация + полировка** | uz-Cyrl/en, форматы, анимации колец/линий, тёмная тема, скелетоны | Прод-готовность |

**Оценка (черновая):** A ≈ 1–1.5 дня, B ≈ 2 дня, C ≈ 1.5 дня, D ≈ 1 день.

---

## 7. Открытые вопросы (уточнить по ходу, не блокирующие)

1. Приоритет метрик: сначала «здоровье» (Восстановление/Сон/ВСР) или сразу и «фитнес» (Нагрузка/тренировки)? — по умолчанию делаем все 5 в порядке этапов B→C.
2. Единицы: калории в **ккал** (перевод из кДж) — ок? Дистанция — км.
3. Инсайты (текстовые выводы трендов): простые правила на сервере или подключить ИИ (Gemini уже есть)? — на старте простые правила.
4. Диапазоны истории по умолчанию: 14 дней. Нужен ли 7?
5. Тренировки: показывать все виды спорта или только основные?

---

## 8. Связанные материалы
- Прототип: `docs/mockups/whoop-pages.html`
- Данные/OAuth/вебхуки WHOOP: `docs/integrations/WHOOP.md`
- Дизайн-система (стекло): `docs/DESIGN_SYSTEM.md`
- Уроки Liquid Glass: память `project-liquid-glass-chips`, `project-whoop-integration`, `project-health-module`
