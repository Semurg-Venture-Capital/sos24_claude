# Design System — SOS24

> Источник правды: 2 экрана из Figma (дизайнер, май 2026).  
> Все последующие экраны строятся строго по этим правилам.

---

## 1. Цветовые токены

### Базовая палитра

| Токен | Hex | Использование |
|---|---|---|
| `--color-brand-red` | `#e61428` | CTA-кнопки, SOS-карточка, активные состояния, акценты |
| `--color-black-card` | `#121212` | Тёмные карточки (полис, вызов комиссара) |
| `--color-screen-bg` | `#e4e4e4` | Фон всех экранов — не менять |
| `--color-text-primary` | `#151515` | Основной текст на светлом фоне |
| `--color-text-secondary` | `#5f5e5e` | Вторичный текст, описания, подзаголовки |
| `--color-text-muted` | `#4d4d4d` | Третичный текст (лейблы nav, подсказки) |
| `--color-text-on-dark` | `#e0e0e0` | Текст на тёмных `#121212` карточках |
| `--color-white` | `#ffffff` | Иконки на красном, sos-icon, text CTA |
| `--color-green-confirm` | `#34d399` | **Только** состояние «подтверждено / выполнено» |

### Glassmorphism-слой

| Токен | Значение | Использование |
|---|---|---|
| `--glass-white-50` | `rgba(255,255,255,0.50)` | Основной стеклянный оверлей (nav pill, action cards) |
| `--glass-white-30` | `rgba(255,255,255,0.30)` | Лёгкий оверлей (onboarding nav bar) |
| `--glass-white-15` | `rgba(255,255,255,0.15)` | Кнопки внутри тёмных карточек |
| `--glass-blur-sm` | `5.6px` | Нижняя карточка онбординга, SOS-карточка |
| `--glass-blur-md` | `6px` | Тёмные карточки, action cards |
| `--glass-blur-nav` | `7.5px` | Nav-пилюля (Dashboard) |
| `--glass-blur-bar` | `8px` | Onboarding nav bar, нижний nav |

---

## 2. Градиенты

| Имя | CSS | Использование |
|---|---|---|
| `gradient-red-primary` | `linear-gradient(90deg, #fdccd1 19%, #e61428 53%, #e61428 100%)` | Основной фирменный градиент |
| `gradient-red-badge` | `linear-gradient(90deg, #ffb4bb 19%, #e61428 62%)` | Маркетинговые/промо бейджи (не статус полиса) |
| `gradient-red-dark` | `linear-gradient(90deg, #eb3c4d 0%, #b14751 100%)` | Тёмно-красный (иконка hamburger) |
| `gradient-grey-dots` | `linear-gradient(180deg, #e3e3e5 43%, #9c9c9c 62%)` | Неактивные page-dots |
| `gradient-green-confirm` | `linear-gradient(180deg, rgba(52,211,153,0.60) 0%, #6ee7b7 100%)` | Активный статус полиса («КАСКО Активен») + состояние «подтверждено» |

---

## 3. Типографика

### Шрифтовые семейства

| Переменная | Шрифт | Где используется |
|---|---|---|
| `--font-body` | **PP Neue Montreal** | Весь body-текст, UI-лейблы, описания, nav-текст |
| `--font-display` | **Neue Montreal** (Medium 500) | Заголовки экранов, числа, выделенные данные |
| `--font-cta` | **Mont** | **Только** тексты CTA-кнопок и action-карточек |

> PP Neue Montreal и Neue Montreal — одна гарнитура от Pangram Pangram.  
> Mont — от Fontfabric. Оба подключаются в проекте как платные шрифты.

### Типоразмеры

| Роль | Шрифт | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Hero heading | Neue Montreal | 26px | 500 | 32.5px | 0 |
| Section heading | Neue Montreal | 20px | 500 | 24px | −0.1px |
| Plate / key data | Neue Montreal | 20px | 500 | 24px | −0.1px |
| CTA button label | Mont | 16px | 700 | 24px | −0.5px |
| Action card label | Mont | 16px | 700 | 20px | 0 |
| Body regular | PP Neue Montreal | 16px | 400 | 24px | −0.08px |
| Body compact | PP Neue Montreal | 16px | 400 | 19.2px | −0.08px |
| Nav label / subtitle | PP Neue Montreal | 16px | 400 | 24px | −0.08px |
| Card model name | PP Neue Montreal | 16px | 400 | — | 0 |
| Micro badge | PP Neue Montreal | 10px | 400 | 15px | 0 |
| Date / caption | PP Neue Montreal | 10px | 400 | 12px | −0.05px |

---

## 4. Радиусы

| Токен | Значение | Использование |
|---|---|---|
| `--r-pill` | `9999px` | CTA-кнопки, nav-пилюли, page-dots, SOS-карточка, bottom-nav pill |
| `--r-card-xl` | `48px` | Стеклянные action-карточки |
| `--r-card-lg` | `36px` | Тёмные карточки (полис, «Вызвать комиссара») |

---

## 5. Тени (Elevation)

| Уровень | CSS | Применение |
|---|---|---|
| `shadow-card` | `0 4px 6px rgba(0,0,0,0.10)` | Тёмные карточки |
| `shadow-nav` | `0 3.8px 5.7px rgba(201,201,201,0.15)` | Nav bar и nav pill |
| `shadow-float` | `0 14px 20px rgba(255,255,255,0.40), 0 4px 6px rgba(201,201,201,0.10)` | Нижний floating nav |

---

## 6. Glassmorphism — правило

**Любой плавающий UI-элемент** обязан иметь стеклянный эффект:

```css
/* Светлый glass (nav pills, action cards) */
background: rgba(255, 255, 255, 0.5);
backdrop-filter: blur(6px);
-webkit-backdrop-filter: blur(6px);

/* Тёмный glass (policy card, dark action) */
background: rgba(18, 18, 18, 0.95);
backdrop-filter: blur(6px);
-webkit-backdrop-filter: blur(6px);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.10);
```

Сплошная заливка без blur **запрещена** для плавающих элементов.  
Единственное исключение: SOS-карточка — solid `#e61428` + blur 5.6px.

---

## 7. Отступы (Spacing)

Базовый шаг: **4px**.

| Значение | Использование |
|---|---|
| 4px | Gap между секциями в column-layout |
| 8px | Gap внутри карточки, между кнопками |
| 10px | Gap в 2-колоночной сетке |
| 12px | Padding мелких элементов |
| 16px | Базовый padding карточек |
| 20px | Padding тёмных карточек |
| 24px | Горизонтальный padding экрана |
| 32px | Отступ nav от верха (Dashboard) |

---

## 8. Компоненты

### Button / Primary CTA
```
Fill:    #e61428
Radius:  9999px
Height:  56px
Width:   100% (full-width блока)
Font:    Mont 700 16px/24px #ffffff, tracking −0.5px
Icon:    → arrow, stroke #ffffff, gap 8px
```

### Button / Card Secondary (на тёмной карточке)
```
Fill:    rgba(255,255,255,0.15) + backdrop-blur 4px
Radius:  9999px
Height:  36px
Font:    PP Neue Montreal 400 13px #e0e0e0
```

### Card / Policy (тёмная)
```
Fill:    rgba(18,18,18,0.95) + blur 6px
Radius:  36px
Height:  173px min
Padding: 20px
Shadow:  shadow-card
Содержит: model name, badge, plate, date, 2 action buttons
```

### Card / SOS
```
Fill:    #e61428 + blur 5.6px
Radius:  9999px
Height:  88px
Padding: 0 20px
Layout:  row, gap 14px
Icon:    белый круг 44×44, sos-symbol #e61428 внутри
```

### Card / Glass Action (светлая)
```
Fill:    rgba(255,255,255,0.5) + blur 6px
Radius:  48px
Height:  142px
Padding: 16px
Font:    Mont 700 16px/20px #151515
Layout:  align-items: flex-end
```

### Card / Glass Action (тёмная)
```
Fill:    rgba(18,18,18,0.95)
Radius:  36px
Height:  142px
Padding: 16px
Font:    Mont 700 16px/20px #ffffff
Layout:  align-items: flex-end
```

### Nav Bar / Onboarding
```
Fill:    rgba(255,255,255,0.30) + blur 8px
Height:  85px
Width:   100%
Shadow:  shadow-nav
Содержит: центрированный текст + лого
```

### Nav Bar / Dashboard (pill)
```
Fill:    rgba(255,255,255,0.50) + blur 7.5px
Height:  48px
Width:   calc(100% − 48px)
Radius:  9999px
Y:       32px от верха
Shadow:  shadow-nav
Содержит: hamburger (gradient-red-dark) | logo | bell + badge
```

### Bottom Nav / Floating Pill
```
Outer:   blur 8px, height 108px, full-width
Inner:   rgba(255,255,255,0.50) + blur 6px + shadow-float + radius 9999px + padding 8px
Buttons: 3 × круг 52×52, rgba(255,255,255,0.50) + blur 6px + radius 50%
Active:  rgba(230,20,40,0.12) fill + icon color #e61428
```

### Badge / Status Active
```
Fill:    linear-gradient(180deg, rgba(52,211,153,0.60) 0%, #6ee7b7 100%)
Radius:  9999px
Padding: 3px 10px
Font:    PP Neue Montreal 400 10px/15px #ffffff
```
> Активный статус («КАСКО Активен») — **зелёный** градиент (emerald), не красный.  
> `gradient-red-badge` — только для маркетинговых бейджей, НЕ для статуса полиса.

### Page Dots
```
Active:   #e61428, 32×10px, radius 9999px
Inactive: gradient-grey-dots, 10×10px, radius 9999px
Gap:      6px
```

---

## 9. Правила для всех новых экранов

1. **Фон:** всегда `#e4e4e4` — не белый, не тёмный, не менять
2. **Glassmorphism обязателен** для любого плавающего элемента
3. **Красный только для:** CTA, SOS, активных состояний, ошибок — не декоративно
4. **Тёмные карточки `#121212`** — для данных (полис, авто, история, финансы)
5. **Стеклянные карточки** — для действий и навигации
6. **Mont только для кнопок** — весь остальной текст PP Neue Montreal / Neue Montreal
7. **Зелёный `#34d399`** — строго для состояния «подтверждено / успешно»
8. **Все радиусы кнопок и пилюль:** `9999px`
9. **Сетка отступов:** кратно 4px
10. **Light + Dark темы обязательны** — в тёмной теме: bg `#1a1a1a`, тёмные карточки остаются, glass оверлей → `rgba(255,255,255,0.08)`
