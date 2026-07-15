# SOS_ASSISTANT_SPEC.md — Детальное ТЗ: SOS-ассистент v1 (ядро)

> **Основание:** `docs/SOS_ASSISTANT.md` (решение согласовано). Здесь — пошаговая
> спецификация для аккуратной разработки **v1 (ядро)**: экран-чат + LLM-роутер + роутинг
> в готовые флоу + экстренный звонок. Callback/фото/голос — v2/v3 (см. §10).
>
> **Модуль серьёзный** — сначала утверждаем это ТЗ, потом код.

---

## 1. Объём v1

**В объёме:**
- Экран-чат «SOS24 · ИИ-помощник» по дизайну `SOS24/screens-sos.jsx`.
- LLM-роутер на `LlmService` (Gemini) со строгим JSON-выводом.
- Категории-триаж (ДТП/Мед/Угон/Имущество/Другое) + свободный ввод текста.
- Действия ИИ из **закрытого набора** → навигация в готовые флоу (клиент решает, не LLM).
- Кнопка «Экстренный звонок» (→ `tel:1024`), всегда видима.
- Персист диалога + «Начать сначала».
- Привязка `SosBanner` (Home) к чату.

**Вне объёма v1 (см. §10):** заказ callback, фото с места, голосовой ввод, проактивный контекст (гео/полисы), realtime-статус оператора.

---

## 2. Модель данных (Prisma)

```prisma
model AssistantSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  String?  @db.Text // ШИФРУЕТСЯ (AES-256-GCM, field-cipher) — JSON [{role:'user'|'ai', text, at, actions?, quickReplies?}]
  category  String?  // последний распознанный: accident|medical|theft|property|insurance|other
  urgency   String?  // low|medium|high
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, updatedAt])
  @@map("assistant_sessions")
}
```
- Одна активная сессия на пользователя (берём последнюю по `updatedAt`); «Начать сначала» создаёт новую.
- Сообщения шифруются тем же механизмом, что `TriageSession` (`common/crypto/field-cipher`, ключ `MED_ENCRYPTION_KEY`).
- Связанные сущности (id европротокола/заявки) в v1 не храним — переход просто открывает флоу; добавим в v2 при callback.

---

## 3. Бэкенд

### 3.1. Структура — `apps/api/src/assistant/`
```
assistant.module.ts        // @Module: imports LlmModule (@Global уже), PrismaModule
assistant.controller.ts    // REST под JwtAuthGuard
assistant.service.ts       // сессии + вызов провайдера + шифрование
assistant.provider.ts      // LLM-роутер (mock + llm), интерфейс + схема + промпт
assistant.types.ts         // AssistantMessage, AssistantTurn, Action, Category
```

### 3.2. Эндпоинты (все под `@UseGuards(JwtAuthGuard)`, `@Controller('assistant')`)

| Метод | Путь | Назначение | Ответ |
|---|---|---|---|
| `GET` | `/assistant/session` | Восстановить последнюю сессию (или пусто) | `{ sessionId, messages: AssistantMessage[] } \| { sessionId: null }` |
| `POST` | `/assistant/message` | Отправить сообщение пользователя → LLM-роутер | `AssistantTurn` (см. 3.4) + `sessionId` |
| `POST` | `/assistant/reset` | «Начать сначала» — новая сессия | `{ sessionId }` |

`POST /assistant/message` body: `{ sessionId?: string, text: string, category?: Category }`
- `category` передаётся, когда пользователь тапнул чип-категорию (биас для LLM).
- Если `sessionId` пуст/не найден — создаём новую сессию.
- Сервис: расшифровать историю → добавить user-сообщение → вызвать `provider.route(...)` → добавить ai-сообщение (с actions/quickReplies) → зашифровать и сохранить → вернуть `AssistantTurn`.

### 3.3. Типы (`assistant.types.ts`)
```ts
type Category = 'accident' | 'medical' | 'theft' | 'property' | 'insurance' | 'other' | 'greeting';
type Urgency  = 'low' | 'medium' | 'high';
type ActionType =
  | 'europrotocol' | 'onsite_help' | 'health_triage' | 'emergency_call'
  | 'panic_alarm'  | 'buy_policy'  | 'support'       | 'navigate' | 'request_callback';

interface Action { type: ActionType; label: string; hint?: string; param?: string }
interface AssistantMessage { role: 'user' | 'ai'; text: string; at: string; actions?: Action[]; quickReplies?: string[] }
interface AssistantTurn { reply: string; category: Category; urgency: Urgency; actions: Action[]; quickReplies: string[] }
```

### 3.4. LLM-роутер (`assistant.provider.ts`)

Интерфейс: `route(messages: AssistantMessage[], locale: string, userId?: string): Promise<AssistantTurn>`.

**Реализация `LlmAssistantProvider`** — через `this.llm.generateJson<AssistantTurn>({ feature: 'assistant_route', system: ROUTER_SYSTEM, messages, schema: ROUTER_SCHEMA, userId })`.
**`MockAssistantProvider`** — правила по ключевым словам (ДТП→accident+europrotocol/onsite/call и т.д.) для дева без ключа. Переключение — как у WHOOP/триажа (`effectiveWhoopMode`-подобно; или просто по наличию `GEMINI_API_KEY`/`TRIAGE_MODE`).

**`ROUTER_SCHEMA`** (JSON Schema для responseSchema):
```json
{
  "type": "object",
  "properties": {
    "reply": { "type": "string" },
    "category": { "type": "string", "enum": ["accident","medical","theft","property","insurance","other","greeting"] },
    "urgency": { "type": "string", "enum": ["low","medium","high"] },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["europrotocol","onsite_help","health_triage","emergency_call","panic_alarm","buy_policy","support","navigate"] },
          "label": { "type": "string" },
          "hint": { "type": "string" },
          "param": { "type": "string" }
        },
        "required": ["type","label"]
      }
    },
    "quickReplies": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["reply","category","urgency","actions","quickReplies"]
}
```
> ⚠️ `request_callback` в схему v1 НЕ включаем (Фаза 2), чтобы LLM его не предлагал.

**`ROUTER_SYSTEM`** (черновик промпта):
> Ты — ассистент SOS24 (Узбекистан). Помогаешь пользователю в любой ситуации: авария, здоровье, кража, имущество, вопросы по страховке, навигация по приложению. Отвечай КРАТКО, на языке пользователя (русский/узбекский). НЕ ставь диагнозов и не давай юридических заключений. При угрозе жизни/здоровью — в первую очередь предложи `emergency_call` (звонок диспетчеру 1024) и/или `panic_alarm`. Определи `category` и `urgency`. Предложи 1–3 РЕЛЕВАНТНЫХ действия ТОЛЬКО из списка: europrotocol (оформить европротокол — мелкое ДТП без пострадавших), onsite_help (вызвать помощь на месте — специалист приедет), health_triage (мед-консультация в приложении), emergency_call (срочный звонок диспетчеру), panic_alarm (тревога с геолокацией и оповещением контактов), buy_policy (оформить/подобрать полис), support (написать в поддержку), navigate (открыть раздел: param = policies|garage|catalog|health|documents). Не выдумывай действия вне списка. `quickReplies` — до 4 коротких вариантов ответа пользователю (или []).

**Логика urgency → UX:** `high` → клиент закрепляет блок «Экстренный вызов» вверху (см. 4.4).

### 3.5. Безопасность
- Навигацию выполняет ТОЛЬКО клиент по `action.type` (жёсткий маппинг). LLM не может увести в произвольное место.
- `param` для `navigate` валидируется белым списком на клиенте.
- Промпт запрещает диагнозы/юр-заключения; дисклеймер в UI.
- Экстренный звонок доступен всегда, вне зависимости от LLM.
- Каждый вызов → `AiUsageLog` (feature='assistant_route') — это уже делает `LlmService`.

---

## 4. Мобилка

### 4.1. Навигация
- Новый экран `SosAssistantScreen` в отдельном стеке `SosNavigator` (или маршрут в `MainNavigator`), презентация — как модал/полноэкранный.
- **Вход:** `SosBanner` на Home → `onPress` → открыть SOS-ассистента. (Сейчас `SosBanner` без `onPress`.)
- Также точка входа из быстрых действий, если нужно.

### 4.2. Структура экрана (по дизайну)
- **Хедер** (стеклянный): назад · SOS-лого (`SosMark`, красный градиент) с зелёной точкой · «SOS24 · ИИ-помощник» + статус · кнопка **«Экстренный звонок»** (phone-иконка → `tel:1024`).
- **Диалог** (ScrollView): системная плашка → приветствие → при пустом диалоге — **категории-чипы** (`SosCategoryRow`) → пузыри пользователя (`SosUserBubble`) → карточки ИИ (`SosAiCard`) с действиями (`SosAiAction`) и, при наличии, `quickReplies`.
- **Композер:** поле «Опишите ситуацию…» + отправка. (Камера/«Заказать звонок» — задизейблены/скрыты в v1, каркас оставить под v2/v3.)

### 4.3. Компоненты (переиспользуем/портируем из дизайна)
`SosAiCard`, `SosUserBubble`, `SosSystemNote`, `SosCategoryRow`, `SosAiAction` — портировать 1:1 из `screens-sos.jsx` в RN (наши токены). Индикатор «печатает…» при ожидании LLM.

### 4.4. Клиентский маппинг действий (жёсткий)
```
europrotocol   → nav → EuroStart
onsite_help    → nav → AdjusterRequest
health_triage  → nav → HealthTriage
buy_policy     → nav → Каталог (Purchase)
support        → nav → SupportHub/NewTicket
panic_alarm    → nav → HealthSosActive (гео+оповещение)
emergency_call → Linking tel:1024
navigate       → whitelist(param): policies|garage|catalog|health|documents → соответств. раздел
```
`urgency==='high'` → показать закреплённую плашку «Экстренный вызов 1024» вверху диалога.

### 4.5. Состояние и персист
- `assistantStore` (Zustand + persist, как `triageStore`): `sessionId`, `messages`, `sending`.
- При открытии — `GET /assistant/session` восстанавливает диалог.
- Отправка: оптимистично добавляем user-сообщение → «печатает…» → `POST /assistant/message` → добавляем ai-сообщение (reply + actions + quickReplies).
- Кнопка «Начать сначала» → `POST /assistant/reset` → очистка.
- Тап по категории-чипу = отправка сообщения с `category` (напр. текст «У меня ДТП», category='accident').

### 4.6. Состояния UI
- **Пусто:** приветствие + категории-чипы.
- **Загрузка ответа:** индикатор «печатает…».
- **Ошибка LLM/сети:** ai-сообщение-фолбэк «Не удалось обработать. Попробуйте ещё раз или позвоните диспетчеру 1024» + действие `emergency_call`.
- **Оффлайн:** дизейбл отправки + подсказка + кнопка звонка активна.

---

## 5. Примеры контракта LLM (для проверки)

**Пользователь:** «Я попал в ДТП, второй водитель согласен»
```json
{ "reply": "Похоже на мелкое ДТП без пострадавших — подойдёт европротокол. Что предпочитаете?",
  "category": "accident", "urgency": "medium",
  "actions": [
    { "type": "europrotocol", "label": "Оформить европротокол", "hint": "сами · 5 мин" },
    { "type": "onsite_help", "label": "Вызвать помощь на месте", "hint": "приедет специалист" },
    { "type": "emergency_call", "label": "Связаться с диспетчером", "hint": "1024" }
  ], "quickReplies": ["Есть пострадавшие", "Второй не согласен"] }
```
**Пользователь:** «Плохо с сердцем, боль в груди»
```json
{ "reply": "Это может быть опасно. Срочно свяжитесь с диспетчером или вызовите скорую.",
  "category": "medical", "urgency": "high",
  "actions": [
    { "type": "emergency_call", "label": "Позвонить диспетчеру", "hint": "1024" },
    { "type": "panic_alarm", "label": "Тревога с геолокацией" },
    { "type": "health_triage", "label": "Мед-консультация в приложении" }
  ], "quickReplies": [] }
```
**Пользователь:** «Покажи мои полисы»
```json
{ "reply": "Открываю ваши полисы.", "category": "other", "urgency": "low",
  "actions": [ { "type": "navigate", "label": "Мои полисы", "param": "policies" } ], "quickReplies": [] }
```

---

## 6. Обработка ошибок / edge cases
- LLM вернул невалидный JSON → `generateJson` ретраит (в `LlmService`); при провале — фолбэк-turn (см. 4.6).
- LLM предложил тип вне enum → схема не пропустит; при `navigate` с неизвестным `param` — клиент игнорирует действие.
- Пустой ввод — не отправляем.
- Очень длинная история — обрезаем до последних N сообщений перед вызовом LLM (напр. 12).

---

## 7. Критерии приёмки v1
1. SOS-кнопка на Home открывает чат-ассистента.
2. Приветствие + 5 категорий; тап по категории даёт релевантный ответ ИИ с действиями.
3. Свободный текст обрабатывается LLM (реальный Gemini на проде, mock на деве).
4. Действия ведут в правильные флоу (европротокол/помощь на месте/триаж/каталог/поддержка/тревога/навигация).
5. «Экстренный звонок» (1024) доступен всегда; при `urgency=high` — закреплён вверху.
6. Диалог сохраняется между входами; «Начать сначала» очищает.
7. Каждый вызов LLM виден в админ-логе AI (feature=assistant_route).
8. Ошибка LLM/сети → мягкий фолбэк + звонок.

---

## 8. Локализация
Строки RU сейчас (как остальной аппликуха); LLM отвечает на языке пользователя. UZ-строки — в общий i18n-этап проекта.

---

## 9. Порядок работ (задачи)
1. **БД:** модель `AssistantSession` + миграция.
2. **Бэкенд:** типы → провайдер (mock+llm, схема+промпт) → сервис (шифрование сессии) → контроллер (3 эндпоинта) → модуль. Проверить сквозняком (message → turn).
3. **Мобилка:** api-хуки (`useAssistantSession`, `sendMessage`, `reset`) → компоненты (портировать из дизайна) → экран → store+persist → маппинг действий → привязать `SosBanner`.
4. **Проверка:** сценарии из §5 на деве (mock) и на проде (real Gemini), критерии §7.

## 10. Вне объёма v1 → следующие фазы
- **v2:** `request_callback` (заявка операторам поддержки/колл-центра) + переход в чат поддержки.
- **v3:** фото с места (MinIO → в европротокол), голосовой ввод (speech-to-text на Gemini уже есть), проактивный контекст (гео, активные полисы/авто), realtime-статус оператора.

## 11. Связанные материалы
- Решение: `docs/SOS_ASSISTANT.md` · Дизайн: `SOS24/screens-sos.jsx`
- Шаблон LLM: `apps/api/src/health/triage/triage.provider.ts`, `apps/api/src/llm/`
- Роутинг-цели: EuroNavigator, AdjusterRequest, HealthTriage, Purchase/Catalog, Support
- Хендофф (v2): `docs/CALLCENTER.md`, `apps/api/src/call-center/`, поддержка M13
