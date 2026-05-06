# STITCH_BATCH_2 — M4. Каталог продуктов + M5. Калькулятор тарифа

> **Батч 2 из 9.** Mobile, iOS frame 393×852. 10 экранов: 3 экрана каталога (ОСАГО/КАСКО) + 7 экранов калькулятора (5 шагов + результат + сохранённые расчёты).
>
> **Как использовать:** в Stitch для каждого экрана последовательно вставляем:
> 1. **§1 BASE PROMPT** из `STITCH_BASE_PROMPT.md`
> 2. **§2.1 Mobile preset** из `STITCH_BASE_PROMPT.md`
> 3. **Screen prompt** из этого файла
>
> Прикладываем `assets/brand/logo.svg`, `ref1.jpg`, `ref2.jpg`, `ref3.jpg`. Каждый экран генерим в **light**, затем в **dark** (`THEME: dark`).

---

## M4.1 — Catalog Home

```
SCREEN: M4.1 — Catalog home (product picker)
PURPOSE: Show two main products — compulsory MTPL ("ОСАГО") and voluntary comprehensive ("КАСКО") — as the entry point of the buy-flow.
USER GOAL: Pick a product to learn more or start a calculation.
ENTRY: Bottom tab "Полисы" (when no active policies, opens here) OR "Купить полис" CTA from M14 home.
EXIT: Tap a card → M4.3 (product detail). "Сравнить" pill at top → M4.2.

LAYOUT
- White background (light) / #010101 (dark).
- Top bar: 56 px, title "Купить полис" Mont Bold 18 centered, no back arrow (it's a tab root).
- 24 px horizontal padding.
- Helper headline Inter Regular 15 #9A9AA0: "Что вам нужно?".
- 4 px gap. Headline Mont Heavy 28 #010101: "Подберите страховку".
- 24 px gap.
- "Сравнить продукты" pill-button right-aligned, Inter Medium 14 #E61428 with small arrow icon, on white pill border 1 #E61428, height 36, radius 999.
- 16 px gap.
- Two large stacked product cards (each full-width, 200 px tall, radius 16, gap 16):
  - Card 1 — ОСАГО:
    - Background: #010101 (dark hero card), with a subtle car-side-silhouette illustration low-opacity in the bottom-right.
    - Badge top-left: "Обязательно" pill, fill #E61428, white text Inter SemiBold 12, padding 4×10, radius 999.
    - Title Mont Heavy 32 white: "ОСАГО".
    - Subtitle Inter Regular 14 #9A9AA0 (2 lines): "Обязательная гражданская ответственность. Защита от штрафов ГАИ."
    - Bottom row: "от 280 000 сум / год" Mont Bold 16 white + small chevron-right icon.
  - Card 2 — КАСКО:
    - Background: white with #F5F5F7 fill, hairline border #EAEAEC.
    - Badge top-left: "Добровольно" pill, white fill, border 1 #EAEAEC, text #010101 Inter SemiBold 12.
    - Title Mont Heavy 32 #010101: "КАСКО".
    - Subtitle Inter Regular 14 #9A9AA0 (2 lines): "Защита от ущерба и угона. Полное покрытие вашего авто."
    - Bottom row: "от 2 400 000 сум / год" Mont Bold 16 #010101 + chevron.
- 24 px gap.
- Helper note centered Inter Regular 13 #9A9AA0: "Цены ориентировочные. Точная стоимость — после расчёта.".

COMPONENTS
- "Сравнить" pill link.
- Two product cards (one dark hero, one light) with badge + title + subtitle + price + chevron.

STATES TO GENERATE
- default

EDGE CASES
- Long pricing string (millions in uz number formatting) — keep on one line, truncate decimals if needed.
- If a third product appears later (зелёная карта) — same card pattern, scroll vertical.
```

---

## M4.2 — Product Comparison

```
SCREEN: M4.2 — Compare ОСАГО vs КАСКО
PURPOSE: Side-by-side feature comparison so the user can decide which product fits.
USER GOAL: Skim coverage differences, pick one, tap "Рассчитать" on the chosen product.
ENTRY: From M4.1 "Сравнить" pill OR from a product detail page.
EXIT: Tap CTA in either column → M5.1 with that product preselected.

LAYOUT
- White background.
- Top bar: 56 px, back arrow left, title "Сравнение" Mont Bold 18.
- Sticky two-column header just below top bar (height 96, white with hairline-bottom #EAEAEC):
  - Left column: small ОСАГО chip (Brand Red fill, white text), Mont Heavy 18 "ОСАГО", Inter Regular 12 #9A9AA0 "от 280 000 сум".
  - Right column: КАСКО chip (white, border #EAEAEC, text #010101), Mont Heavy 18 "КАСКО", Inter Regular 12 #9A9AA0 "от 2 400 000 сум".
  - Vertical 1 px divider between columns.
- Content: a list of comparison rows, each row 64 px tall, two columns matching the sticky header.
  - Row label sits centered above the row in a small Inter SemiBold 12 #9A9AA0 strip ("Что покрывает", "Срок", "Угон", "Ущерб от ДТП", "Стихия", "Кража салона", "Помощь на дороге", "Возврат при отказе").
  - Each cell shows either:
    - check mark in #1FAE6F + Inter SemiBold 14 #010101 "Включено", or
    - x mark in Neutral 400 + Inter Regular 14 #9A9AA0 "Не включено", or
    - text value (e.g., "1 год", "До 100 000 USD").
- Sticky footer (bottom-fixed, 96 px, white with shadow on top): two side-by-side full-width buttons, height 52, radius 12:
  - Left button "Оформить ОСАГО" — outline, border #010101, text #010101 Inter SemiBold 14.
  - Right button "Оформить КАСКО" — fill #E61428, white text Inter SemiBold 14.

COMPONENTS
- Sticky two-column comparison header.
- Repeating comparison rows with check/cross/value cells.
- Sticky footer with two CTAs.

STATES TO GENERATE
- default

EDGE CASES
- Very long row label in uz-Cyrl — wrap to 2 lines (label strip becomes 32 tall).
- User scrolls — header stays sticky for context.
```

---

## M4.3 — Product Detail (КАСКО example)

```
SCREEN: M4.3 — Product detail page
PURPOSE: Show what a product covers, common questions, and a clear path to calculation. Generate the КАСКО version (ОСАГО reuses the same template with different content).
USER GOAL: Read what's included, expand FAQs, tap "Рассчитать".
ENTRY: From M4.1 product card OR deep link from landing.
EXIT: Sticky bottom CTA "Рассчитать" → M5.1 with КАСКО preselected.

LAYOUT
- White background.
- Top bar: 56 px, back arrow left, share icon right (24 px line icon), no title.
- Hero section (320 px tall, full-bleed):
  - Background: dark photo of a modern grey/black SUV on neutral asphalt, dark gradient overlay (#010101 80% bottom → 0% top).
  - Badge top-left over hero (24 px from edges): "Добровольно" pill, white background 90% opacity, text #010101 Inter SemiBold 12.
  - At bottom of hero (24 px from bottom): Mont Heavy 40 white "КАСКО" + Inter Regular 14 white 90% opacity "Защита авто от ущерба и угона".
- Content (24 px horizontal padding, 24 px from hero):
  - Section "Что входит" — Mont Bold 20 #010101.
  - 16 px gap. List of 5 feature rows (each 56 tall, gap 8): leading 32 px outline icon (Brand Red stroke), Inter SemiBold 14 #010101 title ("Угон и кража", "Ущерб от ДТП", "Стихийные бедствия", "Действия третьих лиц", "Помощь на дороге 24/7"), Inter Regular 13 #9A9AA0 short description.
  - 32 px gap.
  - Section "Сколько стоит" — Mont Bold 20.
  - 8 px gap. Card (radius 16, fill #F5F5F7, padding 20):
    - "от 2 400 000 сум / год" Mont Heavy 28 #010101.
    - Inter Regular 13 #9A9AA0 below: "Точная цена зависит от стоимости авто, водителей и опций. Расчёт занимает 1 минуту.".
  - 32 px gap.
  - Section "Часто спрашивают" — Mont Bold 20.
  - 16 px gap. 4 collapsible FAQ rows, each 56 tall collapsed (radius 12, border 1 #EAEAEC, padding 16): question Inter SemiBold 14, chevron-down right. One row expanded showing answer Inter Regular 14 #9A9AA0 in 3 lines, chevron-up.
    - Q1: "Что делать при ДТП?"
    - Q2 (expanded): "Можно ли застраховать старое авто?" → "Принимаем авто до 12 лет. Для авто старше — индивидуальный тариф, обратитесь в поддержку.".
    - Q3: "Как получить выплату?"
    - Q4: "Можно ли оформить КАСКО частями?"
- Sticky footer 80 px white with top shadow: full-width primary CTA "Рассчитать стоимость", height 56, radius 12, fill #E61428, white text Inter SemiBold 16.

COMPONENTS
- Hero with photo + badge + title.
- Feature list with outline icons.
- Price card.
- Collapsible FAQ list (one expanded shown).
- Sticky CTA.

STATES TO GENERATE
- default (one FAQ expanded as shown)
- all-collapsed FAQ variant

EDGE CASES
- Long FAQ answer — expandable card grows; sticky CTA always visible.
- Hero photo placeholder if asset missing — flat #010101 with car silhouette outline.
```

---

## M5.1 — Calculator Step 1 (Product type)

```
SCREEN: M5.1 — Calculator step 1 of 5: choose product
PURPOSE: First step of the tariff calculator — pick ОСАГО or КАСКО.
USER GOAL: Confirm product (often pre-selected from M4) and continue.
ENTRY: From M4.1, M4.2, M4.3, or M14 home "Калькулятор".
EXIT: Tap "Далее" with product selected → M5.2.

LAYOUT
- White background.
- Top bar: 56 px, back arrow left, title "Шаг 1 из 5" Mont Bold 16 centered, "Закрыть" link right Inter Medium 14 #9A9AA0.
- Below top bar: thin progress bar 4 px, fill #EAEAEC, with first 1/5 segment in #E61428.
- 24 px padding.
- Headline Mont Heavy 28 #010101 (2 lines): "Какой полис рассчитываем?".
- 8 px gap. Helper Inter Regular 14 #9A9AA0: "Выберите продукт — данные подтянутся на следующих шагах.".
- 24 px gap.
- Two large selectable cards (radius 16, height 120, gap 12):
  - ОСАГО — selected by default if user came from M4 ОСАГО path: border 2 px #E61428, fill #E61428 at 4% tint, red checkmark top-right (24 px), Mont Heavy 24 "ОСАГО", Inter Regular 13 #9A9AA0 "Обязательная страховка от ответственности".
  - КАСКО — unselected: border 1 px #EAEAEC, white fill, Mont Heavy 24 #010101, Inter Regular 13 #9A9AA0.
- 16 px gap.
- Info banner (radius 12, fill #F5F5F7, padding 16, line-icon info left): Inter Regular 13 #010101: "ОСАГО можно оформить отдельно. КАСКО рекомендуем оформлять вместе с ОСАГО — даём скидку 10%.".
- Sticky footer (80 px white): primary CTA "Далее" full-width, height 56, fill #E61428.

COMPONENTS
- Progress bar (1 of 5).
- Two product radio-cards.
- Info banner with discount hint.
- Sticky CTA.

STATES TO GENERATE
- default with ОСАГО selected
- variant with КАСКО selected

EDGE CASES
- If user picks both — UI does not allow; this is single-select. To buy both they go through calculator twice (note in `STITCH.md` for future bundle).
```

---

## M5.2 — Calculator Step 2 (Car)

```
SCREEN: M5.2 — Calculator step 2 of 5: choose vehicle
PURPOSE: Pick a car from the user's garage OR add a new one. New cars trigger NAPP autofill via license plate.
USER GOAL: Select a saved car or add a new one with one input.
ENTRY: From M5.1.
EXIT: Selected/added car → M5.3.

LAYOUT
- White background.
- Top bar: back arrow, "Шаг 2 из 5", "Закрыть".
- Progress bar: 2/5 in #E61428.
- 24 px padding.
- Headline Mont Heavy 28: "Какой автомобиль страхуем?".
- 24 px gap.
- "Из гаража" section label Inter SemiBold 13 #9A9AA0 uppercase.
- 12 px gap.
- List of garage cars (each card 96 tall, radius 16, border 1 #EAEAEC, gap 12):
  - Card structure: leading 64×64 photo (rounded 12) of the car, then Inter SemiBold 16 #010101 model "Chevrolet Cobalt 2020", Inter Regular 13 #9A9AA0 "01 A 123 BB", trailing radio circle 24 px.
  - Show 2 cards. First is selected: radio filled #E61428, card border 2 px #E61428.
  - Second unselected.
- 24 px gap.
- Divider with text "или" — thin #EAEAEC line + centered Inter Regular 13 #9A9AA0.
- 16 px gap.
- "Новый автомобиль" outline card (height 88, radius 16, dashed border 1.5 px #9A9AA0, fill white):
  - Centered: 32 px plus icon #E61428, Inter SemiBold 14 #010101 "Добавить авто по госномеру", Inter Regular 12 #9A9AA0 "Данные подтянем из NAPP".
- Sticky footer: "Далее" CTA, fill #E61428.

COMPONENTS
- Garage car list (radio-select).
- "Add new" dashed-border card.
- Progress bar.

STATES TO GENERATE
- default (with 2 garage cars, first selected)
- empty garage (no saved cars — show only "Добавить авто" card big and centered)
- after-tap-add (modal/bottom-sheet over the screen with input "Введите госномер" mask "01 A 123 BB", Inter SemiBold 18, primary CTA "Найти", helper Inter Regular 13 #9A9AA0 "Например: 01 A 123 BB")
- after-NAPP-success (bottom-sheet shows confirmation card "Chevrolet Cobalt 2020 · VIN KL1...", "Подтвердить" CTA + "Изменить" link)
- NAPP-error (sheet shows red icon + "Не нашли авто. Введите данные вручную" + outline button "Ввести вручную")

EDGE CASES
- License plate format support: standard Uzbek plate (01 A 123 BB), custom plates, foreign plates (block with hint "Только узбекские номера").
```

---

## M5.3 — Calculator Step 3 (Drivers)

```
SCREEN: M5.3 — Calculator step 3 of 5: drivers
PURPOSE: Add 1 or more drivers with age and experience — affects price.
USER GOAL: Add at least one driver (default = the user themselves), optionally more.
ENTRY: From M5.2.
EXIT: → M5.4.

LAYOUT
- White background.
- Top bar + progress bar 3/5.
- 24 px padding.
- Headline Mont Heavy 28: "Кто будет за рулём?".
- 8 px gap. Helper Inter Regular 14 #9A9AA0: "Добавьте всех, кто будет управлять авто. Минимум 1 водитель.".
- 24 px gap.
- Toggle (segmented control, height 44, radius 12, fill #F5F5F7, two pills):
  - "Ограниченный список" (selected — fill white, shadow soft, text #010101).
  - "Без ограничений" (text #9A9AA0).
- 16 px gap.
- Driver cards (each radius 16, border 1 #EAEAEC, padding 16, gap 12):
  - Driver 1 (filled): avatar circle 48 px (initials "ОА" Mont Bold 16 white on #010101), "Одилхон А." Inter SemiBold 16, "32 года · 8 лет стажа" Inter Regular 13 #9A9AA0. Right: edit pencil icon + delete trash icon.
  - Driver 2 (filled): "Шахзода А." "28 лет · 4 года стажа".
- 16 px gap.
- "Добавить водителя" outline button, height 52, radius 12, dashed border 1.5 #9A9AA0, leading + icon, text Inter SemiBold 14 #010101 centered.
- Sticky CTA "Далее".

COMPONENTS
- Segmented toggle (limited list / unlimited).
- Driver card list with edit/delete.
- "Add driver" dashed button.
- Bottom sheet form (separate frame): Add Driver form — full name, birthdate (date picker), license issue date (date picker), driving categories (chip multi-select B / B1 / C), CTA "Сохранить".

STATES TO GENERATE
- default with 2 drivers, "Ограниченный список" selected
- "Без ограничений" selected (cards section replaced with single info banner: "Полис покроет любого водителя. Цена выше на ~25%.")
- empty (no drivers — banner "Добавьте хотя бы одного водителя", CTA prominent)
- add-driver-sheet (bottom sheet 90% height with form fields)

EDGE CASES
- Driver under 21 or stage <2 years — show warning chip in card "Молодой водитель — надбавка +15%".
- Maximum 5 drivers — when reached, "Add" button disabled with helper.
```

---

## M5.4 — Calculator Step 4 (Period)

```
SCREEN: M5.4 — Calculator step 4 of 5: insurance period
PURPOSE: Pick policy duration (typically 1 year, sometimes 3/6 months or 24 months for КАСКО).
USER GOAL: Pick a duration and start date.
ENTRY: From M5.3.
EXIT: → M5.5 (КАСКО) or → M5.6 (ОСАГО, skipping extras).

LAYOUT
- White, top bar + progress 4/5, 24 px padding.
- Headline Mont Heavy 28: "На какой срок?".
- 8 px gap. Helper: "Стандартно — 1 год. Можно меньше или больше.".
- 24 px gap.
- Period chip group (4 pills in a wrap row, gap 8): "3 мес.", "6 мес.", "1 год" (selected, fill #E61428, white text), "2 года". Each pill height 40, padding 12 horizontal, radius 999, border 1 #EAEAEC for unselected.
- 24 px gap.
- Section "Дата начала" Inter SemiBold 13 #9A9AA0 uppercase.
- 12 px gap.
- Date row card (radius 16, border 1 #EAEAEC, padding 16, height 64): Inter SemiBold 16 "12 мая 2026" + chevron-right; tappable opens iOS-style date picker.
- 16 px gap.
- Computed end date row (read-only, height 64, fill #F5F5F7, radius 16, padding 16): Inter Regular 13 #9A9AA0 "Окончание: 11 мая 2027".
- 24 px gap.
- Info banner (radius 12, fill #F5F5F7, padding 16, info icon): Inter Regular 13 "Полис активируется в выбранный день 00:00 по местному времени.".
- Sticky CTA "Далее".

COMPONENTS
- Period pill chips (single-select).
- Start date card (opens picker).
- Computed end date.
- Info banner.

STATES TO GENERATE
- default (1 year selected, today + 6 days as start)
- date-picker-open (iOS native style modal at bottom)

EDGE CASES
- Past date — disabled in picker.
- Start more than 30 days ahead — show warning "Полис далеко. Подтвердите дату.".
```

---

## M5.5 — Calculator Step 5 (Extras, КАСКО only)

```
SCREEN: M5.5 — Calculator step 5 of 5: extras (КАСКО only)
PURPOSE: КАСКО-specific options — deductible (франшиза), risk coverage (theft / damage), assistance services. Not shown for ОСАГО (skip directly to M5.6).
USER GOAL: Adjust price by tweaking options.
ENTRY: From M5.4 if product = КАСКО.
EXIT: → M5.6.

LAYOUT
- White, top bar + progress 5/5, 24 px padding.
- Headline Mont Heavy 28: "Тонкая настройка".
- 8 px gap. Helper: "Можете пропустить — оставим базовый набор.".
- 24 px gap.
- Section "Франшиза" Inter SemiBold 13 #9A9AA0 uppercase.
- 8 px gap. Helper Inter Regular 13 #9A9AA0: "Сумма, которую вы платите сами при ущербе. Чем больше — тем дешевле полис.".
- 12 px gap.
- 4 chips: "0 сум" (selected #E61428), "500 000", "1 000 000", "3 000 000".
- 24 px gap.
- Section "Что покрываем".
- 12 px gap. Two toggle rows (each 64 tall, radius 16, border 1 #EAEAEC, padding 16):
  - Row 1: Inter SemiBold 14 "Угон и кража", Inter Regular 12 #9A9AA0 "+450 000 сум", iOS toggle right (on, fill #E61428).
  - Row 2: Inter SemiBold 14 "Действия третьих лиц", "+180 000 сум", toggle (on).
- 24 px gap.
- Section "Дополнительные услуги".
- 12 px gap. Three toggle rows similar:
  - "Помощь на дороге 24/7" "+90 000" toggle on.
  - "Эвакуатор" "+120 000" toggle off.
  - "Подменный авто" "+250 000" toggle off.
- Sticky CTA "Далее".

COMPONENTS
- Деductible chip group.
- Toggle rows with title + price delta + iOS-style toggle.

STATES TO GENERATE
- default (КАСКО with shown selections)
- all-extras-on (everything toggled — show price implication later in M5.6)

EDGE CASES
- For ОСАГО, this screen is skipped entirely.
```

---

## M5.6 — Calculator Result

```
SCREEN: M5.6 — Calculator result (price + breakdown)
PURPOSE: Show the final price with a breakdown so the user trusts the math, then convert to purchase.
USER GOAL: See total, optionally see breakdown, tap "Оформить".
ENTRY: From M5.5 (КАСКО) or M5.4 (ОСАГО).
EXIT: "Оформить" → M6.1 purchase summary. "Сохранить расчёт" → toast + return to M14. "Пересчитать" → back to M5.1 keeping selections.

LAYOUT
- White, top bar with back arrow + title Mont Bold 18 "Итоговый расчёт", "Закрыть" right.
- Progress bar fully filled #E61428 (5/5 done).
- 24 px padding.
- Hero price card (radius 24, fill #010101, padding 24, height ~180):
  - Top row: small KASKO chip white border, "КАСКО" Inter SemiBold 12 white.
  - Mont Heavy 48 white: "3 240 000 сум".
  - Inter Regular 14 #9A9AA0: "за 1 год".
  - Bottom row: small green check + Inter Regular 13 white 80% "Скидка 10% за КАСКО + ОСАГО учтена".
- 16 px gap.
- "Подробнее" expandable section (radius 16, border 1 #EAEAEC):
  - Header row tappable (height 56, padding 16): Inter SemiBold 14 "Из чего складывается цена" + chevron.
  - Expanded body: list of 6 lines (Inter Regular 14 #9A9AA0 left + Mont Bold 14 #010101 right):
    - "Госбаза (мин. тариф)"  "1 800 000 сум"
    - "Стаж водителей" "−120 000 сум"
    - "Доп. водитель" "+220 000 сум"
    - "Угон и кража" "+450 000 сум"
    - "Действия 3-х лиц" "+180 000 сум"
    - "Помощь на дороге" "+90 000 сум"
    - Divider 1 #EAEAEC.
    - "Скидка КАСКО + ОСАГО (10%)" "−380 000 сум" (in #1FAE6F).
    - "Итого" Mont Bold 16 #010101 "3 240 000 сум" #010101.
  - State default = expanded (we want to show the breakdown).
- 16 px gap.
- Summary chip row (3 chips, gap 8, scrollable horizontal): "Chevrolet Cobalt 2020", "2 водителя", "1 год", each pill 36 tall, fill #F5F5F7, text Inter Medium 13 #010101.
- Sticky footer (96 tall):
  - Top row: "Сохранить расчёт" outline button (50% width, height 48, radius 12, border 1 #010101, text #010101).
  - Right: empty space.
  - Below: full-width "Оформить за 3 240 000 сум" CTA, height 56, fill #E61428, white Inter SemiBold 16.

COMPONENTS
- Hero price card (dark).
- Expandable breakdown.
- Summary chip row.
- Two-action footer.

STATES TO GENERATE
- default (КАСКО example, expanded)
- ОСАГО variant (chip "ОСАГО", lower price like "420 000 сум", shorter breakdown — only госбаза / стаж / доп.водитель)
- save-toast (after "Сохранить расчёт": small bottom toast "Расчёт сохранён · Открыть" #010101 fill, white text)

EDGE CASES
- Если NAPP вернул "авто старше 12 лет" — показать предупреждение в hero "Авто старше 12 лет — индивидуальный тариф, оператор перезвонит".
- Долгая загрузка цены — skeleton hero + skeleton breakdown ~1.5 сек.
- Ошибка расчёта (бэкенд недоступен) — empty/error variant (см. M5.7).
```

---

## M5.7 — Saved Calculations / Recalculate

```
SCREEN: M5.7 — Saved calculations list
PURPOSE: Let the user revisit, edit, or buy a previously saved calculation. Also serves as fallback when calculator service is down.
USER GOAL: Re-open a saved calc, recalculate, or delete.
ENTRY: From M14 home → "Мои расчёты" OR from "Сохранить расчёт" toast → "Открыть".
EXIT: Tap a calc → M5.6 with that calc loaded. "Удалить" → confirm. "Новый расчёт" → M5.1.

LAYOUT
- White, top bar with back + title "Мои расчёты" + filter icon right.
- 24 px padding.
- Headline Mont Heavy 24 "Сохранённые расчёты".
- Inter Regular 13 #9A9AA0: "3 расчёта · последний 5 мая 2026".
- 16 px gap.
- List of cards (each radius 16, border 1 #EAEAEC, padding 16, gap 12):
  - Card 1: chip "КАСКО" red fill, Mont Bold 18 "3 240 000 сум · 1 год", Inter Regular 13 #9A9AA0 "Chevrolet Cobalt · 2 водителя", small "Сохранён 5 мая" caption, action chevron right.
  - Card 2: chip "ОСАГО", "420 000 сум · 1 год", "Chevrolet Cobalt · 1 водитель", "Сохранён 1 мая".
  - Card 3 (expired): grayed, badge "Истёк 30 апреля" #9A9AA0, "Пересчитать" link in card.
- "Новый расчёт" floating action button bottom-right (56×56 round, fill #E61428, white plus icon, shadow).

COMPONENTS
- Saved calc cards.
- FAB for new calculation.
- Empty state.
- Error state.

STATES TO GENERATE
- default (3 saved calcs)
- empty ("Нет сохранённых расчётов" + illustration of paper sheet, CTA "Сделать расчёт" centered)
- error / service-down (red banner top "Сервис расчёта временно недоступен. Сохранённые расчёты доступны для просмотра." + cards still listed but "Пересчитать" CTAs disabled)

EDGE CASES
- Calc older than 30 days — auto-marked "Истёк" because tariffs may have changed.
- Tap "Пересчитать" on expired — opens M5.1 with prefilled answers.
```

---

## Что отдаём дизайнеру с этим батчем

1. Этот файл (`STITCH_BATCH_2_M4_M5.md`).
2. `STITCH_BASE_PROMPT.md` (актуальный, обновлён 2026-05-06).
3. Лого и 3 референса из `assets/brand/`.

После генерации **10 экранов × 2 темы = 20 кадров** + 5 модалок/edge-cases (date-picker, add-driver-sheet, NAPP-success, NAPP-error, save-toast) ≈ **25 кадров**.

## После ревью батча 2 — переход к батчу 3

Батч 3 = **M6 Оформление полиса (resume → 4 шага → оплата → успех/ошибка) + M7 Платежи (карты, история, рассрочка) ≈ 10 экранов**. Это собственно checkout-флоу.
