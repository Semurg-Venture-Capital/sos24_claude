# packages/i18n-strings — Shared Translations

Общие переводы для всех клиентов SOS24. **4 локали:**

- `uz-Latn` — узбекский латиница (основная, default)
- `uz-Cyrl` — узбекский кириллица
- `ru` — русский
- `en` — английский

## Структура

```
src/
├── locales/
│   ├── uz-Latn.json
│   ├── uz-Cyrl.json
│   ├── ru.json
│   └── en.json
└── index.ts            # экспорт resources + типы Locale
```

## Конвенции

- **Namespace по доменам:** `common`, `auth`, `policy`, `claim`, `partner`, `payment`, `errors`
- **Plural-формы** — через ICU MessageFormat (i18next поддерживает)
- **uz-Latn = source of truth** — переводим оттуда на остальные 3
- **Никаких HTML/JSX** в строках — только текст + плейсхолдеры `{{name}}`

## Workflow добавления ключа

1. Добавляем в `uz-Latn.json` (основная)
2. Переводим в `uz-Cyrl.json`, `ru.json`, `en.json` (или ставим заглушку с TODO)
3. Используем в клиенте: `t('policy.osago.title')`
