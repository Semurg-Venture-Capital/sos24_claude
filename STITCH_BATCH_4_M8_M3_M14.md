# STITCH_BATCH_4 — M14. Главный + M8. Мои полисы + M3. Гараж

> **Батч 4 из 9.** Mobile, iOS frame 393×852. 10 экранов: 1 главный + 5 полисы (список, детали, fullscreen QR, условия, аннуляция) + 4 гараж (список, добавление авто, карточка, удаление).
>
> **Как использовать:** в Stitch для каждого экрана последовательно вставляем:
> 1. **§1 BASE PROMPT** из `STITCH_BASE_PROMPT.md`
> 2. **§2.1 Mobile preset** из `STITCH_BASE_PROMPT.md`
> 3. **Screen prompt** из этого файла
>
> Прикладываем `assets/brand/logo.svg` + 3 референса. Каждый экран — light, потом dark.
>
> **Особенности батча:** это «дом» приложения — то, что пользователь видит каждый день. Брендовая SOS-кнопка на главном — ключевой визуальный якорь. QR-полис — функционально критичен (показывают ГАИ в полевых условиях, должен быть читаем при ярком солнце).

---

## M14.1 — Home Screen (Main, after login)

```
SCREEN: M14.1 — Home / main screen after login
PURPOSE: The daily entry point. Shows greeting, the active policy with a one-tap QR shortcut, primary actions (including the prominent "SOS — заявить ДТП" button), recent notifications, and a CMS-driven promo block.
USER GOAL: At a glance — see policy status, get to QR fast, or trigger an emergency action.
ENTRY: After M1.7/M1.8 sign-in, every cold start (returning user), tap on "Главная" tab.
EXIT: Policy card tap → M8.2. QR shortcut → M8.3. "SOS — заявить ДТП" → M9.1 entry. "Вызвать комиссара" → M9.1.X. "Купить полис" → M4.1. "Калькулятор" → M5.1. "Партнёры рядом" → partner map (out of scope this batch). Notification row → M11.

LAYOUT
- White background (light) / #010101 (dark).
- Status bar: 9:41 + Dynamic Island.
- Top bar (height 64, NOT a typical title bar — this is a personalized header):
  - Left (24 px from edge): 40 px round avatar with user initials in Mont Bold 14 white on #E61428 background.
  - Center-left next to avatar: Inter Regular 13 #9A9AA0 "Доброе утро,"; below it Mont Bold 18 #010101 "Карим".
  - Right (24 px from edge): 24 px outline bell icon with red dot badge (#E61428, 6 px) when unread; tap → M11.
- 24 px horizontal padding for the rest.
- 16 px gap.
- **Active policy hero card** (radius 24, fill #010101, padding 20, height ~180):
  - Top-left: chip "АКТИВЕН" green fill #1FAE6F, white text Inter SemiBold 11 padding 4×10 radius 999.
  - Top-right: small Mont Bold 14 white 80% "до 11 мая 2027".
  - 12 px gap. Mont Heavy 24 white "КАСКО · Chevrolet Cobalt".
  - 4 px gap. Inter Regular 13 white 70% "AB 1234567 · 01 A 123 BB".
  - Bottom row (16 px from bottom): two side-by-side actions:
    - QR shortcut card (height 56, radius 12, fill rgba(255,255,255,0.08), border 1 rgba(255,255,255,0.2), padding 12): small QR icon + Inter SemiBold 14 white "Показать QR" + chevron-right.
    - "Подробнее" outline pill (height 56, equal width, radius 12, border 1 rgba(255,255,255,0.2), text Inter SemiBold 14 white centered).
- 24 px gap.
- **Quick actions section**:
  - Section title Inter SemiBold 13 #9A9AA0 uppercase "БЫСТРЫЕ ДЕЙСТВИЯ".
  - 12 px gap.
  - **Hero SOS button** — full-width, height 88, radius 16, fill #E61428, padding 20:
    - Left: 48 px round white circle with red exclamation icon centered.
    - Mont Heavy 22 white "SOS — заявить ДТП".
    - Inter Regular 13 white 80% "Запишем место, фото, отправим.".
    - Trailing chevron-right white.
    - **Subtle red glow / shadow around the card** — this is THE signature element.
  - 12 px gap.
  - **Secondary action grid** — 2×2 grid of cards (each 48% width, height 96, gap 12):
    - "Вызвать комиссара" — fill #2A2A2D (dark even in light theme — emphasizes urgency), white Mont Bold 15 + outline car-tow icon white + Inter Regular 11 white 70% "Приедет за 30 мин".
    - "Купить полис" — fill #F5F5F7, #010101 text, Mont Bold 15, outline shield-plus icon, Inter Regular 11 #9A9AA0 "ОСАГО / КАСКО".
    - "Калькулятор" — fill #F5F5F7, Mont Bold 15, calculator icon, Inter Regular 11 #9A9AA0 "Узнать цену".
    - "Партнёры рядом" — fill #F5F5F7, Mont Bold 15, map-pin icon, Inter Regular 11 #9A9AA0 "СТО, клиники".
- 24 px gap.
- **Notifications strip** (only shown if any unread):
  - Section title with link right "Уведомления" + "Все →" Inter Medium 13 #E61428.
  - 12 px gap. Stack of up to 3 notification rows (radius 12, border 1 #EAEAEC, padding 12, gap 8):
    - Each: leading 32 round icon (color-coded by category — info/blue, warning/orange, success/green), Inter SemiBold 13 title (1 line, truncate), Inter Regular 12 #9A9AA0 timestamp ("2 ч. назад").
  - Sample rows:
    - Info: "Полис продлевается через 30 дней" "вчера".
    - Success: "Заявление WX-12345 одобрено" "5 мая".
- 24 px gap.
- **Promo block (CMS)** — full-width card height 140, radius 16, gradient #010101 → #2A2A2D, padding 20:
  - Small chip "АКЦИЯ" white border, white text Inter SemiBold 11.
  - Mont Bold 18 white "+10% к КАСКО при оформлении вместе с ОСАГО".
  - Inter Regular 12 white 70% "Скидка автоматически применится в калькуляторе.".
  - Small chevron right.
- 32 px gap (clearance for bottom tab bar).
- **Bottom tab bar** (5 items, height 80, white with hairline-top #EAEAEC):
  - "Главная" (active — red icon + red Mont SemiBold 11 label).
  - "Полисы" — outline shield icon, label "Полисы".
  - "Гараж" — outline car icon.
  - "Заявления" — outline doc-list icon.
  - "Профиль" — outline user icon.

COMPONENTS
- Personalized header (avatar, greeting, bell with badge).
- Active policy hero card (dark) with QR shortcut + Подробнее.
- Hero SOS button (signature red, with glow).
- 2×2 secondary action grid (one urgent dark + three light).
- Notifications strip with category icons.
- CMS promo block (dark gradient).
- Bottom tab bar with active state.

STATES TO GENERATE
- default (1 active policy, 2 notifications, promo present)
- no-active-policy (hero card replaced with "У вас нет активного полиса" empty card with red CTA "Купить полис" — keep SOS button still visible, ДТП может случиться без полиса)
- multiple-policies (hero becomes a horizontal swipeable carousel — 2-3 cards with dot indicator below)
- no-notifications (notifications strip omitted, gap collapses)
- promo-empty (no CMS promo — section omitted)

EDGE CASES
- Long Uzbek name in greeting — truncate with ellipsis.
- Time-of-day greeting auto-switches: "Доброе утро / день / вечер / ночи".
- Active policy near expiry (< 7 days) — chip changes from "АКТИВЕН" green to "ИСТЕКАЕТ" warning #F5A623 with countdown.
- Critical alert (e.g., open claim) — sticky red banner at very top above header: "Заявление WX-12345 требует фото — открыть".
```

---

## M8.1 — My Policies List

```
SCREEN: M8.1 — My policies (list with tabs)
PURPOSE: Browse all policies, filtered by Active vs Archive.
USER GOAL: Find a policy, open its details.
ENTRY: Bottom tab "Полисы".
EXIT: Tap a policy card → M8.2. Tap "+ Купить новый" FAB → M4.1. Tap empty-state CTA → M4.1.

LAYOUT
- White background.
- Top bar: 56 px, title Mont Bold 18 "Мои полисы", filter icon right.
- Tab bar (segmented, height 44, radius 12, fill #F5F5F7, 24 px horizontal margin):
  - "Активные · 1" (selected, white pill, shadow soft, Inter SemiBold 14 #010101).
  - "Архив · 3" (Inter SemiBold 14 #9A9AA0).
- 24 px padding.
- 16 px gap.

[Активные tab content]
- Stack of policy cards (radius 16, border 1 #EAEAEC, padding 16, gap 12):
  - Card structure (each ~140 tall):
    - Top row: chip "АКТИВЕН" #1FAE6F + product chip "КАСКО" red (or "ОСАГО" red outline) + spacer + small kebab top-right.
    - 12 px gap. Hero row: 56×56 car photo (rounded 12) on left + Mont Bold 18 "Chevrolet Cobalt 2020" + Inter Regular 13 #9A9AA0 "01 A 123 BB · AB 1234567".
    - 12 px gap. Footer row: leading "до 11 мая 2027" Inter Regular 13 #9A9AA0 + trailing Mont Bold 14 #010101 "3 240 000 сум".
    - Linear progress bar 4 px below footer (full-width inside padding) — red fill proportional to time remaining (e.g., 90% of bar filled #E61428 means 90% of period left).
  - Sample: 1 active card (КАСКО).
- FAB bottom-right: 56 round, fill #E61428, white plus icon, shadow.

[Архив tab content — second frame]
- List of dimmed policy cards (60% opacity), structure same but:
  - Chip "ИСТЁК" Neutral 400 fill, white text.
  - "Завершён 15 апреля 2026" Inter Regular 13 #9A9AA0.
  - Tap reveals detail in M8.2 (read-only / archive mode).

COMPONENTS
- Tab bar with counts.
- Policy card with progress bar.
- FAB.
- Empty state.

STATES TO GENERATE
- active-tab-default (1 active policy)
- active-tab-empty (illustration of car + shield + "У вас пока нет активных полисов" + primary CTA "Купить полис")
- archive-tab-default (3 expired policies)
- archive-tab-empty ("Архив пуст")
- soon-to-expire variant (chip "ИСТЕКАЕТ ЧЕРЕЗ 5 ДНЕЙ" #F5A623 + prominent "Продлить" outline button on the card)

EDGE CASES
- Multi-car user — cards grouped by car? For now: flat list, sort by expiry desc.
- Filter (top-right icon) opens bottom sheet: filter by product (ОСАГО/КАСКО), by car (multi-select).
```

---

## M8.2 — Policy Detail

```
SCREEN: M8.2 — Policy detail (main hub for one policy)
PURPOSE: One policy's full info plus all actions: QR, PDF, conditions, ДТП, комиссар, аннулировать, продлить.
USER GOAL: Find what they need fast — usually QR (~80% of opens) or "вызвать комиссара".
ENTRY: From M14.1 hero or M8.1 card.
EXIT: "Показать QR" → M8.3 fullscreen. "Скачать PDF" → toast with download. "Условия и покрытие" → M8.4 sheet. "Заявить о ДТП" → M9.1. "Вызвать комиссара" → M9.1.X. "Аннулировать" → M8.5. "Продлить" → M5.1 with prefilled.

LAYOUT
- White background.
- Top bar: 56 px, back arrow left, title Mont Bold 18 "Полис AB 1234567" centered, share icon right.
- 24 px padding.
- **Big QR shortcut card** (radius 24, fill #010101, padding 24, height 200) — this is the primary intent of opening this screen:
  - Top: Inter SemiBold 12 white 70% "ПОКАЖИТЕ ИНСПЕКТОРУ ГАИ".
  - Center-left: Mont Heavy 28 white "Открыть QR".
  - Center: large QR preview (96×96) on the right, white background card behind it (radius 12, padding 8).
  - Bottom-right: chevron icon white.
  - Whole card tappable → M8.3 fullscreen QR.
- 16 px gap.
- **Status row card** (radius 16, fill #F5F5F7, padding 16, height 80):
  - Left half: chip "АКТИВЕН" #1FAE6F + Mont Bold 16 "до 11 мая 2027" + Inter Regular 12 #9A9AA0 "осталось 364 дня".
  - Right half: Mont Bold 16 #010101 "3 240 000 сум" + Inter Regular 12 #9A9AA0 "оплачен".
- 24 px gap.
- **Actions grid** — 2×2 (each card 48% width, height 88, radius 16, gap 12):
  - "Заявить о ДТП" — fill #E61428, white text Mont Bold 14, leading exclamation icon white, subtitle "Открыть форму".
  - "Вызвать комиссара" — fill #2A2A2D (dark accent), white text, car-tow icon, "Приедет за 30 мин".
  - "Скачать PDF" — fill #F5F5F7, #010101 text, download icon, Inter Regular 11 #9A9AA0 "Полис в PDF".
  - "Условия и покрытие" — fill #F5F5F7, doc icon, Inter Regular 11 "Что покрывает полис".
- 24 px gap.
- **Details list** — flat key-value list (each row 48 tall, divided by hairline #EAEAEC):
  - "Продукт" → "КАСКО"
  - "Автомобиль" → "Chevrolet Cobalt 2020"
  - "Госномер" → "01 A 123 BB"
  - "Страхователь" → "Юсупов Карим"
  - "Водители" → "2 водителя"
  - "Период" → "12 мая 2026 — 11 мая 2027"
  - "Стоимость" → "3 240 000 сум"
  - "Оплачено" → "6 мая 2026, Uzcard •• 4521"
  - Each row: label Inter Regular 14 #9A9AA0 left + value Inter SemiBold 14 #010101 right.
- 24 px gap.
- **Secondary actions** (text-link list):
  - "Продлить полис" Inter SemiBold 14 #E61428 with leading refresh icon.
  - "Аннулировать полис" Inter SemiBold 14 #E61428 with leading X icon (still red because it's a primary action, not destructive UX-wise — 100% refund per policy).
- 32 px clearance.

COMPONENTS
- Big QR shortcut card (the primary CTA).
- Status row.
- Actions grid (ДТП red urgent + commissar dark + PDF/conditions light).
- Details key-value list.
- Secondary actions (продлить / аннулировать).

STATES TO GENERATE
- default (active policy)
- expired/archive variant (top of screen has yellow banner "Полис истёк 15 апреля 2026", QR card disabled (greyed), "Заявить о ДТП" disabled, only "Скачать PDF" + "Купить новый" available)
- soon-to-expire variant (banner "Истекает через 5 дней — продлите сейчас" + "Продлить" CTA prominent)
- after-claim variant (banner "По полису открыто заявление WX-12345" + tap → M10)

EDGE CASES
- ОСАГО version — "Заявить о ДТП" still primary, but "Условия" simpler.
- Cancellation in progress — QR card replaced with "В обработке аннуляции" warning.
```

---

## M8.3 — Fullscreen QR (для ГАИ)

```
SCREEN: M8.3 — Fullscreen QR for traffic police inspection
PURPOSE: Show a large, high-contrast QR that traffic police can scan at the roadside, possibly under bright sun. Optimized for legibility, not branding.
USER GOAL: Hold the phone toward the inspector. That's it.
ENTRY: From M14.1 hero shortcut OR M8.2 big QR card.
EXIT: Back arrow → M8.2. Auto-brightness ramp on entry, restore on exit. Auto-locks orientation portrait.

LAYOUT
- Pure white background (full screen, edge-to-edge — even in dark theme this stays white because we want max contrast for scanning).
- Top bar minimal: 44 px, only a back arrow left (#010101) and "Готово" link right Inter Medium 16 #010101.
- 32 px padding.
- 24 px gap from top bar.
- Centered Mont Bold 18 #010101: "Полис AB 1234567".
- 8 px gap. Centered Inter Regular 14 #9A9AA0: "Покажите этот код инспектору".
- 32 px gap.
- **Massive QR code** — square, 320×320, perfectly centered horizontally, black on white, padding 16 white around the QR for safe scanning, radius 0 (sharp corners — QR scanning expects no rounding on the QR itself).
- Below QR (24 px gap): centered Mont Bold 16 #010101 "01 A 123 BB" (license plate, helpful if QR can't be scanned).
- 8 px gap. Inter Regular 13 #9A9AA0 "Chevrolet Cobalt · 2020".
- 32 px gap.
- Footer row at bottom (centered, 24 px from safe-area):
  - Small Inter Regular 12 #9A9AA0 "Действует до 11 мая 2027".
  - Below: hairline divider, then small SOS24 logo (red mark + black wordmark) at 60% opacity.
- **Global behavior:**
  - Brightness boosted to 100% on entry (system intent).
  - Status bar text in dark color (we're on white).

COMPONENTS
- Large QR (320×320, padding for safe zone).
- License plate + car model below QR (fallback for offline/unreadable scanning).
- Minimal top/bottom chrome.

STATES TO GENERATE
- default (single active policy QR)
- multi-policy variant (small dot pagination at top — swipe between active policies; e.g., "1 / 2" indicator)
- offline (yellow chip top "Без интернета · QR кэширован 6 мая 12:34" — still functional, the QR is signed/cached)

EDGE CASES
- VoiceOver — QR description: "QR-код полиса AB 1234567, для проверки инспектором ГАИ".
- Screenshot prevention NOT required (the QR is signed, not a secret).
```

---

## M8.4 — Conditions & Coverage (Sheet)

```
SCREEN: M8.4 — Policy conditions & coverage (full-height sheet)
PURPOSE: Show what the policy covers, exclusions, claim procedure, contacts. Essentially the full policy text — but structured, not a wall of legalese.
USER GOAL: Find a specific condition (e.g., "покрывает ли стихия?"), or skim before a claim.
ENTRY: From M8.2 "Условия и покрытие" tile.
EXIT: Swipe-down or "Закрыть" → M8.2. Tap "Связаться с менеджером" → M13 chat.

LAYOUT
- 90% height bottom sheet, white, top corners radius 24, slight handle bar at top centered (32×4 #EAEAEC).
- Header: "Закрыть" link top-right + title Mont Bold 18 centered "Условия и покрытие".
- Content (24 px padding):
  - Hero summary card (radius 16, fill #F5F5F7, padding 16):
    - Mont Bold 16 "КАСКО · полное покрытие".
    - Inter Regular 13 #9A9AA0 "Полис AB 1234567 · действует с 12 мая 2026 до 11 мая 2027".
  - 24 px gap.
  - **Sticky local tab bar** (under the sheet header): segmented "Что покрывает" / "Что не покрывает" / "Как заявить" / "Контакты".
  - Each tab content:
    - **Что покрывает:** Stack of feature rows (each row 64 tall, leading green check icon, Inter SemiBold 14 title, Inter Regular 13 #9A9AA0 description). 6 rows: "Угон и кража", "Ущерб от ДТП", "Стихийные бедствия", "Действия третьих лиц", "Помощь на дороге 24/7", "Эвакуатор".
    - **Что не покрывает:** Same row pattern with red-x icons. 4 rows: "Управление в нетрезвом виде", "Использование в гонках", "Естественный износ", "Умышленные действия".
    - **Как заявить:** Numbered step list (1–6) with inline icons and short descriptions, ending with "Подробнее в форме заявления — кнопка ниже" + outline CTA "Открыть форму заявления".
    - **Контакты:** 3 cards (radius 12, padding 16): "Колл-центр 24/7" with "+998 78 200 24 24" big and tappable, "Email" with "support@sos24.uz", "Чат в приложении" with CTA "Открыть чат".
  - 32 px gap.
- Sticky footer 80 px white with top shadow: full-width outline CTA "Связаться с менеджером", border 1 #010101.

COMPONENTS
- Bottom-sheet handle.
- Hero summary card.
- Local tab bar.
- Coverage / exclusion / steps / contacts content patterns.
- Sticky footer CTA.

STATES TO GENERATE
- "Что покрывает" tab default
- "Что не покрывает" tab
- "Контакты" tab

EDGE CASES
- ОСАГО version — different content (gov-mandated coverage table), simpler.
- Long row label in uz — wraps; sheet scroll handles it.
```

---

## M8.5 — Cancel Policy (Confirm + Success)

```
SCREEN: M8.5 — Cancel policy (confirm modal flow + success state)
PURPOSE: Allow the user to cancel a policy with full transparency about the refund. Per project rule: 100% refund (no day-by-day calculation), but we still want a reason for analytics.
USER GOAL: Confirm cancellation, get the money back, see clear next step.
ENTRY: From M8.2 "Аннулировать полис" link.
EXIT: Confirm → success state → after 2s auto-route to M8.1 with the policy moved to archive. "Назад" → M8.2 (cancel cancellation).

LAYOUT (Confirm modal — full-height bottom sheet 90%)
- White, radius 24 top, handle bar.
- Header: "Закрыть" right.
- Content padding 24:
  - Centered icon: 64 round badge tinted #E61428 8% with red outlined alert-circle.
  - 16 px gap. Mont Heavy 24 #010101 centered: "Аннулировать полис?".
  - 8 px gap. Inter Regular 14 #9A9AA0 centered (3 lines): "Полис AB 1234567 (КАСКО · Chevrolet Cobalt) перестанет действовать. Деньги вернутся на карту в течение 3 банковских дней.".
  - 24 px gap.
  - **Refund details card** (radius 16, border 1 #EAEAEC, padding 16):
    - Inter SemiBold 13 #9A9AA0 uppercase "К ВОЗВРАТУ".
    - Mont Heavy 32 #1FAE6F (green to emphasize positive) "3 240 000 сум".
    - Inter Regular 13 #9A9AA0 "На карту Uzcard •• 4521 · 100% от стоимости".
  - 24 px gap.
  - **Reason field** (label "Почему аннулируете?" — required for analytics):
    - Single-select chip group (wrap, gap 8): "Продал авто", "Купил у другой страховой", "Не подошли условия", "Другое".
    - When "Другое" selected — text input below appears (height 80, radius 12, border 1 #EAEAEC, placeholder "Расскажите коротко").
  - 24 px gap.
  - Checkbox row: 24 square + Inter Regular 14 #010101 "Я понимаю, что аннуляция необратима и полис прекратит действие.".
- Sticky footer:
  - Primary CTA "Аннулировать и вернуть 3 240 000 сум" — full-width, height 56, radius 12, fill #E61428, white. Disabled until reason selected + checkbox checked.
  - 8 px gap. Secondary text-link "Передумал — назад", centered, Inter Medium 14 #9A9AA0.

LAYOUT (Success state — replaces sheet content after confirm)
- Centered icon 96 round green #1FAE6F with white check.
- 24 px gap. Mont Heavy 28 "Полис аннулирован".
- 8 px gap. Inter Regular 15 #9A9AA0 (2 lines): "Деньги уже в пути на карту Uzcard •• 4521. Обычно занимает 1–3 рабочих дня.".
- 32 px gap.
- Single CTA "На главную" outline border 1 #010101.

COMPONENTS
- Confirm sheet with refund card, reason chips, mandatory checkbox.
- Success replacement state.

STATES TO GENERATE
- confirm-default (no reason, checkbox off, CTA disabled)
- confirm-ready (reason "Продал авто" chip selected, checkbox on, CTA enabled red)
- confirm-with-other-text (reason "Другое" with text input filled)
- success state

EDGE CASES
- Cancellation within first 14 days (cooling-off) — banner "Аннуляция в первые 14 дней — стандартная процедура.".
- Cancellation after a claim has been opened — block with banner "По полису открыто заявление. Аннуляция возможна только после его закрытия. Связаться с поддержкой.".
- Cancellation by archive policy — block (already not active).
```

---

## M3.1 — Garage List

```
SCREEN: M3.1 — Garage (my cars list)
PURPOSE: Show all the user's saved cars; entry point to add or edit any.
USER GOAL: Pick a car to view/edit OR add a new one.
ENTRY: Bottom tab "Гараж". Also reachable from M2 profile.
EXIT: Tap a car card → M3.3. Tap "+" FAB → M3.2.

LAYOUT
- White background.
- Top bar: title Mont Bold 18 "Гараж", filter icon right.
- 24 px padding.
- 16 px gap.
- Stack of car cards (each radius 16, border 1 #EAEAEC, padding 0 — the card has internal layout, height 200, gap 16):
  - Card structure:
    - **Top hero photo zone** (height 120, radius 16 top-only, full-width): editorial photo of the car on neutral background, subtle dark gradient bottom-up so the bottom row text is readable.
    - On photo, top-left chip: "Основное" #E61428 (only on the primary car), white text Inter SemiBold 11 — only on first card.
    - On photo, bottom-left over the gradient: Mont Heavy 22 white "Chevrolet Cobalt".
    - On photo, bottom-right: small kebab icon white.
    - **Bottom info zone** (height 80, padding 16, white): grid 2×1:
      - Top row: Inter Regular 13 #9A9AA0 "Госномер" → Inter SemiBold 14 #010101 "01 A 123 BB"; "Год" → "2020".
      - Bottom row: small status chips inline:
        - "КАСКО активен" green chip (if there's an active КАСКО for this car).
        - "ОСАГО до 15 мар 2027" warning if expiring.
        - OR "Без полиса" #9A9AA0 if no active policy.
- "Добавить авто" FAB bottom-right: 56 round, fill #E61428, white plus icon, shadow. Variant: large floating CTA card (full-width, dashed border) when garage is empty.

COMPONENTS
- Car card with hero photo + kebab + info zone with status chips.
- Primary car badge ("Основное").
- FAB.

STATES TO GENERATE
- default (2 cars, first marked "Основное", first has active КАСКО, second без полиса)
- empty (centered illustration of an empty parking lot + Mont Bold 22 "В гараже пусто" + Inter Regular 14 #9A9AA0 "Добавьте первый автомобиль — это займёт минуту, если есть госномер." + primary CTA "Добавить авто")
- single-car (1 card, no "Основное" badge needed but still primary by default)

EDGE CASES
- Long car model name in uz — truncate with ellipsis on hero overlay.
- Car missing photo — fallback flat illustration of a car silhouette on #F5F5F7.
- Many cars (>5) — scrollable list, FAB stays.
```

---

## M3.2 — Add Car (License Plate → NAPP)

```
SCREEN: M3.2 — Add a new car via license plate (NAPP autofill)
PURPOSE: Minimum-input add-car flow. User enters license plate, NAPP returns make/model/year/VIN, user confirms or corrects.
USER GOAL: Add a car in one input.
ENTRY: From M3.1 FAB OR M5.2 "Добавить авто" outline.
EXIT: Confirm → M3.3 (newly created car detail). Manual fallback → M3.3 with empty fields.

LAYOUT (Step 1 — license plate input)
- White background.
- Top bar: back arrow, title Mont Bold 18 "Новый автомобиль", "Закрыть" right.
- Progress strip: 2 segments, first filled (1/2).
- 24 px padding.
- Headline Mont Heavy 28 (2 lines): "Введите госномер".
- 8 px gap. Helper Inter Regular 14 #9A9AA0: "Подтянем марку, модель и VIN из единого реестра NAPP.".
- 24 px gap.
- **License plate visual mock** (height 80, radius 8, border 2 #010101, fill white, padding 16, centered):
  - Mock displays a typical Uzbek plate layout: small black region with country code "UZ" left, then big black text "01 A 123 BB" Mont Heavy 32. As user types — fills live.
- 24 px gap.
- Numeric keyboard input below (height 56, radius 12, border 1 #EAEAEC, mask "00 X 000 XX"). NOT a full keyboard — opens custom plate-style keyboard with digits + UZ region letters.
- 8 px gap. Helper Inter Regular 13 #9A9AA0: "Например: 01 A 123 BB. Только узбекские номера.".
- 24 px gap.
- Outline secondary "Не нашли номер? Ввести вручную" Inter Medium 14 #E61428 centered.
- Sticky CTA "Найти" full-width, height 56, fill #E61428. Disabled until plate complete.

LAYOUT (Step 2 — NAPP confirmation)
- Same top bar / progress (2/2).
- Headline Mont Heavy 28: "Это ваш автомобиль?".
- 8 px gap. Helper: "Подтянули из NAPP. Проверьте и подтвердите.".
- 24 px gap.
- Hero car photo block (height 200, radius 16, fill #010101 with photo of similar Chevrolet Cobalt in light grey, centered): if NAPP has photo, show; otherwise stylized SVG of car based on body type.
- 16 px gap.
- Detail card (radius 16, border 1 #EAEAEC, padding 16):
  - Mont Bold 18 "Chevrolet Cobalt 2020".
  - 8 px gap. Key-value list:
    - "Госномер" → "01 A 123 BB"
    - "VIN" → "KL1...1234" (last 4 visible, rest masked)
    - "Цвет" → "Белый"
    - "Тип кузова" → "Седан"
    - "Двигатель" → "1.5 л · 105 л.с."
  - Bottom: outline pill chip "Изменить" #E61428.
- 16 px gap.
- "Добавить как основной автомобиль" toggle row (Inter Regular 14 + iOS toggle, on by default if first car).
- Sticky footer:
  - Primary CTA "Подтвердить" — full-width, fill #E61428.
  - 12 px gap. Secondary text "Это не моя машина" → returns to step 1.

COMPONENTS
- License plate visual mock (live-updates).
- Custom plate keyboard (separate frame).
- NAPP detail card.
- Manual fallback link.

STATES TO GENERATE
- step-1 default (empty input)
- step-1 typing (partially filled, "01 A 123 ..")
- step-2 napp-success (shown above)
- napp-not-found (modal sheet "Номер не найден в NAPP. Можем добавить вручную." + buttons "Ввести вручную" / "Попробовать другой номер")
- napp-error (network error → "Сервис временно недоступен" + retry CTA)
- manual-form (full form fields: model, year, VIN, plate — opens after fallback or napp-not-found)

EDGE CASES
- Plate already exists in user's garage — modal "Эта машина уже в вашем гараже" + CTA "Открыть карточку" → M3.3.
- Plate registered to another person — banner "По данным NAPP, авто оформлено на другого человека. Если это ваше — подтвердите через паспорт." + outline CTA "Подтвердить владение".
```

---

## M3.3 — Car Detail

```
SCREEN: M3.3 — Car details (one car's hub)
PURPOSE: View / edit one car, manage its photos and documents (СТС, техпаспорт), see related policies.
USER GOAL: Pull up info on a specific car, often for a calc, claim, or document upload.
ENTRY: From M3.1 card OR direct deep-link.
EXIT: Edit pencils → inline edit. "Купить полис на это авто" → M5.1 prefilled. "Удалить" → M3.4 confirm.

LAYOUT
- White background.
- Top bar: back arrow, kebab icon right (kebab menu options: "Редактировать", "Сделать основным", "Удалить" red).
- **Hero photo section** (height 280, full-bleed):
  - Big editorial car photo on subtle gradient.
  - Top-left chip "Основное" red (if primary).
  - Bottom-left over gradient: Mont Heavy 32 white "Chevrolet Cobalt".
  - Bottom-left small Inter Regular 14 white 80% "01 A 123 BB · 2020".
- 24 px padding for the rest, 24 px gap from hero.
- **Status strip** — horizontal scroll of 1-3 chips depending on policy state:
  - "КАСКО активен до 11 мая 2027" green pill.
  - "ОСАГО истёк" warning yellow pill.
  - Tap → M8.2 of that policy.
- 24 px gap.
- **Specs section**:
  - Section title Inter SemiBold 13 #9A9AA0 uppercase "ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ".
  - 12 px gap. Key-value rows (each 48 tall, hairline divider):
    - "Марка / Модель" → "Chevrolet Cobalt" (with edit pencil).
    - "Год" → "2020".
    - "Цвет" → "Белый".
    - "VIN" → "KL1...1234" (full visible on tap with biometric confirm).
    - "Тип кузова" → "Седан".
    - "Двигатель" → "1.5 л · 105 л.с.".
    - "Пробег" → "45 000 км" (editable).
- 24 px gap.
- **Documents section**:
  - Title "ДОКУМЕНТЫ".
  - 12 px gap. Doc cards (radius 12, border 1 #EAEAEC, padding 16, 80 tall, gap 8):
    - "Свидетельство о регистрации (СТС)": leading 40 doc icon green, "Загружен 6 мая 2026", trailing chevron → preview.
    - "Техпаспорт лицевая сторона": "Загружен", chevron.
    - "Техпаспорт обратная сторона": dashed-border placeholder + camera icon + "Сфотографировать" Inter SemiBold 14 #E61428.
- 24 px gap.
- **Linked policies section**:
  - Title "ПОЛИСЫ ЭТОГО АВТО".
  - 12 px gap. Policy mini-cards (radius 12, border 1 #EAEAEC, padding 12, 64 tall): chip product + Mont Bold 14 policy number + Inter Regular 12 #9A9AA0 period + status chip + chevron.
  - Sample: КАСКО active card.
- Sticky footer: "Купить полис на это авто" CTA full-width, fill #E61428.

COMPONENTS
- Hero photo with overlays.
- Status strip (policy chips).
- Specs key-value list with edit pencils.
- Documents section with mixed states (uploaded / placeholder).
- Linked policies mini-cards.
- Sticky CTA.

STATES TO GENERATE
- default (active КАСКО, all docs uploaded)
- no-policies variant (status strip empty, "У этого авто нет действующих полисов" + "Купить полис" CTA emphasized)
- missing-docs (multiple dashed-border doc placeholders, top yellow banner "Загрузите СТС — нужен для оформления полиса")
- edit-pencil-tap (inline edit state — bottom sheet form for that field)

EDGE CASES
- Car has been sold — option from kebab "Снять с учёта в SOS24" (different from delete; archives without losing claim history).
- Photo uploads pending verification — small chip "Проверяется" yellow on doc card.
```

---

## M3.4 — Delete Car (Confirm)

```
SCREEN: M3.4 — Delete car (confirmation modal)
PURPOSE: Prevent accidental deletion, especially when policies/claims exist.
USER GOAL: Confirm or back out.
ENTRY: From M3.3 kebab → "Удалить".
EXIT: Confirm (with CAPTCHA-light) → return to M3.1, car gone, toast "Авто удалено". Cancel → M3.3.

LAYOUT (Standard variant — no active policies)
- Bottom sheet 60% height, white, radius 24 top.
- Centered icon 64 round red tint #E61428 8% with outlined trash icon.
- 16 px gap. Mont Heavy 24 centered "Удалить автомобиль?".
- 8 px gap. Inter Regular 14 #9A9AA0 centered (2 lines): "«Chevrolet Cobalt 2020» (01 A 123 BB) будет удалён из гаража. Это нельзя отменить.".
- 24 px gap.
- Card (radius 12, fill #F5F5F7, padding 16): info icon + Inter Regular 13 #010101 "У этого авто нет активных полисов и заявлений. Можно удалять.".
- 32 px gap.
- Buttons stacked:
  - Primary "Удалить" — full-width, height 56, fill #E61428, white text.
  - 12 px gap. Secondary text-link "Отмена" Inter Medium 14 #9A9AA0 centered.

LAYOUT (Blocked variant — has active policies or open claims)
- Same sheet, but card content is red-tinted:
  - Card fill #E61428 8%, leading red exclamation, Inter Regular 13 #010101 "Нельзя удалить — есть активный полис КАСКО (AB 1234567) и 1 открытое заявление.".
- Buttons:
  - Primary "Открыть полис" → M8.2.
  - Secondary "Закрыть".

COMPONENTS
- Bottom-sheet confirm modal.
- Info card (positive — eligible / negative — blocked).
- Two-tier CTA stack.

STATES TO GENERATE
- standard-confirm
- blocked-by-policy
- blocked-by-claim (different content text)
- success-toast (after delete, top-of-screen toast "Авто удалено · Отменить" with undo within 5s)

EDGE CASES
- Last car in garage — proceed but show message in toast "Гараж пуст. Добавить новое авто?" with link.
- Undo within 5s — restores via API.
```

---

## Что отдаём дизайнеру с этим батчем

1. Этот файл (`STITCH_BATCH_4_M8_M3_M14.md`).
2. Актуальный `STITCH_BASE_PROMPT.md`.
3. Лого + 3 референса.

После генерации **10 экранов × 2 темы = 20 кадров** + ~12 модалок/состояний (no-policy variants, multi-policy carousel, expired policy, NAPP states, manual form, blocked-delete, edit-pencil sheets, success toasts) ≈ **32 кадра**.

## Открытые вопросы для клиента (флэг в `QUESTIONS.md` после ревью)

- **«Основное» авто:** ввели концепт primary car (бейдж в гараже, дефолт в калькуляторе). Это нужно подтвердить как фичу или убрать.
- **Кэширование QR офлайн:** в M8.3 показываем «QR кэширован 6 мая 12:34» — нужна подпись/верификация на бэке (как ГАИ проверит без интернета? через QR с подписью + timestamp?). Решение влияет на дизайн.
- **Snap car ownership через NAPP:** что делать, если NAPP показывает другого владельца? В M3.2 предложил флоу «Подтвердить через паспорт» — это требует бэк-логики, нужно подтвердить.
- **Brightness boost на M8.3:** автоматически выкручивать яркость — стандартная UX-практика, но требует разрешения. Подтвердить.

## После ревью батча 4 — переход к батчу 5

Батч 5 = **M9 ДТП + M9.1 Комиссар + M10 Статус выплат** (~12 экранов) — критический флоу. Самый сложный батч: гео-локация, фото 360°, европротокол с 2 подписями, статусные тайм-лайны, чат внутри заявления.
