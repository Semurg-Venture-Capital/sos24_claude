# docs/ — Документация проекта SOS24

> Вся документация проекта собрана здесь. В корне репозитория остаются только `CLAUDE.md` (контекст для AI, читается первым) и `README.md` (точка входа на GitHub).
>
> **Правило:** любой новый полезный документ кладём в эту папку, в подходящую подпапку.

---

## Структура

```
docs/
├── README.md              ← этот файл (индекс)
│
├── PLAN.md                — технический план, архитектура, модули, роадмап
├── STAGE1.md              — журнал работ Этапа 1: что сделано, где остановились
├── DEVELOPMENT.md         — инженерный процесс, команды, конвенции
├── ANDROID.md             — анализ готовности Android: блокеры, план, окружение сборки
├── DEVOPS.md              — K8s инфраструктура для DevOps (RKE2, Harbor, ArgoCD, Vault)
├── PUSH_SETUP.md          — как получить и подключить ключи push (FCM + APNs)
├── QUESTIONS.md           — открытые вопросы к клиенту
├── DESIGN_SYSTEM.md       — дизайн-токены и компоненты
├── EUROPROTOCOL.md        — исследование Европротокола (условия УЗ, варианты MVP/Full)
├── CALLCENTER.md          — колл-центр (Asterisk/SIP): архитектура, сеть, этапы
├── HEALTH.md              — модуль «Здоровье и SOS-Медицина» (M14): экраны, модель, фазы
├── TASKS.md               — подготовительные задачи Этапа 0 (legacy-справочник)
│
├── integrations/          — внешние интеграции
│   ├── NAPP.md                  — полный анализ НАПП API (e-osgo.uz)
│   └── NAPP_ENDPOINTS.md        — справочник эндпоинтов НАПП с приоритетами
│
├── compliance/            — регуляторное соответствие
│   └── INSURANCE_AGENT.md       — Положение о страховых агентах (Низом № 3845): требования + чек-лист
│
├── marketing/             — маркетинговые материалы
│   ├── 01_MARKET_RESEARCH.md / _UZ.md     — исследование рынка (ru + uz)
│   ├── 02_MARKETING_STRATEGY.md / _UZ.md  — маркетинговая стратегия
│   ├── 03_CONTENT_PLAN.md / _UZ.md        — контент-план
│   ├── GAMMA_PRESENTATION_PROMPT.md       — промпт для презентации (Gamma)
│   └── KIMI_PRESENTATION_PROMPT.md        — промпт для презентации (Kimi)
│
├── website/               — тексты для сайта (Framer-шаблон eloctix)
│   ├── sos24-website-texts.html              — главная страница (до/после)
│   └── sos24-website-texts-about-contacts.html — About + Contacts (до/после)
│
└── archive/               — сырые материалы и legacy
    ├── answers.txt              — сырые ответы клиента (раунд 1)
    ├── design-blockers.txt      — заметки по дизайн-блокерам
    ├── tasks-export.txt         — экспорт задач
    └── index.html               — HTML-презентация для клиента
```

---

## С чего начать (порядок чтения)

| Кто | Читает |
|---|---|
| **Разработчик (новый)** | `/README.md` (корень) → `STAGE1.md` → `DEVELOPMENT.md` |
| **Claude / AI** | `/CLAUDE.md` (корень) → `STAGE1.md` → нужный доменный файл |
| **DevOps** | `DEVOPS.md` |
| **Backend (НАПП)** | `integrations/NAPP_ENDPOINTS.md` → `integrations/NAPP.md` |
| **Тимлид / PM** | `PLAN.md` → `QUESTIONS.md` |
| **Маркетинг** | `marketing/` |

---

## Категории

- **Рабочие документы** (корень `docs/`) — то, что активно используется в разработке.
- **integrations/** — всё про внешние API: НАПП, MyID (в коде), платежи.
- **marketing/** — материалы для продвижения, презентаций.
- **website/** — контент для лендинга на Framer.
- **archive/** — исторические/сырые материалы, не для активной работы, но не удаляем.
