# STITCH_BASE_PROMPT.md — Мастер-промпт для Google Stitch

> Этот файл = «system prompt» для генерации экранов SOS24 в Google Stitch. Подставляется **в начало каждого экранного промпта** (или загружается как контекст). Один источник правды по бренду.
>
> **Последнее обновление:** 2026-05-06 · **Бренд-токены:** см. `STITCH.md` §2

---

## 0. Как пользоваться

1. **Базовый промпт** (раздел 1 ниже) — копируется **в начало каждого** генерационного запроса в Stitch.
2. **Экранный промпт** (раздел 4) — добавляется после базового, описывает конкретный экран.
3. **Референсы:** `assets/brand/ref1.jpg`, `ref2.jpg`, `ref3.jpg` — прикрепляем к запросу как изображения, если Stitch это поддерживает.
4. **Логотип:** `assets/brand/logo.svg` — прикрепляем для splash/header экранов.

---

## 1. BASE PROMPT (копируется в начало каждого экрана)

```
You are designing screens for SOS24 — a 24/7 roadside-assistance and auto-insurance platform in Uzbekistan (compulsory MTPL "OSAGO" + voluntary CASCO + claims handling + on-site claim adjuster + B2B partner network of repair shops and clinics).

BRAND
- Name: SOS24. Domain: sos24.uz. Positioning: "your 24/7 helper on the road".
- Logo: provided as attachment (red circular S-mark + black "SOS24" wordmark). Place top-left of headers; minimum height 24px mobile / 32px web.
- Tone: modern, trustworthy, fintech-grade. NOT old-school insurance. In critical flows (accident, dispatch) — calm, clear, step-by-step, no panic.
- Audience: car owners 22–55, Uzbekistan, multilingual.

COLOR TOKENS (use exactly these, no other accents)
- Brand Red: #E61428  → CTA, active states, "urgent / accident", progress, key statuses. Use sparingly, never as a large fill.
- Brand Black: #010101 → primary text on light, background on dark, hero blocks.
- Brand White: #FFFFFF → primary background on light, text on dark.
- Neutral 50: #F5F5F7  → card / section background on light.
- Neutral 100: #EAEAEC → dividers, borders, disabled fills.
- Neutral 400: #9A9AA0 → secondary text, placeholders.
- Neutral 700: #2A2A2D → card background on dark.
- Success: #1FAE6F · Warning: #F5A623 · Info: #1E6FFF · Danger: #E61428.

THEMES
- Both light and dark are required for every mobile screen. Default = light. Generate the requested theme; if not specified, generate light.
- Dark: background #010101, cards #2A2A2D, text #FFFFFF, accent #E61428 unchanged.

TYPOGRAPHY
- Headlines (H1, hero, KPI numbers): Mont (Heavy / Bold). Large, editorial, tight tracking.
- Body, UI, forms, labels, captions: Inter (Regular / Medium / SemiBold).
- Numbers in metrics and donut charts: Mont Heavy, tabular-nums.
- Mobile scale (px): H1 32–40, H2 24, H3 20, Body 15–16, Caption 12–13. Hero/landing: H1 48–56.

SHAPE & STYLE
- Radii: 4 / 8 / 12 / 16 / 24. Buttons 12, cards 16, pill-chips 999.
- Shadows: low, soft, neutral. Light-mode card shadow: 0 4 16 rgba(0,0,0,0.06). No colored shadows.
- Pill-chips and pill-buttons are the primary control style for tabs, filters, statuses.
- Hero-photo or vector illustration on key screens (splash, car card, e-policy). Real car photography on neutral or dark backgrounds.
- Floating vertical action bar (glass / neutral) on the right edge for quick actions on the home screen — call adjuster, report accident, garage.
- Donut charts and progress bars for admin and B2B dashboards (KPIs, claim ratios, partner ratings).
- Icons: outline style, 1.5–2 px stroke, rounded caps (Lucide- or Phosphor-like).

LAYOUT (mobile)
- Safe area: 16 px horizontal padding default; 24 px on hero screens.
- Status bar 9:41 + iOS-style cutout. Bottom tab bar: 5 items max, icon + label, active item uses Brand Red.
- Forms: large inputs (height 52–56), label above, helper text below in Neutral 400, error state Brand Red.

LANGUAGE
- UI text in the prompt is in Russian unless otherwise specified, but the app supports 4 locales: O'zbek (Lotin), Ўзбек (Кирилл), Русский, English. Language selector shows all 4.

ACCESSIBILITY
- WCAG AA contrast on all text (≥ 4.5:1 body, ≥ 3:1 large).
- Tap targets ≥ 44 px.

REFERENCES (attached or named)
- ref1: WheelzUp — onboarding dark + light feed + product detail (hero photo, pill-chips, rounded cards). Take the hero/photo treatment and chip patterns. Replace any lime-green accent with #E61428.
- ref2: Porsche dark — editorial dark theme, KPI metrics, donut charts, floating action bar, AI assistant. Take the dark theme, metrics, vertical action bar. Replace lime accents with #E61428.
- ref3: Porsche light — same grid in light theme, glass floating bar, progress bars. Take the stacked cards, top tabs, progress bars.

WHAT TO AVOID
- Cluttered screens, small body text on forms.
- Aggressive "buy now" banners.
- Yellow / lime / neon-green accents (not in our palette).
- Stock illustrations of "hands shaking on insurance" — use car photography or flat geometric illustrations.

OUTPUT
- One screen at a time, fully composed: status bar, header, content, navigation.
- Always include empty / loading / error states when relevant.
- For mobile screens, generate at iPhone 14/15 Pro frame (393 × 852) unless told otherwise.
- For web, generate at 1440 desktop default.
```

---

## 2. PLATFORM PRESETS (добавляются после base)

### 2.1 Mobile App (iOS first)
```
Platform: iOS / React Native, frame 393×852.
Status bar: 9:41 with Dynamic Island.
Bottom tab bar 5 items: Главная / Полисы / Гараж / Заявления / Профиль.
Active tab icon and label: #E61428. Inactive: Neutral 400.
Top bar: white (light) or #010101 (dark), 56 px tall, title in Mont Bold 18, back-arrow left, optional action right.
Use SF-system-spacing scale (4-pt grid).
```

### 2.2 Web Landing (sos24.uz)
```
Platform: Next.js landing, frame 1440 desktop.
Header: white sticky, 80 px tall, logo left, nav center, "Купить полис" CTA red right, language switcher far right (4 langs).
Hero: full-width 720 px tall, dark background #010101, headline Mont Heavy 56, subheading Inter 18, primary CTA red.
Sections: 96 px vertical padding, 1200 px max-width content.
Footer: dark #010101, 4 columns + legal.
```

### 2.3 Web Admin (внутренняя)
```
Platform: Next.js admin, frame 1440 desktop, light theme primary.
Layout: left sidebar 240 px (collapsible), top bar 56 px with breadcrumbs and user menu, content with 24 px padding.
Use dense tables, KPI cards with donut charts (paragraph from ref2), filter pill-chips, primary actions in Brand Red.
Color: white background, Neutral 50 cards, Brand Black text.
```

### 2.4 Web Partner Cabinet (B2B для СТО / клиник)
```
Platform: Next.js B2B portal, frame 1440 desktop, both themes (light primary).
Layout similar to admin but lighter: sidebar 220 px, content cards in Neutral 50, KPI strip on dashboard with donut + progress (ref3 pattern).
Critical actions (accept claim, dispatch) in Brand Red. Status pills color-coded by Success/Warning/Danger.
```

---

## 3. STATE GUIDELINES (всегда генерим вместе с экраном)

Для каждого экрана с данными или формой:
- **Default** — заполненное состояние с реалистичными данными RU/UZ.
- **Empty** — нет данных + объясняющая иллюстрация + CTA.
- **Loading** — skeleton-блоки в форме контента, не спиннер.
- **Error** — короткое сообщение в Brand Red + кнопка «Повторить».
- **Disabled / Pressed / Focus** — для кнопок и полей.

Для критических флоу (ДТП, вызов комиссара, оплата):
- **Confirmation modal** перед действием.
- **Success state** после.
- **Failure state** с понятной причиной и следующим шагом.

---

## 4. SCREEN PROMPT TEMPLATE (форма для каждого экрана)

```
[BASE PROMPT — раздел 1]
[PLATFORM PRESET — раздел 2.x под нужную поверхность]

SCREEN: <код по STITCH.md, например M1.3 — Онбординг шаг 3>
PURPOSE: <одно предложение, зачем экран>
USER GOAL: <что пользователь хочет здесь сделать>
ENTRY: <откуда приходим>
EXIT: <куда уходим, какие CTA>

LAYOUT
- <ключевые блоки сверху вниз: status bar / header / hero / content / actions>
- <данные на экране — реалистичные, на русском>

COMPONENTS
- <конкретные компоненты: hero-photo, pill-chip-row, primary-button, KPI-card-with-donut и т.д.>

STATES TO GENERATE
- default
- <empty / loading / error если применимо>

EDGE CASES
- <конкретные edge-cases для этого экрана: длинное имя, отсутствие связи, отказ NAPP и т.д.>
```

---

## 5. ПОРЯДОК ГЕНЕРАЦИИ (батчи)

Чтобы не запутаться, идём пакетами по модулям из `STITCH.md` §3:

| Батч | Модуль | Когда |
|---|---|---|
| 1 | M1 Онбординг + Auth (8 экранов) | первый — задаёт стиль, валидируем дизайн-систему |
| 2 | M4 Каталог + M5 Покупка полиса (10 экранов) | главный продаваемый флоу |
| 3 | M7 e-Полис + M3 Гараж (8 экранов) | основное использование |
| 4 | M6 ДТП + Вызов комиссара (10 экранов) | критический флоу — финальная полировка |
| 5 | M2 Профиль + M8 Уведомления + M9 Поддержка (10 экранов) | вспомогательное |
| 6 | Web Landing (10 секций) | маркетинг |
| 7 | Web Admin (12 экранов) | внутренний |
| 8 | Web Partner Cabinet (10 экранов) | B2B |

После каждого батча — ревью с тимлидом/клиентом, корректировки base prompt при необходимости.

---

## 6. История изменений

| Дата | Что | Кем |
|---|---|---|
| 2026-05-06 | Создан, зафиксированы токены бренда (E61428 / 010101 / FFFFFF, Mont/Inter), описаны 3 референса | Claude + odilkhon |
