# STITCH_BATCH_MAIN_PAGES — Клиентский шоукейс SOS24

> **Назначение:** этот файл — отдельный набор промптов для **клиентской презентации**. Здесь не весь функционал, а **8 ключевых экранов**, которые показывают: что мы строим, в каком стиле, с каким уровнем проработки.
>
> Цель — чтобы клиент за один просмотр увидел продуктовый нарратив SOS24 от первого впечатления до использования на дороге.
>
> **Это не полный батч**, а курированная подборка из батчей 1–4. Все экраны уже есть в детальном виде в:
> - `STITCH_BATCH_1_M1_AUTH.md`
> - `STITCH_BATCH_2_M4_M5.md`
> - `STITCH_BATCH_3_M6_M7.md`
> - `STITCH_BATCH_4_M8_M3_M14.md`
>
> Здесь — переработанные версии тех же экранов, заточенные под **визуальный ряд презентации**: чище композиция, единая тема (light + 3 dark акцента для контраста), реалистичные данные без edge-cases.

---

## Нарратив (как раскладывать на слайдах)

| Слот | Экран | Что показывает клиенту | Тема |
|---|---|---|---|
| 1 | M1.2 — Онбординг | Первое впечатление, обещание бренда, hero-эстетика | dark hero + light sheet |
| 2 | M14.1 — Главный | Флагман: SOS-кнопка, полис под рукой, фирменный язык | light |
| 3 | M4.1 — Каталог | «Что продаём» — ОСАГО (обяз.) и КАСКО (доб.) | mixed (dark + light) |
| 4 | M5.6 — Итог калькулятора | Прозрачность цены, разбивка, доверие | light с чёрной hero |
| 5 | M6.7 — Полис выпущен | Эмоция момента, эстетика успеха | dark hero + light sheet |
| 6 | M8.2 — Детали полиса | Ежедневная ценность: QR + действия | light с чёрной QR |
| 7 | M8.3 — Fullscreen QR | Функциональный payoff: показал ГАИ | white only |
| 8 | M3.1 — Гараж | Визуальная амбиция: фото авто, premium feel | light |

---

## Как использовать с Stitch

Для каждого экрана последовательно вставляем:
1. **§1 BASE PROMPT** из `STITCH_BASE_PROMPT.md`
2. **§2.1 Mobile preset** из `STITCH_BASE_PROMPT.md`
3. **Showcase prompt** из этого файла

Прикладываем `assets/brand/logo.svg` + 3 референса. Эти 8 экранов — все в **light**, кроме явных dark hero-блоков внутри. Для презентации этого достаточно.

---

## SHOWCASE 1 — M1.2 «Онбординг: полис за 2 минуты»

```
SCREEN: SHOWCASE 1 — Onboarding hero (step 1 of 3)
PURPOSE: First impression. Sets the brand tone — modern, premium, fintech-grade — and delivers the core promise.
WHY IN SHOWCASE: This is the screen the client sees first when imagining a user opening the app. It must feel different from "old-school insurance" — and signal trust + speed.

LAYOUT
- Frame iPhone 14 Pro 393×852.
- Top 60% of screen — full-bleed dark hero zone, fill #010101.
  - Centered: an editorial photo of a modern grey/black sedan (3/4 angle), positioned slightly right-of-center, with a subtle red ambient glow #E61428 at 15% opacity behind it.
  - Top-left of hero: small SOS24 logo mark (red S + white "SOS24" wordmark) at 32 px height, 24 px from edges.
  - Top-right of hero: "Пропустить" link Inter Medium 15 #FFFFFF 70%.
- Bottom 40% — white sheet, top corners radius 24, padding 24:
  - Page indicator: 3 dots top-center, gap 8. Active dot fill #E61428 width 24, others 8 wide and Neutral 100.
  - 24 px gap.
  - Headline Mont Heavy 32 #010101, 2 lines, tight tracking: "Полис ОСАГО или КАСКО — за 2 минуты".
  - 12 px gap.
  - Body Inter Regular 15 #9A9AA0, 2 lines: "Введите номер авто — данные подтянутся автоматически. Оплата картой Uzcard или Humo.".
  - 24 px gap.
  - Primary CTA "Дальше" — full-width, height 56, radius 12, fill #E61428, white text Inter SemiBold 16 + small chevron-right.

BRAND NOTES
- Photo of car must look real and aspirational (premium sedan in neutral colors).
- Red glow behind car is the only visible brand-red on this screen — restrained, not loud.
- Status bar in light style (white time/icons over the dark hero).

DELIVERABLE
- One screen, polished for presentation. No alternative states needed for the showcase.
```

---

## SHOWCASE 2 — M14.1 «Главный экран после логина»

```
SCREEN: SHOWCASE 2 — Home / main screen
PURPOSE: The flagship. Embodies every SOS24 brand pattern in one frame: personalized header, dark policy card with QR shortcut, signature red SOS button, quick-action grid, notifications strip, CMS promo, bottom tab bar.
WHY IN SHOWCASE: If the client only sees one screen, this is the one. It says "we built a serious daily-use product, not a brochure".

LAYOUT
- Frame 393×852, white background.
- Status bar with 9:41 + Dynamic Island, dark icons.
- Header (height 64, no bottom border):
  - Left: 40 round avatar with initials "ОА" Mont Bold 14 white on #E61428.
  - Center-left next to avatar: Inter Regular 13 #9A9AA0 "Доброе утро,"; below Mont Bold 18 #010101 "Одилхон".
  - Right: 24 outline bell icon with red dot badge (#E61428, 6 px).
- 24 px horizontal padding.
- 16 px gap.
- ACTIVE POLICY HERO CARD (radius 24, fill #010101, padding 20, height 180):
  - Top-left: chip "АКТИВЕН" green #1FAE6F, white Inter SemiBold 11.
  - Top-right: Mont Bold 14 white 80% "до 11 мая 2027".
  - 12 px gap. Mont Heavy 24 white "КАСКО · Chevrolet Cobalt".
  - 4 px gap. Inter Regular 13 white 70% "AB 1234567 · 01 A 123 BB".
  - Bottom row: two side-by-side actions (height 56, gap 12):
    - "Показать QR" — radius 12, fill rgba(255,255,255,0.08), border 1 rgba(255,255,255,0.2), QR icon + Inter SemiBold 14 white + chevron.
    - "Подробнее" — same height, outline border, white text.
- 24 px gap.
- QUICK ACTIONS section title Inter SemiBold 13 #9A9AA0 uppercase "БЫСТРЫЕ ДЕЙСТВИЯ".
- 12 px gap.
- HERO SOS BUTTON — full-width, height 88, radius 16, fill #E61428, padding 20:
  - Left: 48 round white circle with red exclamation icon centered.
  - Mont Heavy 22 white "SOS — заявить ДТП".
  - Inter Regular 13 white 80% "Запишем место, фото, отправим.".
  - Right: chevron-right white.
  - Subtle red glow shadow under the card (10 px, 30% opacity).
- 12 px gap.
- 2×2 ACTIONS GRID (each 48% width, height 96, gap 12, radius 16):
  - "Вызвать комиссара" — fill #2A2A2D, white Mont Bold 15, car-tow icon, Inter Regular 11 white 70% "Приедет за 30 мин".
  - "Купить полис" — fill #F5F5F7, #010101 Mont Bold 15, shield-plus icon, Inter Regular 11 #9A9AA0 "ОСАГО / КАСКО".
  - "Калькулятор" — fill #F5F5F7, calculator icon, "Узнать цену".
  - "Партнёры рядом" — fill #F5F5F7, map-pin icon, "СТО, клиники".
- 24 px gap.
- NOTIFICATIONS strip — section title with "Все →" link in #E61428:
  - Stack of 2 notification rows (radius 12, border 1 #EAEAEC, padding 12):
    - Row 1: green check icon + Inter SemiBold 13 "Заявление WX-12345 одобрено" + Inter Regular 12 #9A9AA0 "5 мая".
    - Row 2: blue info icon + Inter SemiBold 13 "Полис продлевается через 30 дней" + "вчера".
- 24 px gap.
- CMS PROMO CARD (radius 16, gradient #010101 → #2A2A2D, padding 20, height 140):
  - Chip "АКЦИЯ" white border, Inter SemiBold 11 white.
  - Mont Bold 18 white "+10% к КАСКО при оформлении вместе с ОСАГО".
  - Inter Regular 12 white 70% "Скидка автоматически применится в калькуляторе.".
  - Chevron right white.
- 32 px clearance.
- BOTTOM TAB BAR (height 80, white, hairline-top #EAEAEC, 5 items): "Главная" active red, then "Полисы / Гараж / Заявления / Профиль" outline grey.

BRAND NOTES
- The SOS button is THE signature element — make it sing.
- Avoid jamming the screen. Generous spacing > information density.
- Photo elements: none on this screen — pure layout work, brand colors do the lifting.

DELIVERABLE
- One screen, polished. Default state, single active policy.
```

---

## SHOWCASE 3 — M4.1 «Каталог: ОСАГО + КАСКО»

```
SCREEN: SHOWCASE 3 — Product catalog home
PURPOSE: Show in one frame what SOS24 sells. Dual-card composition (dark ОСАГО + light КАСКО) is visually striking and immediately legible — even to a client glancing for 2 seconds.
WHY IN SHOWCASE: Answers "what's the business?" without a single word from us.

LAYOUT
- Frame 393×852, white background.
- Top bar: 56 px, title "Купить полис" Mont Bold 18 centered.
- 24 px padding.
- Helper text Inter Regular 15 #9A9AA0: "Что вам нужно?".
- 4 px gap. Headline Mont Heavy 28 #010101: "Подберите страховку".
- 24 px gap.
- "Сравнить продукты" pill right-aligned: Inter Medium 14 #E61428, on white pill border 1 #E61428, height 36, radius 999, leading mini chart icon.
- 16 px gap.
- TWO LARGE PRODUCT CARDS, stacked (radius 16, height 200, gap 16):

  CARD 1 — ОСАГО (dark hero):
  - Background: #010101.
  - Subtle silhouette of a sedan side-view at 5% opacity, bottom-right.
  - Top-left: chip "Обязательно" fill #E61428, white Inter SemiBold 12, padding 4×10, radius 999.
  - 16 px gap. Mont Heavy 36 white "ОСАГО".
  - 4 px gap. Inter Regular 14 white 70% (2 lines): "Обязательная гражданская ответственность. Защита от штрафов ГАИ.".
  - Bottom row (16 px from bottom): Mont Bold 16 white "от 280 000 сум / год" + chevron-right white.

  CARD 2 — КАСКО (light premium):
  - Background: white with #F5F5F7 fill, hairline border #EAEAEC.
  - Top-left: chip "Добровольно" white fill border 1 #EAEAEC, text #010101 Inter SemiBold 12.
  - 16 px gap. Mont Heavy 36 #010101 "КАСКО".
  - 4 px gap. Inter Regular 14 #9A9AA0: "Защита от ущерба и угона. Полное покрытие вашего авто.".
  - Bottom row: Mont Bold 16 #010101 "от 2 400 000 сум / год" + chevron-right #010101.

- 24 px gap.
- Centered Inter Regular 13 #9A9AA0: "Цены ориентировочные. Точная стоимость — после расчёта.".

BRAND NOTES
- The contrast between dark ОСАГО and light КАСКО is intentional — visually echoes "obligation vs choice".
- Both cards equal weight — we don't push one over the other on this screen.

DELIVERABLE
- One screen.
```

---

## SHOWCASE 4 — M5.6 «Итог калькулятора»

```
SCREEN: SHOWCASE 4 — Calculator result with breakdown
PURPOSE: Show pricing transparency. The user sees the price, then can expand the breakdown line-by-line. Builds trust before the user spends millions of som.
WHY IN SHOWCASE: Insurance UX is famous for hidden math. Showing the math openly is a competitive differentiator the client should see.

LAYOUT
- Frame 393×852, white background.
- Top bar: back arrow, title Mont Bold 18 "Итоговый расчёт", "Закрыть" link right.
- Progress strip 4 px below top bar — fully filled #E61428.
- 24 px padding.

- HERO PRICE CARD (radius 24, fill #010101, padding 24, height 180):
  - Chip top-left: "КАСКО" white border, Inter SemiBold 12 white.
  - 12 px gap.
  - Mont Heavy 48 white "3 240 000 сум".
  - 4 px gap. Inter Regular 14 #9A9AA0 "за 1 год".
  - Bottom row (16 px from bottom): small green check + Inter Regular 13 white 80% "Скидка 10% за КАСКО + ОСАГО учтена".

- 16 px gap.

- BREAKDOWN CARD (radius 16, border 1 #EAEAEC, expanded by default):
  - Header row tappable (height 56, padding 16): Inter SemiBold 14 #010101 "Из чего складывается цена" + chevron-up icon right.
  - Body (padding 16, divider above body):
    - 6 rows + total, each row Inter Regular 14 #9A9AA0 left, Mont Bold 14 right:
      - "Госбаза (мин. тариф)" → "1 800 000 сум" (#010101).
      - "Стаж водителей" → "−120 000 сум" (#1FAE6F).
      - "Доп. водитель" → "+220 000 сум" (#010101).
      - "Угон и кража" → "+450 000 сум" (#010101).
      - "Действия 3-х лиц" → "+180 000 сум" (#010101).
      - "Помощь на дороге" → "+90 000 сум" (#010101).
    - Hairline divider.
    - "Скидка КАСКО + ОСАГО (10%)" → "−380 000 сум" (#1FAE6F).
    - Hairline divider.
    - "Итого" Mont Bold 16 #010101 → "3 240 000 сум" Mont Bold 16 #010101.

- 16 px gap.

- SUMMARY CHIP ROW (horizontal, gap 8, scrollable):
  - "Chevrolet Cobalt 2020" pill #F5F5F7, Inter Medium 13 #010101.
  - "2 водителя" pill.
  - "1 год" pill.

- STICKY FOOTER (96 tall, white, top shadow):
  - Top row, two side-by-side buttons (gap 12):
    - "Сохранить расчёт" outline (50% width, height 48, border 1 #010101, Inter SemiBold 14 #010101).
    - empty 50% (or just full-width below).
  - Below: full-width "Оформить за 3 240 000 сум" CTA, height 56, fill #E61428, white Inter SemiBold 16.

BRAND NOTES
- The black hero card with massive Mont Heavy 48 is the "wow" moment — pricing as a hero, not a footnote.
- Green for negative numbers (savings) is subtle but builds trust.

DELIVERABLE
- One screen with breakdown expanded (default state).
```

---

## SHOWCASE 5 — M6.7 «Полис выпущен»

```
SCREEN: SHOWCASE 5 — Policy issued / success
PURPOSE: The emotional moment. After payment, the user sees confirmation and feels relief / pride. This is where word-of-mouth gets seeded.
WHY IN SHOWCASE: Most insurance flows end with a sterile "Спасибо за покупку" — ours ends with a screen worth screenshotting.

LAYOUT
- Frame 393×852.
- Top 60%: full-bleed dark hero #010101.
  - Centered ~30% from top: 96 px circular badge — fill #1FAE6F (success green), white check icon, subtle green glow ring at 30% opacity behind.
  - 24 px below badge: Mont Heavy 32 white centered "Полис выпущен".
  - 8 px below: Inter Regular 14 white 70% centered, 2 lines: "Поздравляем! Ваш КАСКО уже действует. Документ в приложении и на e-mail.".
  - Decorative confetti particles in red and white, scattered at low opacity off to the sides — celebratory but not gaudy.
- Bottom 40%: white sheet, top corners radius 24, padding 24:
  - POLICY SUMMARY CARD (radius 16, fill #F5F5F7, padding 16):
    - Top: chip "КАСКО" red fill + Mont Bold 16 #010101 "AB 1234567" (policy number).
    - Inter Regular 13 #9A9AA0 "Действует до 11 мая 2027 · Chevrolet Cobalt".
    - Bottom row: Mont Bold 14 #010101 "3 240 000 сум" + small chip "Оплачено" green fill.
  - 16 px gap.
  - Primary CTA "Открыть QR-полис" — full-width, height 56, radius 12, fill #E61428, leading QR icon, white text Inter SemiBold 16.
  - 12 px gap.
  - Secondary CTA "Скачать PDF" — outline, height 52, border 1 #010101, leading download icon, Inter SemiBold 14 #010101.
  - 12 px gap.
  - Tertiary text-link "На главную", Inter Medium 14 #9A9AA0, centered.

BRAND NOTES
- Green is a guest here — it appears only on success screens. Don't dilute it.
- The confetti is decorative, NOT distracting — keep it subtle.

DELIVERABLE
- One screen.
```

---

## SHOWCASE 6 — M8.2 «Детали полиса»

```
SCREEN: SHOWCASE 6 — Policy detail (everyday hub)
PURPOSE: Show the most-visited screen in the app. ~80% of opens land here, primarily to grab QR or to call a commissar. Layout puts those two needs at the top.
WHY IN SHOWCASE: Demonstrates we understand user intent — the QR is huge and centered, not buried in a menu.

LAYOUT
- Frame 393×852, white background.
- Top bar: 56 px, back arrow, title Mont Bold 18 "Полис AB 1234567" centered, share icon right.
- 24 px padding.

- BIG QR SHORTCUT CARD (radius 24, fill #010101, padding 24, height 200):
  - Top: Inter SemiBold 12 white 70% "ПОКАЖИТЕ ИНСПЕКТОРУ ГАИ".
  - Center-left: Mont Heavy 28 white "Открыть QR".
  - Center-right: 96×96 QR preview on a white card (radius 12, padding 8) — looks like a real QR.
  - Bottom-right: chevron-right white.

- 16 px gap.

- STATUS ROW CARD (radius 16, fill #F5F5F7, padding 16, height 80, two columns):
  - Left: chip "АКТИВЕН" #1FAE6F + Mont Bold 16 "до 11 мая 2027" + Inter Regular 12 #9A9AA0 "осталось 364 дня".
  - Right (right-aligned): Mont Bold 16 "3 240 000 сум" + Inter Regular 12 #9A9AA0 "оплачен".

- 24 px gap.

- ACTIONS 2×2 GRID (each 48% width, height 88, radius 16, gap 12):
  - "Заявить о ДТП" — fill #E61428, white Mont Bold 14, leading exclamation icon white, Inter Regular 11 white 80% "Открыть форму".
  - "Вызвать комиссара" — fill #2A2A2D, white Mont Bold 14, car-tow icon, Inter Regular 11 white 70% "Приедет за 30 мин".
  - "Скачать PDF" — fill #F5F5F7, #010101 Mont Bold 14, download icon, Inter Regular 11 #9A9AA0 "Полис в PDF".
  - "Условия и покрытие" — fill #F5F5F7, doc icon, Inter Regular 11 #9A9AA0 "Что покрывает".

- 24 px gap.

- DETAILS LIST — flat key-value rows (each 48 tall, hairline divider #EAEAEC):
  - "Продукт" → "КАСКО"
  - "Автомобиль" → "Chevrolet Cobalt 2020"
  - "Госномер" → "01 A 123 BB"
  - "Страхователь" → "Алиев Одилхон"
  - "Период" → "12 мая 2026 — 11 мая 2027"
  - "Стоимость" → "3 240 000 сум"
  - Each row: Inter Regular 14 #9A9AA0 left + Inter SemiBold 14 #010101 right.

- 24 px gap.
- Secondary actions:
  - "Продлить полис" Inter SemiBold 14 #E61428 with refresh icon left.
  - "Аннулировать полис" Inter SemiBold 14 #E61428 with X icon.

BRAND NOTES
- The black QR card on white is the visual hierarchy — it's bigger than anything else, signaling "this is what you came here for".
- The 2×2 grid mixes urgency (red ДТП), gravity (dark commissar), and utility (light PDF/conditions).

DELIVERABLE
- One screen.
```

---

## SHOWCASE 7 — M8.3 «Полноэкранный QR для ГАИ»

```
SCREEN: SHOWCASE 7 — Fullscreen QR for police inspection
PURPOSE: The functional payoff. A user pulled over by ГАИ opens this; the inspector scans. High contrast, max legibility, brand stays out of the way.
WHY IN SHOWCASE: Insurance apps are useful only at moments of friction. This screen IS that moment, and it's been respected — minimal, sharp, fast.

LAYOUT
- Frame 393×852, FULL WHITE background (even in dark theme — we want max contrast for scanning).
- Status bar: dark icons (we're on white).
- Top bar minimal: 44 px height, only:
  - Left: back arrow #010101, 24 px.
  - Right: "Готово" Inter Medium 16 #010101.
- 32 px padding.
- 24 px gap from top bar.
- Centered Mont Bold 18 #010101: "Полис AB 1234567".
- 8 px gap. Centered Inter Regular 14 #9A9AA0: "Покажите этот код инспектору".
- 32 px gap.

- MASSIVE QR CODE — square, 320×320, perfectly centered horizontally, black on white, padding 16 of white around for safe scanning, NO rounded corners.

- 24 px gap.
- Centered Mont Bold 16 #010101: "01 A 123 BB" (license plate fallback).
- 8 px gap. Inter Regular 13 #9A9AA0 "Chevrolet Cobalt · 2020".

- Bottom (24 px from safe-area), centered:
  - Inter Regular 12 #9A9AA0 "Действует до 11 мая 2027".
  - 8 px gap. Hairline divider Neutral 100 width 80.
  - 12 px gap. Small SOS24 logo (red mark + black wordmark) at 60% opacity, height 20.

BRAND NOTES
- This screen is brand-restrained on purpose. The product is the QR — we step out of the way.
- The logo at the bottom in faded form is a quiet signature, not a flex.
- Implementation note (not for designer, for dev): brightness boost to 100% on entry.

DELIVERABLE
- One screen.
```

---

## SHOWCASE 8 — M3.1 «Гараж: мои авто»

```
SCREEN: SHOWCASE 8 — Garage / cars list
PURPOSE: Show the visual ambition. Hero photos of cars on each card give the app a premium, automotive-first feel — closer to a marketplace like Drom/AutoTrader than to a clipboard-style insurance app.
WHY IN SHOWCASE: This is where the design system inherited from references (ref1 WheelzUp, ref2/3 Porsche) is most visible. It tells the client "your app will feel premium".

LAYOUT
- Frame 393×852, white background.
- Top bar: 56 px, title Mont Bold 18 "Гараж", filter icon right.
- 24 px padding.
- 16 px gap.

- TWO CAR CARDS, stacked (each radius 16, border 1 #EAEAEC, height 200, gap 16):

  CARD 1 — Chevrolet Cobalt (primary, has active КАСКО):
  - TOP HERO PHOTO ZONE (height 120, radius 16 top corners, full-width):
    - Editorial photo: white/silver Chevrolet Cobalt sedan, 3/4 angle, on a soft neutral grey background, cinematic lighting.
    - Subtle dark-to-transparent gradient bottom-up (so overlay text reads).
    - Top-left chip "Основное" fill #E61428, white Inter SemiBold 11.
    - Top-right: kebab icon white.
    - Bottom-left over gradient: Mont Heavy 22 white "Chevrolet Cobalt".
  - BOTTOM INFO ZONE (height 80, padding 16, white):
    - Top row: 2 columns:
      - "Госномер" Inter Regular 13 #9A9AA0 → Inter SemiBold 14 #010101 "01 A 123 BB"
      - "Год" → "2020"
    - Bottom row: status chip inline: "КАСКО активен" green fill #1FAE6F, white Inter SemiBold 11.

  CARD 2 — Hyundai Elantra (secondary, no active policy):
  - HERO PHOTO: black Hyundai Elantra, sportier angle, also on neutral background.
  - Top-left: NO "Основное" chip. Top-right: kebab.
  - Bottom-left over gradient: Mont Heavy 22 white "Hyundai Elantra".
  - Bottom info zone:
    - "Госномер" → "01 A 456 CC"; "Год" → "2022".
    - Status chip: "Без полиса" Neutral 400 fill, white Inter SemiBold 11.

- FAB bottom-right: 56 round, fill #E61428, white plus icon, soft shadow (0 4 16 rgba(230,20,40,0.3)).

BRAND NOTES
- Photos are the hero of this screen — Stitch should generate the most editorial, cinematic car photos it can. Real cars on real backgrounds, not 3D renders.
- Card composition (photo on top, info on bottom) is the same pattern as ref1 WheelzUp — adapted to our brand.

DELIVERABLE
- One screen with 2 cards (primary + secondary).
```

---

## Что отдаём клиенту

- 8 кадров (mobile, light theme, 393×852).
- Каждый кадр — самостоятельный, можно вставить в презентацию или PDF.
- Порядок слайдов = таблица «Нарратив» в начале файла.

## Подсказки для презентации (необязательно для дизайнера, но полезно для PM)

- На слайде 1 (M1.2) — подпись «Открыл приложение → знакомство».
- На слайде 2 (M14.1) — «Главный экран. SOS-кнопка — фирменная фишка».
- На слайде 3 (M4.1) — «Что мы продаём».
- На слайде 4 (M5.6) — «Узнал цену — открытая разбивка вместо чёрного ящика».
- На слайде 5 (M6.7) — «Купил — момент эмоции».
- На слайде 6 (M8.2) — «Каждый день — полис под рукой».
- На слайде 7 (M8.3) — «На дороге — показал ГАИ».
- На слайде 8 (M3.1) — «Несколько авто — премиум-ощущение».

После согласования с клиентом → возвращаемся к плановому пайплайну батчей (5 → 9).
