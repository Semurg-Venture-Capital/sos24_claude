# STITCH_BATCH_1 — M1. Онбординг + Auth

> **Батч 1 из 8.** Mobile, iOS frame 393×852. 8 экранов: splash → 3 онбординга → выбор языка → телефон → SMS → согласие.
>
> **Как использовать:** В Google Stitch для каждого экрана вставляем последовательно:
> 1. **§1 BASE PROMPT** из `STITCH_BASE_PROMPT.md`
> 2. **§2.1 Mobile preset** из `STITCH_BASE_PROMPT.md`
> 3. **Screen prompt** из этого файла (один из 8 ниже)
>
> Прикладываем как изображения: `assets/brand/logo.svg`, `assets/brand/ref1.jpg`, `assets/brand/ref2.jpg`, `assets/brand/ref3.jpg`.
>
> **Тема:** для каждого экрана сначала генерим **light**, затем повторяем тот же промпт с пометкой `THEME: dark`.

---

## M1.1 — Splash

```
SCREEN: M1.1 — Splash
PURPOSE: First screen on app launch. Shows the SOS24 brand for ~1.5s while the app boots and decides where to route the user (onboarding for first-launch, home for returning users).
USER GOAL: Recognize the brand. No interaction.
ENTRY: Cold app launch.
EXIT: Auto-transitions to M1.2 (first-launch) or to home (returning).

LAYOUT
- Full-screen background: Brand Black #010101.
- Vertically centered: SOS24 logo (white/monochrome variant — red S-mark + white "SOS24" wordmark on black). Logo height 96.
- Below logo (24 px gap): tagline in Inter Medium 15, color #9A9AA0: "Помощник 24/7 на дороге".
- Bottom 48 px from safe-area: thin progress indicator (2 px tall, 200 px wide), color #E61428, indeterminate animation.
- No status bar elements (full immersive).

COMPONENTS
- Logo (centered).
- Tagline text.
- Indeterminate red progress bar.

STATES TO GENERATE
- default (loading)

EDGE CASES
- Long tagline localization (4 langs) — keep single line; if uz-Cyrl is wider, allow up to 2 lines centered.
```

---

## M1.2 — Onboarding 1 «Полис за 2 минуты»

```
SCREEN: M1.2 — Onboarding step 1 of 3
PURPOSE: Show the core value prop — buying an MTPL/CASCO policy in 2 minutes.
USER GOAL: Understand what the app does. Swipe forward or skip.
ENTRY: After splash on first launch.
EXIT: Swipe / "Дальше" → M1.3. "Пропустить" → M1.5 (language).

LAYOUT
- Full-screen split: top 60% = hero illustration on Brand Black #010101 background; bottom 40% = white sheet with rounded top corners (radius 24).
- Hero (top): editorial photo of a modern car (3/4 angle, neutral color body) on subtle gradient — center-cropped. Small SOS24 red S-mark watermark top-left of hero, 32 px.
- "Skip" link top-right, Inter Medium 15, color #9A9AA0.
- Bottom sheet:
  - Page indicator: 3 dots, top-center of sheet, active dot Brand Red #E61428, inactive Neutral 100.
  - Headline H1 Mont Heavy 32 #010101, two lines: "Полис ОСАГО или КАСКО — за 2 минуты".
  - Body Inter Regular 15 #9A9AA0, 2 lines: "Введите номер авто — данные подтянутся автоматически. Оплата картой Uzcard или Humo."
  - Primary CTA "Дальше" (full-width, height 56, radius 12, fill #E61428, text white Inter SemiBold 16).
  - 16 px below CTA: secondary text-link "Пропустить", centered, Inter Medium 14, #9A9AA0.

COMPONENTS
- Hero photo block.
- Skip link top-right.
- Bottom sheet with page indicator, headline, body, primary CTA.

STATES TO GENERATE
- default

EDGE CASES
- Long headline in uz-Cyrl — allow 3 lines max, headline shrinks to 28 if needed.
```

---

## M1.3 — Onboarding 2 «E-полис с QR»

```
SCREEN: M1.3 — Onboarding step 2 of 3
PURPOSE: Show that the policy lives in the phone — e-policy with QR for traffic-police checks.
USER GOAL: Understand the e-policy benefit. Swipe forward.
ENTRY: From M1.2.
EXIT: "Дальше" → M1.4. "Пропустить" → M1.5.

LAYOUT
- Same split structure as M1.2 (hero top 60% on black, white bottom sheet).
- Hero: a phone mockup tilted slightly (15°), screen showing a policy card with car illustration, policy number "AB 1234567", and a large QR code. Around the phone — soft red glow #E61428 at 20% opacity. Black background.
- Skip link top-right.
- Bottom sheet:
  - Page indicator: dot 2 of 3 active.
  - Headline: "Электронный полис всегда в телефоне".
  - Body: "Покажите QR-код инспектору ГАИ — без бумажек и поиска по бардачку."
  - Primary CTA "Дальше".
  - Secondary "Пропустить".

COMPONENTS
- Hero with phone mockup and QR.
- Bottom sheet identical structure to M1.2.

STATES TO GENERATE
- default
```

---

## M1.4 — Onboarding 3 «ДТП и комиссар»

```
SCREEN: M1.4 — Onboarding step 3 of 3
PURPOSE: Show the rescue side of the brand — accident reporting and on-site adjuster dispatch.
USER GOAL: Feel the "24/7 helper on the road" promise. Tap "Начать".
ENTRY: From M1.3.
EXIT: "Начать" → M1.5 (language).

LAYOUT
- Same split. Hero: a calm scene — a car with hazard lights on (red triangle indicator visible) on a roadside at dusk, soft warm tones. A subtle red pulse circle around the car (representing emergency signal). Black background.
- Skip link top-right (still available — last chance).
- Bottom sheet:
  - Page indicator: dot 3 of 3 active.
  - Headline: "ДТП? Один тап — комиссар уже в пути".
  - Body: "Заявление о ДТП прямо с места. Аварийный комиссар приедет 24/7 — мы держим под рукой."
  - Primary CTA "Начать" (instead of "Дальше" — final step).
  - Secondary "Пропустить".

COMPONENTS
- Hero with hazard-light car.
- Bottom sheet with final CTA.

STATES TO GENERATE
- default

EDGE CASES
- Tone here is calm, NOT alarming — we're trustworthy, not scary.
```

---

## M1.5 — Language Selection

```
SCREEN: M1.5 — Language selection (4 options)
PURPOSE: Let the user pick UI language before phone entry. All 4 options always visible.
USER GOAL: Pick language and continue.
ENTRY: After onboarding skip / "Начать". Also accessible from M2 Settings later.
EXIT: Tap a language card → M1.6 (phone). All 4 cards select the same way.

LAYOUT
- White background.
- Top bar: 56 px, only a back arrow left (small, 24 px, color #010101). No title.
- Content padding 24 px horizontal.
- Headline Mont Bold 28 #010101 top of content: "Выберите язык". (Below it, the same headline duplicated in the other 3 langs at 15 Inter Regular #9A9AA0, stacked: "Tilni tanlang", "Тилни танланг", "Choose language".)
- 32 px gap.
- Stack of 4 selectable cards (each 72 px tall, full width minus padding, radius 16, border 1 px Neutral 100, 16 px gap):
  - Card structure: round flag icon left (32 px) — "🇺🇿 lat" / "🇺🇿 cyr" / "🇷🇺" / "🇬🇧" stylized as round flag chips, NOT emoji. Title Inter SemiBold 16 #010101. Subtitle Inter Regular 13 #9A9AA0.
  - Card 1: "O'zbek (Lotin)" / "O'zbekcha lotin alifbosida"
  - Card 2: "Ўзбек (Кирилл)" / "Ўзбекча кирилл алифбосида"
  - Card 3: "Русский" / "Русский язык"
  - Card 4: "English" / "English language"
  - Tap state: card border becomes Brand Red #E61428 2 px, fills with #E61428 at 4% opacity, right-side small red checkmark appears.
- No CTA — selecting a card auto-advances.

COMPONENTS
- 4 language cards, mutually exclusive selection.
- Round flag icons (custom, not emoji).

STATES TO GENERATE
- default (no selection)
- selected (one card active — show "Русский" selected as the example)

EDGE CASES
- Returning user with saved lang — pre-selected card on entry.
```

---

## M1.6 — Phone Entry

```
SCREEN: M1.6 — Phone number entry
PURPOSE: Collect Uzbekistan mobile number for SMS-OTP login.
USER GOAL: Enter phone, tap "Получить код".
ENTRY: From M1.5 or "Sign in" on splash.
EXIT: Valid number + tap CTA → M1.7 (SMS code). MyID / OneID buttons → external auth flow.

LAYOUT
- White background.
- Top bar: back arrow left, no title.
- Content padding 24 px.
- Headline Mont Bold 28 two lines: "Введите номер телефона".
- Subhead Inter Regular 15 #9A9AA0: "Отправим SMS с кодом подтверждения".
- 32 px gap.
- Phone input (height 56, radius 12, border 1 px Neutral 100, focus border #E61428):
  - Left: "+998" prefix in Inter SemiBold 16 #010101, separator 1px Neutral 100.
  - Right: 9-digit field with mask "00 000 00 00", placeholder "90 123 45 67", Inter SemiBold 18 #010101.
- 8 px below input: helper text Inter Regular 13 #9A9AA0: "Только узбекские номера".
- 24 px gap.
- Primary CTA "Получить код" (full-width, height 56, radius 12, fill #E61428, text white Inter SemiBold 16). Disabled state when number incomplete: fill Neutral 100, text Neutral 400.
- 24 px gap.
- Divider with text "или войти через" — thin Neutral 100 line + centered text Inter Regular 13 #9A9AA0.
- 16 px gap.
- Two side-by-side outline buttons (each 50% width minus 8 px gap, height 52, radius 12, border 1 px Neutral 100, white fill, text Inter SemiBold 14 #010101):
  - "MyID" with small ID-card icon left.
  - "OneID" with small lock icon left.
- Bottom of screen (above safe area, 24 px from bottom): legal microcopy Inter Regular 12 #9A9AA0, two lines: "Продолжая, вы соглашаетесь с Условиями использования и Политикой конфиденциальности." — with "Условиями" and "Политикой" as inline links #E61428 underline.

COMPONENTS
- Phone input with +998 prefix and mask.
- Primary CTA.
- "or sign in via" divider.
- MyID / OneID outline buttons.
- Legal microcopy with inline links.

STATES TO GENERATE
- default (empty)
- typing (number partially entered, "90 12_ __ __")
- error (invalid number, red border + helper text in Brand Red: "Неверный формат номера")

EDGE CASES
- User pastes a number with country code already — auto-strip "+998".
- Soft keyboard up — make sure CTA is still visible (raise content above keyboard).
```

---

## M1.7 — SMS Code Entry

```
SCREEN: M1.7 — SMS OTP code entry
PURPOSE: Verify the phone number with a 6-digit OTP from Playmobile SMS gateway.
USER GOAL: Enter the code received by SMS.
ENTRY: From M1.6 after CTA tap.
EXIT: Correct code → M1.8 (terms acceptance) on first sign-up, or directly to home if returning user. Wrong code → inline error, retry.

LAYOUT
- White background.
- Top bar: back arrow left, no title.
- Content padding 24 px.
- Headline Mont Bold 28: "Введите код из SMS".
- Subhead Inter Regular 15 #9A9AA0, two lines: "Мы отправили код на номер +998 90 123 45 67. [Изменить]" — "Изменить" is a #E61428 inline link that returns to M1.6.
- 32 px gap.
- 6-digit OTP input — 6 separate boxes, each 48×56, radius 12, border 1 px Neutral 100, gap 8 px, centered. Active box border #E61428 2 px. Filled box shows digit Mont Bold 24 #010101.
- 16 px gap.
- Resend countdown: centered, Inter Medium 14 #9A9AA0: "Отправить код повторно через 0:42" — when expired, becomes a tappable link "Отправить код повторно" #E61428.
- 32 px gap.
- Primary CTA "Подтвердить" (full-width, height 56, radius 12, fill #E61428, white text). Disabled until 6 digits entered.

COMPONENTS
- 6-box OTP input (auto-advance, paste-friendly).
- Resend countdown / link.
- Primary CTA.
- "Изменить" link to return to phone entry.

STATES TO GENERATE
- default (empty boxes, countdown 0:60)
- typing (3 of 6 filled)
- error (wrong code — boxes turn red border, error text below: "Неверный код. Попробуйте ещё раз.")
- resend-available (countdown elapsed, link active)

EDGE CASES
- User pastes the code — fills all 6 boxes.
- Code auto-fills from iOS SMS suggestion bar (system feature; design must support it).
- After 5 wrong attempts: lock with message "Слишком много попыток. Попробуйте через 5 минут."
```

---

## M1.8 — Terms Acceptance

```
SCREEN: M1.8 — Terms & privacy acceptance (first sign-up only)
PURPOSE: One-time consent for Terms of Use and Privacy Policy. Required by UZ regulation.
USER GOAL: Read (or skim) and accept.
ENTRY: After successful M1.7 OTP for new users only. Returning users skip this.
EXIT: Both checkboxes ticked + "Принимаю" → M2 profile completion (or home if profile filled). Decline → return to splash with logout.

LAYOUT
- White background.
- Top bar: 56 px, title Mont Bold 18 #010101 "Условия использования", no back arrow (forced flow).
- Content padding 24 px.
- Hero icon top: a centered 64 px outline icon — document with shield, color #010101.
- 16 px gap.
- Headline Mont Bold 24 centered: "Пара формальностей".
- 8 px gap.
- Body Inter Regular 15 #9A9AA0 centered, 3 lines: "Чтобы пользоваться SOS24, ознакомьтесь с условиями и согласитесь на обработку персональных данных в рамках 1С/NAPP/MyID."
- 24 px gap.
- Two checkbox rows (each 48 px tall, vertical-align center):
  - Row 1: square checkbox (24 px, radius 6, border 1.5 px Neutral 400, when checked fill #E61428 with white tick) + text Inter Regular 14 #010101 "Принимаю [Условия использования]" — link in #E61428 underline opens modal/sheet.
  - Row 2: same checkbox + "Согласен на [обработку персональных данных]" — link.
- 32 px gap.
- Primary CTA "Принимаю" (full-width, height 56, radius 12, fill #E61428, white text). Disabled until BOTH checked: fill Neutral 100, text Neutral 400.
- 12 px gap.
- Secondary text-link centered "Не согласен — выйти", Inter Medium 14 #9A9AA0.

COMPONENTS
- Title hero icon.
- 2 checkbox rows with inline links.
- Primary CTA (gated by both checks).
- Decline link.

STATES TO GENERATE
- default (both unchecked, CTA disabled)
- one-checked (CTA still disabled)
- both-checked (CTA enabled, full red)
- legal-modal-open (bottom sheet 80% height showing the legal text — long scrollable, with "Закрыть" button bottom — generate as a separate frame)

EDGE CASES
- User taps inline link — opens bottom sheet with full text in current locale.
- User taps "Не согласен — выйти" — confirm dialog "Без согласия мы не сможем активировать аккаунт. Точно выйти?" with two buttons.
```

---

## Что отдаём дизайнеру с этим батчем

1. Этот файл (`STITCH_BATCH_1_M1_AUTH.md`).
2. `STITCH_BASE_PROMPT.md` — базовый промпт + mobile-пресет.
3. `STITCH.md` §2 — токены бренда.
4. `assets/brand/logo.svg`, `ref1.jpg`, `ref2.jpg`, `ref3.jpg`.

После генерации **8 экранов × 2 темы = 16 кадров** (плюс модалки/edge-cases) — финальный набор для M1.

## После ревью батча 1 — переход к батчу 2

Батч 2 = **M4 Каталог продуктов + M5 Покупка полиса** (~10 экранов). Это главный конверсионный флоу — после онбординга он самый важный для клиента.
