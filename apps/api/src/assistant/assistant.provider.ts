import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import type { Action, ActionType, AssistantMessage, AssistantTurn, Category } from './assistant.types';

// LLM-роутер SOS-ассистента. При наличии Gemini — строгий JSON через LlmService,
// иначе — mock-правила по ключевым словам (дев без ключа). См. docs/SOS_ASSISTANT_SPEC.md.

const ACTION_TYPES: ActionType[] = [
  'europrotocol', 'onsite_help', 'health_triage', 'emergency_call', 'panic_alarm', 'buy_policy', 'support', 'navigate',
];

const ROUTER_SYSTEM = `Ты — ассистент SOS24 (Узбекистан). Помогаешь пользователю в любой ситуации: авария (ДТП), здоровье, кража/угон, имущество, вопросы по страховке, навигация по приложению.
Правила:
- Отвечай КРАТКО и по делу, на языке пользователя (русский или узбекский).
- НЕ ставь медицинских диагнозов и НЕ давай юридических заключений.
- При угрозе жизни/здоровью или серьёзной опасности — в первую очередь предложи emergency_call и/или panic_alarm; ставь urgency=high.
- Определи category (accident|medical|theft|property|insurance|other|greeting) и urgency (low|medium|high).
- Предложи 1–3 РЕЛЕВАНТНЫХ действия ТОЛЬКО из списка ниже. Не выдумывай действия вне списка.
Действия:
- europrotocol — оформить европротокол (мелкое ДТП без пострадавших).
- onsite_help — вызвать помощь на месте (специалист приедет).
- health_triage — мед-консультация в приложении.
- emergency_call — срочный звонок. КАЖДЫЙ номер — ОТДЕЛЬНОЕ действие (не объединяй два номера в одной кнопке). В param — ровно один номер, в label — название: «Диспетчер SOS24», «Скорая», «Полиция», «Пожарная», «Аварийная газовая». Номера: 1024 диспетчер SOS24 (ВСЕГДА первым среди звонков и всегда присутствует), 101 пожарная, 102 полиция/ГАИ, 103 скорая, 104 аварийная газовая. Примеры (два отдельных действия): сердце/травма → «Диспетчер SOS24»(1024) + «Скорая»(103); ДТП/кража/угон → 1024 + «Полиция»(102); пожар → 1024 + «Пожарная»(101); утечка газа → 1024 + «Аварийная газовая»(104).
- panic_alarm — тревога с геолокацией и оповещением экстренных контактов.
- buy_policy — оформить/подобрать полис.
- support — написать в поддержку.
- navigate — открыть раздел приложения; param одно из: policies, garage, catalog, health, documents.
quickReplies — до 4 коротких вариантов ответа пользователю, или пустой массив.
Всегда возвращай строго JSON по схеме.`;

const ROUTER_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    category: { type: 'string', enum: ['accident', 'medical', 'theft', 'property', 'insurance', 'other', 'greeting'] },
    urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ACTION_TYPES },
          label: { type: 'string' },
          hint: { type: 'string' },
          param: { type: 'string' },
        },
        required: ['type', 'label'],
      },
    },
    quickReplies: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply', 'category', 'urgency', 'actions', 'quickReplies'],
};

const NAV_WHITELIST = new Set(['policies', 'garage', 'catalog', 'health', 'documents']);

// Разрешённые номера для emergency_call. 1024 — диспетчер SOS24 (приоритет).
const HOTLINE = '1024';
const CALL_NUMBERS = new Set([HOTLINE, '101', '102', '103', '104']);

@Injectable()
export class AssistantProvider {
  constructor(private readonly llm: LlmService) {}

  async route(messages: AssistantMessage[], userId?: string): Promise<AssistantTurn> {
    if (!this.llm.enabled) return this.mock(messages);
    const contents = messages.slice(-12).map((m) => ({
      role: (m.role === 'ai' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.text }],
    }));
    const j = await this.llm.generateJson<AssistantTurn>({
      feature: 'assistant_route',
      system: ROUTER_SYSTEM,
      contents,
      schema: ROUTER_SCHEMA,
      userId: userId ?? null,
    });
    return this.sanitize(j);
  }

  // Валидация вывода LLM: чистим действия вне набора / навигацию вне whitelist,
  // нормализуем номера звонков и гарантируем приоритет 1024.
  private sanitize(t: AssistantTurn): AssistantTurn {
    const cleaned = (t.actions ?? []).filter((a) => this.validAction(a)).map((a) => this.normalizeCall(a));
    const actions = this.prioritizeHotline(cleaned).slice(0, 3);
    return {
      reply: t.reply || 'Чем могу помочь?',
      category: t.category ?? 'other',
      urgency: t.urgency ?? 'low',
      actions,
      quickReplies: (t.quickReplies ?? []).slice(0, 4),
    };
  }

  private validAction(a: Action): boolean {
    if (!a || !ACTION_TYPES.includes(a.type) || !a.label) return false;
    if (a.type === 'navigate' && !(a.param && NAV_WHITELIST.has(a.param))) return false;
    return true;
  }

  // Номер звонка держим в param; недопустимый/пустой → диспетчер 1024.
  private normalizeCall(a: Action): Action {
    if (a.type !== 'emergency_call') return a;
    const num = (a.param ?? '').replace(/\D/g, '');
    return { ...a, param: CALL_NUMBERS.has(num) ? num : HOTLINE };
  }

  // 1024 всегда присутствует и идёт первым среди звонков (если предложена госслужба).
  private prioritizeHotline(actions: Action[]): Action[] {
    if (!actions.some((a) => a.type === 'emergency_call')) return actions;
    let list = [...actions];
    // Если звонок есть, но 1024 среди них нет — вставляем перед первым звонком.
    if (!list.some((a) => a.type === 'emergency_call' && a.param === HOTLINE)) {
      const i = list.findIndex((a) => a.type === 'emergency_call');
      list.splice(i, 0, { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: HOTLINE });
    }
    // Поднять 1024 на позицию первого звонка (перед госслужбами).
    const firstCall = list.findIndex((a) => a.type === 'emergency_call');
    const hot = list.findIndex((a) => a.type === 'emergency_call' && a.param === HOTLINE);
    if (hot > firstCall) {
      const [h] = list.splice(hot, 1);
      list.splice(firstCall, 0, h);
    }
    return list;
  }

  // ── Mock (дев без ключа Gemini): простые правила по ключевым словам ──
  private mock(messages: AssistantMessage[]): AssistantTurn {
    const last = [...messages].reverse().find((m) => m.role === 'user')?.text.toLowerCase() ?? '';
    const has = (...w: string[]) => w.some((x) => last.includes(x));

    if (has('дтп', 'авари', 'столкн', 'наезд', 'ударил')) {
      return {
        reply: 'Похоже на ДТП. Если нет пострадавших — подойдёт европротокол. Что предпочитаете?',
        category: 'accident', urgency: 'medium',
        actions: [
          { type: 'europrotocol', label: 'Оформить европротокол', hint: 'сами · 5 мин' },
          { type: 'onsite_help', label: 'Вызвать помощь на месте', hint: 'приедет специалист' },
          { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: '1024' },
        ],
        quickReplies: ['Есть пострадавшие', 'Второй не согласен'],
      };
    }
    if (has('серд', 'груд', 'дыш', 'кровь', 'сознан', 'скорая', 'плохо', 'больно', 'травм')) {
      return {
        reply: 'Это может быть опасно. Позвоните диспетчеру SOS24 или в скорую, либо включите тревогу.',
        category: 'medical', urgency: 'high',
        actions: [
          { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: '1024' },
          { type: 'emergency_call', label: 'Скорая помощь', hint: '103', param: '103' },
          { type: 'panic_alarm', label: 'Тревога с геолокацией' },
        ],
        quickReplies: [],
      };
    }
    if (has('угон', 'украл', 'кража', 'нет авто', 'пропал')) {
      return {
        reply: 'Похоже на угон/кражу. Позвоните диспетчеру SOS24 или в полицию — подскажем порядок действий.',
        category: 'theft', urgency: 'high',
        actions: [
          { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: '1024' },
          { type: 'emergency_call', label: 'Полиция', hint: '102', param: '102' },
          { type: 'support', label: 'Написать в поддержку' },
        ],
        quickReplies: [],
      };
    }
    if (has('газ', 'запах газа', 'утечк')) {
      return {
        reply: 'Утечка газа опасна. Позвоните диспетчеру SOS24 или в аварийную газовую службу.',
        category: 'property', urgency: 'high',
        actions: [
          { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: '1024' },
          { type: 'emergency_call', label: 'Аварийная газовая', hint: '104', param: '104' },
        ],
        quickReplies: [],
      };
    }
    if (has('пожар', 'горит', 'дым')) {
      return {
        reply: 'При пожаре звоните немедленно. Диспетчер SOS24 или пожарная служба.',
        category: 'property', urgency: 'high',
        actions: [
          { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: '1024' },
          { type: 'emergency_call', label: 'Пожарная служба', hint: '101', param: '101' },
        ],
        quickReplies: [],
      };
    }
    if (has('залив', 'затоп', 'имуществ', 'квартир', 'дом')) {
      return {
        reply: 'Расскажите, что случилось с имуществом. Могу связать со специалистом.',
        category: 'property', urgency: 'medium',
        actions: [
          { type: 'emergency_call', label: 'Диспетчер SOS24', hint: 'приоритет', param: '1024' },
          { type: 'support', label: 'Написать в поддержку' },
        ],
        quickReplies: ['Пожар', 'Залив', 'Утечка газа'],
      };
    }
    if (has('полис', 'страхов', 'осаго', 'каско', 'купить')) {
      return {
        reply: 'Помогу с полисом. Открыть каталог или показать ваши полисы?',
        category: 'insurance', urgency: 'low',
        actions: [
          { type: 'buy_policy', label: 'Подобрать полис' },
          { type: 'navigate', label: 'Мои полисы', param: 'policies' },
        ],
        quickReplies: ['ОСАГО', 'КАСКО', 'Медицинский'],
      };
    }
    // greeting / other
    return {
      reply: 'Здравствуйте! Я SOS24-помощник. Опишите ситуацию или выберите категорию ниже.',
      category: 'greeting', urgency: 'low',
      actions: [{ type: 'emergency_call', label: 'Экстренный звонок · диспетчер SOS24', hint: 'приоритет', param: '1024' }],
      quickReplies: ['ДТП', 'Мед. помощь', 'Угон', 'Вопрос по полису'],
    };
  }
}
