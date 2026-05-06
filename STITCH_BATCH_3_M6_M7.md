# STITCH_BATCH_3 — M6. Оформление полиса + M7. Платежи

> **Батч 3 из 9.** Mobile, iOS frame 393×852. 11 экранов: 8 экранов M6 (резюме → 3 подтверждения → метод оплаты → WebView → успех → ошибка) + 3 экрана M7 (карты+история, добавление карты, рассрочка).
>
> **Как использовать:** в Stitch для каждого экрана последовательно вставляем:
> 1. **§1 BASE PROMPT** из `STITCH_BASE_PROMPT.md`
> 2. **§2.1 Mobile preset** из `STITCH_BASE_PROMPT.md`
> 3. **Screen prompt** из этого файла
>
> Прикладываем `assets/brand/logo.svg` + 3 референса. Каждый экран — light, потом dark.
>
> **Важно для checkout-флоу:** ошибки платежа должны быть спокойными и подробными (название обязывает — мы помощник). Никаких «упс».

---

## M6.1 — Purchase Summary (Резюме)

```
SCREEN: M6.1 — Purchase summary before checkout
PURPOSE: Final review of everything before payment — product, car, drivers, period, price, with edit-links for each section. Last point of trust before money leaves the user.
USER GOAL: Verify all data, fix anything wrong, tap "Перейти к оплате".
ENTRY: From M5.6 "Оформить" CTA.
EXIT: "Перейти к оплате" → M6.2 (first confirmation step) OR jump to M6.5 if all sections are pre-confirmed. Edit links → respective confirmation step.

LAYOUT
- White background.
- Top bar: 56 px, back arrow left, title "Оформление" Mont Bold 18, "Закрыть" link right.
- 4-step progress indicator just below top bar (height 32, 4 dots connected by hairline #EAEAEC, all inactive grey except none yet active — we're at "0/4" pre-flow).
- 24 px padding.
- Headline Mont Heavy 28 (2 lines): "Проверьте перед оплатой".
- 8 px gap. Helper Inter Regular 14 #9A9AA0: "Если что-то не так — нажмите «Изменить» в нужной секции.".
- 24 px gap.
- Stack of 4 review sections (each radius 16, border 1 #EAEAEC, padding 16, gap 12):
  - **Продукт** (small label Inter SemiBold 12 #9A9AA0 uppercase top-left, "Изменить" link top-right Inter Medium 13 #E61428).
    - Body: Mont Bold 16 "КАСКО · 1 год", Inter Regular 13 #9A9AA0 "Начало 12 мая 2026 — 11 мая 2027".
  - **Страхователь** ("Изменить" right):
    - Body: Mont Bold 16 "Алиев Одилхон", Inter Regular 13 #9A9AA0 "+998 90 123 45 67 · AB1234567".
  - **Автомобиль** ("Изменить" right):
    - Body: row with 48×48 car photo (rounded 8) + Mont Bold 16 "Chevrolet Cobalt 2020" + Inter Regular 13 #9A9AA0 "01 A 123 BB · VIN KL1...".
  - **Водители** ("Изменить" right):
    - Body: Mont Bold 16 "2 водителя", Inter Regular 13 #9A9AA0 "Алиев О., Алиева Ш.". Small chip-row below: 2 mini avatar chips with initials.
- 16 px gap.
- Price hero card (radius 24, fill #010101, padding 24, height 130):
  - Top row: Inter SemiBold 12 white 70% "К ОПЛАТЕ".
  - Mont Heavy 40 white "3 240 000 сум".
  - Inter Regular 13 white 70% "Скидка 10% уже учтена · 1 год защиты".
- Sticky footer 96 px white with top shadow:
  - Primary CTA "Перейти к оплате" full-width, height 56, radius 12, fill #E61428, white text Inter SemiBold 16 + small lock icon left.
  - Below CTA, 8 px: legal microcopy Inter Regular 11 #9A9AA0 centered: "Нажимая, вы соглашаетесь с условиями полиса.".

COMPONENTS
- Step progress indicator (4 dots).
- Review sections with edit links.
- Black price hero card.
- Sticky CTA with lock icon + legal microcopy.

STATES TO GENERATE
- default (КАСКО example as shown)
- ОСАГО variant (3 sections — no separate "Страхователь" if it equals user; price ~420 000)

EDGE CASES
- Inconsistency detected (e.g., driver age unclear) — show red badge "Требует подтверждения" on that section, CTA disabled until resolved.
- Promo code field — small "+ Применить промокод" link below price card; tapping opens bottom sheet.
```

---

## M6.2 / M6.3 / M6.4 — Confirmation Step Pattern (Страхователь / Авто / Водители)

```
SCREEN: M6.2 / M6.3 / M6.4 — Confirmation step (3 variants share one layout)
PURPOSE: Verify and lock the data going into the policy. Pre-filled from profile / NAPP / calculator; user can edit fields inline. This is regulatory-required because the policy is legally binding.
USER GOAL: Confirm or correct data and continue.
ENTRY: From M6.1 (or step-by-step from previous step).
EXIT: "Подтвердить" → next step. Final step → M6.5 (payment).

LAYOUT (shared)
- White background.
- Top bar: 56 px, back arrow, title centered "Шаг 1 из 4" / "Шаг 2 из 4" / "Шаг 3 из 4", "Закрыть" right.
- Progress strip 4 px below top bar — 1/4, 2/4, 3/4 filled in #E61428 respectively.
- 24 px padding.
- Headline Mont Heavy 28: 
  - M6.2: "Данные страхователя"
  - M6.3: "Данные автомобиля"
  - M6.4: "Данные водителей"
- 8 px gap. Helper Inter Regular 14 #9A9AA0 (per step):
  - M6.2: "Проверьте или исправьте — данные пойдут в полис.".
  - M6.3: "Подтянули из NAPP. Если есть ошибка — поправьте.".
  - M6.4: "Эти данные печатаются в полисе. Будьте внимательны.".
- 24 px gap.
- Stack of input rows (each row: small label Inter SemiBold 12 #9A9AA0 uppercase, 4 px gap, input field height 56, radius 12, border 1 #EAEAEC, focus border #E61428 2 px). Inputs vary by step:

  **M6.2 — Страхователь:**
  - "ФИО" (text, prefilled "Алиев Одилхон")
  - "Дата рождения" (date picker, "12.03.1994")
  - "Серия и номер паспорта" (mask "AB 1234567")
  - "Кем выдан" (text)
  - "Дата выдачи" (date)
  - "Адрес проживания" (multi-line, 2 rows)
  - "Телефон" (read-only chip #F5F5F7, "+998 90 123 45 67 · подтверждён")
  - Small note Inter Regular 12 #9A9AA0: "Чтобы сменить телефон, обратитесь в поддержку.".

  **M6.3 — Авто:**
  - Hero row: 64×64 car photo (rounded 12) + Mont Bold 18 "Chevrolet Cobalt 2020" + small green chip "Подтверждено NAPP".
  - "Госномер" (mask "01 A 123 BB", read-only with edit pencil — opens confirmation modal "Изменение госномера потребует переоформления").
  - "VIN" (read-only, masked except last 4 "KL1***1234").
  - "Год выпуска" (text 2020).
  - "Цвет" (chip-select "Белый" / "Чёрный" / "Серый" / "Синий" / "Красный" — pre-selected).
  - "Пробег, км" (numeric).
  - "Свидетельство о регистрации (СТС)" — upload card 96 tall: if uploaded shows thumbnail + "СТС загружен" green chip + replace icon; if missing shows dashed border + camera icon "Сфотографировать СТС".

  **M6.4 — Водители:**
  - Read-only list of 2 driver cards (radius 16, border 1 #EAEAEC, padding 16):
    - Each card: avatar circle 48 (initials Mont Bold), Mont Bold 16 name, Inter Regular 13 #9A9AA0 "Дата рождения · Стаж · Категории".
    - Trailing chevron — tappable to open sheet "Редактировать водителя" with form (full name, birthdate, licence series/number, issue date, categories).
  - Small note: "Чтобы добавить или удалить водителя, вернитесь в калькулятор.".

- Sticky footer: full-width "Подтвердить" CTA, height 56, fill #E61428.

COMPONENTS
- Form fields with labels.
- Read-only chips (e.g., "Подтверждён").
- Upload card for documents.
- Driver-edit sheet (separate frame).

STATES TO GENERATE
- default (each variant filled with sample data)
- M6.3 STS-missing variant (dashed upload, red helper "Без СТС полис не активируется")
- M6.4 driver-edit-sheet (bottom sheet with form fields)

EDGE CASES
- Validation: inline red border + helper Inter Regular 12 #E61428 on bad input (e.g., "Некорректный VIN").
- Long ФИО (uz-Cyrl) — input wraps to 2 lines, height grows.
- NAPP returns conflicting data — yellow banner top "Данные NAPP отличаются от введённых ранее. Что использовать?" with two pill buttons "NAPP" / "Мои".
```

---

## M6.5 — Payment Method

```
SCREEN: M6.5 — Choose payment method
PURPOSE: Pick how to pay — saved card, new Uzcard, or installment plan.
USER GOAL: Pick a method and proceed.
ENTRY: From M6.4.
EXIT: Saved card / new card → M6.6 (payment screen). Installment → M7.3 with policy context.

LAYOUT
- White background.
- Top bar with back, "Шаг 4 из 4", "Закрыть".
- Progress 4/4 filled #E61428.
- 24 px padding.
- Headline Mont Heavy 28: "Как заплатим?".
- 8 px gap. Helper: "Сейчас — Uzcard. Скоро — Click, Payme, Uzum.".
- 24 px gap.
- Section "Сохранённые карты" Inter SemiBold 13 #9A9AA0 uppercase (only shown if user has saved cards).
- 12 px gap. Card-row list (each 72 tall, radius 16, border 1 #EAEAEC, padding 16):
  - Row 1 (selected, border 2 #E61428 + tinted bg #E61428 4%): leading 40×28 Uzcard logo (red+blue, brand-correct), "Uzcard •• 4521" Inter SemiBold 16, "Срок до 12/28" Inter Regular 12 #9A9AA0, trailing radio filled #E61428.
  - Row 2: Humo logo (turquoise), "Humo •• 8843", "Срок до 03/27", radio empty.
- 24 px gap.
- "Новая карта" outline card (height 88, dashed border 1.5 #9A9AA0): + icon #E61428, Inter SemiBold 14 "Оплатить новой картой", Inter Regular 12 #9A9AA0 "Uzcard / Humo / Visa".
- 24 px gap.
- Section "Рассрочка" Inter SemiBold 13 #9A9AA0 uppercase.
- 12 px gap. Installment promo card (radius 16, fill #F5F5F7, padding 16):
  - Top row: leading icon (segmented bars) + Mont Bold 16 "Платить частями".
  - Inter Regular 13 #9A9AA0: "От 270 000 сум × 12 мес. — без переплат от партнёров SOS24.".
  - Trailing chevron right.
- 16 px gap.
- Bottom info banner (radius 12, fill #F5F5F7, padding 16, lock icon left): Inter Regular 12 #010101 "Платёж проходит через защищённый шлюз банка. Мы не храним данные карты.".
- Sticky footer: CTA "Оплатить 3 240 000 сум" with small lock icon, full-width, height 56, fill #E61428.

COMPONENTS
- Saved card rows (radio-select).
- "New card" outline card.
- Installment promo card (links to M7.3).
- Trust banner.

STATES TO GENERATE
- default (saved card selected)
- no-saved-cards (only "Новая карта" + "Рассрочка")
- new-card-selected (radio on dashed card highlights)

EDGE CASES
- Card expired — row dimmed with red badge "Истёк срок", radio disabled, "Удалить" link.
- User selects a card with insufficient daily limit — informational note, but don't block.
```

---

## M6.6 — Payment Screen (External 3DS)

```
SCREEN: M6.6 — Payment / 3DS gateway
PURPOSE: Submit the payment via Uzcard direct acquiring. Either a native form (saved card scenario) or an embedded WebView for 3DS challenge.
USER GOAL: Enter CVV / 3DS code, complete payment.
ENTRY: From M6.5.
EXIT: Success → M6.7. Failure → M6.8.

LAYOUT (Native form variant — used when paying with a saved card and no 3DS challenge)
- White background.
- Top bar: 56 px, secured-lock icon left + "Оплата защищена" Inter SemiBold 14 #010101 — NOT a back arrow (we don't want the user dropping mid-payment; show only "Отменить" right Inter Medium 14 #9A9AA0).
- 24 px padding.
- Hero card (radius 24, fill #010101, padding 24, height 130):
  - "К ОПЛАТЕ" Inter SemiBold 12 white 70%.
  - Mont Heavy 40 white "3 240 000 сум".
  - Inter Regular 13 white 70% "КАСКО · Chevrolet Cobalt".
- 24 px gap.
- Card preview block (radius 16, border 1 #EAEAEC, padding 16): leading Uzcard logo, Inter SemiBold 16 "Uzcard •• 4521", chip "Изменить" outline #E61428 right.
- 16 px gap.
- CVV input field (label "CVV / CVC", height 56, radius 12, type=password, max 3 digits, centered Mont Bold 24, focus border #E61428 2 px).
- 8 px gap. Helper Inter Regular 12 #9A9AA0 centered: "Три цифры на обороте карты.".
- 32 px gap.
- Primary CTA "Оплатить" with lock icon, full-width, height 56, fill #E61428.
- 16 px gap.
- "Отменить оплату" text-link centered, Inter Medium 14 #9A9AA0.

LAYOUT (3DS WebView variant — used for new cards or when bank requires SCA)
- Same top bar.
- 0 px padding — embedded bank WebView fills below top bar to footer.
- Bottom footer 56 px white with small lock + "Защищённое соединение · банк-эквайер" Inter Regular 12 #9A9AA0.

COMPONENTS
- Lock-icon header (no back arrow).
- Black price hero card.
- Saved-card preview row.
- CVV input.
- WebView container (separate frame).

STATES TO GENERATE
- native-form-default (CVV empty)
- native-form-loading (CTA shows spinner, screen blurred behind a small modal "Подтверждаем платёж...")
- 3ds-webview (placeholder bank UI inside the embedded view — show generic SMS-code form labeled "БАНК · введите код 1234")
- timeout (after 5 min — modal "Время сессии истекло. Начнём заново?" with two buttons)

EDGE CASES
- User taps "Отменить" — confirm dialog: "Прервать оплату? Полис не будет выпущен.".
- Network drops mid-payment — WebView shows reconnecting, then fallback to error screen if not recovered in 30s.
- iOS background → resume — re-validate session.
```

---

## M6.7 — Success «Полис выпущен!»

```
SCREEN: M6.7 — Success / policy issued
PURPOSE: Celebrate, confirm the policy is live, and route the user to their primary post-purchase actions.
USER GOAL: See proof, save QR / PDF, or jump to Мои полисы.
ENTRY: From M6.6 on success.
EXIT: "Открыть QR" → M8.X policy detail with QR pre-opened. "Скачать PDF" → triggers download. "На главную" → M14.

LAYOUT
- Background: full-screen #010101 hero (60%) + white bottom (40%) with rounded top corners 24.
- Hero (top 60%):
  - At ~30% from top: large 96 px circular badge — circle filled #1FAE6F (success green) with white check icon centered. Subtle green glow ring at 30% opacity.
  - 24 px below badge: Mont Heavy 32 white centered "Полис выпущен".
  - 8 px below: Inter Regular 14 white 70% centered, 2 lines "Поздравляем! Ваш КАСКО уже действует. Документ в приложении и на e-mail.".
  - Subtle confetti particles in red/white (decorative, off to the side).
- Bottom sheet (40%, white, padding 24):
  - Policy summary card (radius 16, fill #F5F5F7, padding 16):
    - Top: chip "КАСКО" red fill, Mont Bold 16 "AB 1234567" (policy number).
    - Inter Regular 13 #9A9AA0 "Действует до 11 мая 2027 · Chevrolet Cobalt".
    - Bottom row: Mont Bold 14 #010101 "3 240 000 сум" + small chip "Оплачено" green.
  - 16 px gap.
  - Primary CTA "Открыть QR-полис" full-width, height 56, fill #E61428, leading QR icon.
  - 12 px gap.
  - Secondary CTA "Скачать PDF" outline, height 52, border 1 #010101, leading download icon.
  - 12 px gap.
  - Tertiary text-link "На главную", centered, Inter Medium 14 #9A9AA0.

COMPONENTS
- Success hero (dark + green badge).
- Policy summary card.
- Three-tier CTA stack (QR / PDF / home).

STATES TO GENERATE
- default

EDGE CASES
- ОСАГО variant — chip "ОСАГО", different policy number prefix.
- E-mail not on file — show small note "Полис не отправлен — добавьте e-mail в профиле" with link.
- Slow PDF generation — "Скачать PDF" shows spinner state for ~3s then triggers download.
```

---

## M6.8 — Error «Платёж не прошёл»

```
SCREEN: M6.8 — Payment error
PURPOSE: Explain calmly what failed, give clear next actions, never leave the user stuck.
USER GOAL: Understand what to do — retry, switch method, or contact support.
ENTRY: From M6.6 on failure (any cause).
EXIT: "Попробовать снова" → back to M6.6 same method. "Сменить способ" → M6.5. "Связаться с поддержкой" → M13 chat.

LAYOUT
- White background (NOT red — we don't want panic).
- Top bar: 56 px, "Закрыть" link right only.
- 24 px padding.
- 32 px gap from top.
- Centered icon: 96 px circular badge, fill #E61428 at 8% tint, with red exclamation icon centered (line, 40 px). NOT a scary red fill.
- 24 px gap. Mont Heavy 28 #010101 centered: "Платёж не прошёл".
- 8 px gap. Inter Regular 15 #9A9AA0 centered, 2 lines (variable based on cause): "Банк отклонил операцию. Деньги не списаны.".
- 24 px gap.
- Cause-detail card (radius 16, fill #F5F5F7, padding 16):
  - Inter SemiBold 13 #9A9AA0 uppercase "ПРИЧИНА".
  - 4 px gap. Inter SemiBold 14 #010101 "Недостаточно средств на карте Uzcard •• 4521.".
  - 12 px gap. Inter SemiBold 13 #9A9AA0 uppercase "ЧТО ДЕЛАТЬ".
  - 4 px gap. Inter Regular 14 #010101, bullet list:
    - "• Пополните карту и попробуйте снова."
    - "• Используйте другую карту."
    - "• Оформите рассрочку — без переплат у партнёров."
- 24 px gap.
- Three stacked CTAs:
  - Primary "Попробовать снова" — full-width, height 56, fill #E61428.
  - Secondary "Сменить способ оплаты" — outline, height 52, border 1 #010101.
  - Tertiary text-link "Связаться с поддержкой" centered, Inter Medium 14 #9A9AA0.
- 16 px gap.
- Footnote Inter Regular 12 #9A9AA0 centered: "Код ошибки: ERR_INSUFFICIENT · 12:34 06.05.2026".

COMPONENTS
- Calm circular icon (red on tint, not full red).
- Cause-detail card with reason + remedies.
- Three-tier CTA stack.
- Error code footnote (helps support).

STATES TO GENERATE
- default (insufficient funds)
- variant: "3DS не подтверждён" (cause text + bullets adjusted: "• Дождитесь SMS от банка / • Проверьте, не заблокированы ли SMS / • Попробуйте сохранённой картой")
- variant: "Платёж в обработке" (yellow tint icon, text "Банк ещё подтверждает. Мы пришлём пуш, когда узнаем результат.", primary CTA disabled, only "На главную")

EDGE CASES
- Payment double-charge prevention: even on error, show "Если средства всё же списались — деньги вернутся в течение 3 банковских дней. Код ERR_..." in footnote.
- Multiple consecutive failures (3+) — auto-suggest support chat.
```

---

## M7.1 — Cards & Payment History

```
SCREEN: M7.1 — Cards and payment history
PURPOSE: Manage saved payment methods and view all past payments. Two tabs.
USER GOAL: See / remove cards, browse history, find a receipt.
ENTRY: From M2 profile → "Платежи" OR from M6.5 "Мои карты" link.
EXIT: Tap "Добавить карту" → M7.2. Tap a payment row → receipt detail (covered in M12 documents). Card delete → confirm modal.

LAYOUT
- White background.
- Top bar: back arrow, title Mont Bold 18 "Платежи".
- Tab bar (segmented, height 44, radius 12, fill #F5F5F7, 24 px horizontal margin):
  - "Карты" (selected, white fill, shadow soft, text #010101 Inter SemiBold 14).
  - "История" (text #9A9AA0).
- 24 px padding.

[Карты tab content]
- Section title Inter SemiBold 13 #9A9AA0 uppercase: "Сохранённые карты · 2".
- 12 px gap.
- Card list (each 80 tall, radius 16, border 1 #EAEAEC, padding 16):
  - Row 1: Uzcard logo, "Uzcard •• 4521", "Срок до 12/28", trailing kebab menu icon (3 dots).
  - Row 2: Humo logo, "Humo •• 8843", "Срок до 03/27", kebab.
- 16 px gap.
- "Добавить карту" outline card (height 72, dashed border 1.5 #9A9AA0, plus icon + text Inter SemiBold 14 "Привязать новую карту", helper Inter Regular 12 #9A9AA0 "Через защищённый шлюз банка").
- Bottom info banner: lock icon + "Карты привязаны через прямой эквайринг Uzcard. Мы не храним полные номера." Inter Regular 12 #9A9AA0.

[История tab content — second frame]
- Filter chip-row (horizontal scroll, gap 8): "Все", "Полисы", "Рассрочка", "Возвраты" (selected: red fill #E61428).
- Date grouping section:
  - Header Inter SemiBold 13 #9A9AA0 uppercase "МАЙ 2026".
  - List of payment rows (each 72 tall, divided by hairline #EAEAEC):
    - Row: leading 40 round icon (different per category), Inter SemiBold 14 "КАСКО · AB1234567" + Inter Regular 12 #9A9AA0 "06 мая · Uzcard •• 4521", trailing Mont Bold 14 #010101 "−3 240 000 сум" + small green chip "Оплачено".
  - "АПРЕЛЬ 2026" header — second group.
- Tap a row → opens receipt detail (separate flow in M12).

COMPONENTS
- Segmented tabs.
- Card-row with kebab menu (Make default / Remove).
- Add-card dashed outline card.
- Trust banner.
- Payment history grouped by month.
- Category filter chips.

STATES TO GENERATE
- cards-tab default (2 cards)
- cards-tab empty (only "Добавить карту" big and centered + illustration)
- history-tab default (multiple month groups)
- history-tab empty (illustration + "У вас пока нет платежей")
- card-kebab-open (action sheet from bottom: "Сделать основной" / "Удалить" red)

EDGE CASES
- Card delete confirm: "Удалить Uzcard •• 4521? Если есть автоплатежи, они не пройдут.".
- Refund row in history — leading icon green up-arrow, amount in green, chip "Возврат".
```

---

## M7.2 — Add Card

```
SCREEN: M7.2 — Add new card
PURPOSE: Securely tokenize a new card via Uzcard direct acquiring.
USER GOAL: Enter card number, expiry, CVV, complete optional 3DS, finish.
ENTRY: From M7.1 "Добавить карту" or M6.5 "Новая карта".
EXIT: Success → toast "Карта добавлена" + return to entry screen with new card pre-selected if from M6.5. Failure → inline error or M6.8-style screen.

LAYOUT
- White background.
- Top bar: lock icon left + "Защищённое подключение" Inter SemiBold 14, "Закрыть" right.
- 24 px padding.
- Headline Mont Heavy 28: "Привязка карты".
- 8 px gap. Helper Inter Regular 14 #9A9AA0: "Спишем 1 сум для подтверждения и сразу вернём.".
- 24 px gap.
- Card visual (skeuomorphic preview, height 200, radius 16, gradient #010101 → #2A2A2D, padding 24):
  - Top-right: small Uzcard / Humo / Visa logo (auto-detect from BIN as user types).
  - Center-left: Mont Bold 24 white card number with mask "1234 5678 9012 3456" — updates live as user types.
  - Bottom-left: Inter Medium 13 white 80% "ИМЯ ДЕРЖАТЕЛЯ" label, then Inter SemiBold 14 white "ALIYEV ODILXON" — updates as user types.
  - Bottom-right: "MM/YY" label, then "12/28".
- 24 px gap.
- Form fields:
  - "Номер карты" (input, height 56, radius 12, mask "0000 0000 0000 0000", numeric).
  - Two side-by-side fields (gap 12):
    - "Срок (MM/YY)" mask "00/00".
    - "CVV" type=password, max 3 digits.
  - "Имя на карте" (text, uppercase auto, "ALIYEV ODILXON").
- 16 px gap.
- Checkbox row: 24 px square checkbox + Inter Regular 14 "Сделать основной картой" (default off).
- Sticky footer: CTA "Привязать карту" full-width, height 56, fill #E61428.
- Below CTA, footnote: "Платёж проходит через защищённый шлюз банка. SOS24 не получает полный номер карты." Inter Regular 11 #9A9AA0 centered.

COMPONENTS
- Skeuomorphic card preview (live updates).
- Card-number / expiry / CVV form.
- Trust footnote.

STATES TO GENERATE
- default (empty)
- typing (partial card number filled, BIN detected → Uzcard logo on preview)
- error (invalid CVV — red border + helper "Неверный CVV")
- 3ds-modal (bank SMS code form in bottom sheet 60%)

EDGE CASES
- Foreign cards (BIN = non-UZ) — show banner "Эта карта не поддерживается. Принимаем Uzcard, Humo, Visa, выпущенные в Узбекистане.".
- Card already saved — "Эта карта уже привязана" message.
```

---

## M7.3 — Installment Plans (Рассрочка)

```
SCREEN: M7.3 — Installment plans selector
PURPOSE: Show available installment plans (own + BNPL partners) so the user can split a policy payment into monthly chunks. BNPL providers (Uzum Nasiya / Alif / Anor) are pending approval — show them as "скоро".
USER GOAL: Compare plans, pick one, proceed to provider's flow.
ENTRY: From M6.5 "Рассрочка" link.
EXIT: Tap "Оформить" on a plan → external flow for that provider (out of scope for our screens, just hand-off). "Скоро доступно" plans non-tappable.

LAYOUT
- White background.
- Top bar: back arrow, title Mont Bold 18 "Рассрочка".
- 24 px padding.
- Headline Mont Heavy 28 (2 lines): "Платите частями — без переплат".
- 8 px gap. Helper Inter Regular 14 #9A9AA0 (2 lines): "Сумма полиса делится на месяцы. Партнёры дают рассрочку, мы — выдаём полис сразу.".
- 24 px gap.
- Summary chip-row (gap 8): "КАСКО · 3 240 000 сум" pill #F5F5F7.
- 16 px gap.
- Plan cards (each radius 16, border 1 #EAEAEC, padding 16, gap 12):
  - **Card 1 — SOS24 (own, primary):**
    - Top: leading 40 round logo (red SOS24 mark) + Mont Bold 16 "SOS24 · 6 мес." + chip "Без переплат" green fill, white text.
    - Mont Heavy 24 #010101 "540 000 сум / мес.".
    - Inter Regular 13 #9A9AA0 "Итого 3 240 000 сум · Без переплат · Авто-списание с карты".
    - Trailing chevron.
  - **Card 2 — Uzum Nasiya (partner, "скоро"):**
    - Logo Uzum + Mont Bold 16 "Uzum Nasiya · 12 мес." + chip "Скоро" outline #9A9AA0.
    - Mont Heavy 24 #9A9AA0 (greyed) "270 000 сум / мес.".
    - Inter Regular 13 #9A9AA0 "Итого 3 240 000 сум · 0% · Подтверждение в Uzum app".
    - Card dimmed at 60% opacity, no chevron, non-tappable.
  - **Card 3 — Alif (partner, "скоро"):**
    - Logo + "Alif · 6 мес.", same structure, "540 000 сум / мес.", greyed.
  - **Card 4 — Anor Bank (partner, "скоро"):**
    - Same pattern.
- 16 px gap.
- Info card (radius 12, fill #F5F5F7, padding 16, info icon): Inter Regular 13 #010101 "Партнёрские рассрочки в скором времени. Оформление займёт 1–2 минуты прямо в их приложении.".
- 16 px gap.
- FAQ-style collapsible row "Как это работает?" — expandable.

COMPONENTS
- Plan card with chip + price-per-month + total breakdown.
- Disabled "скоро" variant (60% opacity).
- Info banner.
- FAQ row.

STATES TO GENERATE
- default (1 active plan + 3 "скоро")
- partner-active (variant where Uzum is live — chip "Без переплат", card tappable, primary plan)
- approval-pending (variant where SOS24 plan asks user "Подтвердите доход" with extra step)

EDGE CASES
- User had previous installment overdue — block with banner "У вас есть просрочка. Свяжитесь с поддержкой.".
- Total too low for installment (< 500 000 сум) — banner "Рассрочка доступна от 500 000 сум".
```

---

## Что отдаём дизайнеру с этим батчем

1. Этот файл (`STITCH_BATCH_3_M6_M7.md`).
2. Актуальный `STITCH_BASE_PROMPT.md`.
3. Лого + 3 референса.

После генерации **11 экранов × 2 темы = 22 кадра** + ~7 модалок/состояний (3DS WebView, payment loading, NAPP-conflict banner, card-kebab sheet, error variants, 3DS bank SMS, installment partner-active) ≈ **30 кадров**.

## Открытые вопросы для клиента (флэг в `QUESTIONS.md` после ревью)

- **Промокоды:** показываем ли поле «Применить промокод» в M6.1? Если да — нужны правила (валидация на бэке, ограничения, маркетинговая логика).
- **E-mail обязателен?** В M6.7 предполагаем, что полис уходит на e-mail. Если поля e-mail нет в профиле — нужно решить: блокировать checkout или сделать опциональным.
- **Расчёт возврата при аннуляции:** в `STITCH.md` указано «100% возврат без расчёта по дням» для M8 — подтвердить, что это применимо ко всем продуктам (а не только в течение cooling-off).
- **BNPL партнёры:** Uzum Nasiya / Alif / Anor — на каком этапе согласования? От этого зависит, рисуем ли «скоро» или сразу активные карточки.

## После ревью батча 3 — переход к батчу 4

Батч 4 = **M8 Мои полисы + M3 Гараж + M14 Главный экран** (~10 экранов) — основное использование приложения после покупки.
