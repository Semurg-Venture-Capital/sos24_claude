// Движок ИИ-триажа (M14.2/14.3). Интерфейс + mock-реализация (сценарные вопросы) +
// LLM-реализация на Gemini. Переключение через TRIAGE_MODE=mock|llm (+ нужен GEMINI_API_KEY).
// Интерфейс async и получает полную историю диалога — чтобы LLM вёл связный разговор.

import { Logger } from '@nestjs/common';

export type Urgency = 'low' | 'medium' | 'high';

export interface TriageMessage {
  role: 'assistant' | 'user';
  text: string;
  at: string;
}

export interface TriageTurn {
  text: string;
  quickReplies: string[];
  canFinalize: boolean;
}

export interface TriageRecommendation {
  text: string;
  tone: 'default' | 'red';
}

export interface TriageVerdict {
  verdict: string;
  description: string;
  urgency: Urgency;
  confidence: number; // 0..100
  symptoms: string[];
  recommendations: TriageRecommendation[];
  suggestedSpecialty: string | null;
}

export interface TriageProvider {
  intro(): Promise<TriageTurn>;
  ask(messages: TriageMessage[]): Promise<TriageTurn>;
  finalize(messages: TriageMessage[]): Promise<TriageVerdict>;
}

// ── Общий вступительный экран (без вызова LLM — экономим запрос) ──
const INTRO: TriageTurn = {
  text: 'Здравствуйте! Я медицинский ИИ SOS24. Помогу сориентироваться. Что вас беспокоит? Опишите симптомы своими словами.',
  quickReplies: ['Температура', 'Боль в горле', 'Головная боль', 'Кашель', 'Боль в животе', 'Боль в груди'],
  canFinalize: false,
};

// ─────────────────────────── Конфиг LLM ───────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const LLM_MODEL = process.env.LLM_MODEL ?? 'gemini-2.5-flash';
const GEMINI_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

export function effectiveTriageMode(): 'mock' | 'llm' {
  return (process.env.TRIAGE_MODE ?? 'mock').toLowerCase() === 'llm' && !!GEMINI_API_KEY ? 'llm' : 'mock';
}

const RED_FLAGS = ['боль в груди', 'в груди', 'давит груд', 'одышк', 'задыха', 'теряю сознан', 'потерял сознан', 'кровотеч', 'инсульт', 'немеет', 'речь', 'сильная боль'];

function has(text: string, keys: string[]): boolean {
  const t = text.toLowerCase();
  return keys.some((k) => t.includes(k));
}

function userTextsOf(messages: TriageMessage[]): string[] {
  return messages.filter((m) => m.role === 'user').map((m) => m.text);
}

// ─────────────────────────────── MOCK ───────────────────────────────
const QUESTIONS: TriageTurn[] = [
  { text: 'Поняла. Уточню пару деталей. Какая температура сейчас?', quickReplies: ['до 37.5°', '37.5–38.5°', 'выше 38.5°', 'не мерил(а)'], canFinalize: false },
  { text: 'Есть ли боль в горле или кашель?', quickReplies: ['Только насморк', 'Болит горло', 'Есть кашель', 'Ничего из этого'], canFinalize: false },
  { text: 'Как давно это началось?', quickReplies: ['Сегодня', '2-й день', '3+ дня'], canFinalize: false },
];

const URGENT_TURN: TriageTurn = {
  text: 'Судя по описанию, это может быть неотложное состояние. Не откладывайте — при ухудшении вызывайте 103. Подготовлю рекомендации.',
  quickReplies: [],
  canFinalize: true,
};

export class MockTriageProvider implements TriageProvider {
  async intro(): Promise<TriageTurn> {
    return INTRO;
  }

  async ask(messages: TriageMessage[]): Promise<TriageTurn> {
    const userTexts = userTextsOf(messages);
    const step = Math.max(0, userTexts.length - 1); // первый ответ пользователя → шаг 0
    const userText = userTexts[userTexts.length - 1] ?? '';
    if (has(userText, RED_FLAGS)) return URGENT_TURN;
    if (step < QUESTIONS.length) return QUESTIONS[step];
    return { text: 'Спасибо, всё понятно. Готовлю предварительный результат.', quickReplies: [], canFinalize: true };
  }

  async finalize(messages: TriageMessage[]): Promise<TriageVerdict> {
    const all = userTextsOf(messages).join(' · ').toLowerCase();
    const symptoms: string[] = [];
    if (has(all, ['нос', 'насморк', 'заложен'])) symptoms.push('Заложен нос');
    if (has(all, ['горло'])) symptoms.push('Боль в горле');
    if (has(all, ['кашель'])) symptoms.push('Кашель');
    if (has(all, ['голов', 'мигрень'])) symptoms.push('Головная боль');
    if (has(all, ['живот', 'тошнот', 'рвот', 'понос', 'диар'])) symptoms.push('ЖКТ');
    if (has(all, ['37.5–38.5', '37.5-38.5'])) symptoms.push('Температура 37.5–38.5°');
    else if (has(all, ['выше 38.5', 'выше 39', '39'])) symptoms.push('Высокая температура');
    else if (has(all, ['температур', 'до 37.5'])) symptoms.push('Температура');

    if (has(all, RED_FLAGS)) {
      return {
        verdict: 'Возможно неотложное состояние',
        description: 'Описанные симптомы могут указывать на состояние, требующее срочной помощи. Не занимайтесь самолечением.',
        urgency: 'high',
        confidence: 55,
        symptoms: symptoms.length ? symptoms : ['Тревожные симптомы'],
        recommendations: [
          { text: 'Немедленно вызовите скорую — 103', tone: 'red' },
          { text: 'Не принимайте лекарства без назначения до осмотра', tone: 'default' },
        ],
        suggestedSpecialty: 'Кардиолог',
      };
    }
    if (has(all, ['живот', 'тошнот', 'рвот', 'понос', 'диар'])) {
      return {
        verdict: 'Расстройство ЖКТ', description: 'Симптомы похожи на пищевое расстройство или гастрит. Обычно помогает терапевт или гастроэнтеролог.',
        urgency: 'medium', confidence: 64, symptoms,
        recommendations: [
          { text: 'Записаться к терапевту в ближайшие 1–2 дня', tone: 'default' },
          { text: 'Пить воду маленькими глотками, лёгкая диета', tone: 'default' },
          { text: 'При сильной боли, крови или температуре >39° — вызовите 103', tone: 'red' },
        ],
        suggestedSpecialty: 'Терапевт',
      };
    }
    if (has(all, ['нос', 'насморк', 'горло', 'кашель', 'температур', 'озноб', 'простуд'])) {
      const high = has(all, ['выше 38.5', 'выше 39', '39']);
      return {
        verdict: 'Острый ринит / ОРВИ', description: 'Симптомы похожи на вирусную инфекцию верхних дыхательных путей. Скорее всего, поможет ЛОР-врач или терапевт.',
        urgency: high ? 'medium' : 'low', confidence: 78, symptoms,
        recommendations: [
          { text: 'Записаться к ЛОР-врачу в ближайшие 1–2 дня', tone: 'default' },
          { text: 'Обильное питьё, покой, проветривание', tone: 'default' },
          { text: 'Если температура выше 39° или одышка — вызовите 103', tone: 'red' },
        ],
        suggestedSpecialty: 'ЛОР',
      };
    }
    return {
      verdict: 'Требуется осмотр специалиста', description: 'Недостаточно данных для предварительной оценки. Рекомендуем очную консультацию врача.',
      urgency: 'medium', confidence: 50, symptoms: symptoms.length ? symptoms : ['Симптомы уточняются'],
      recommendations: [
        { text: 'Записаться к терапевту для очного осмотра', tone: 'default' },
        { text: 'При резком ухудшении — вызовите 103', tone: 'red' },
      ],
      suggestedSpecialty: 'Терапевт',
    };
  }
}

// ─────────────────────────────── LLM (Gemini) ───────────────────────────────
const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map(
  (category) => ({ category, threshold: 'BLOCK_NONE' }),
);

const ASK_SYSTEM = `Ты — медицинский ИИ-ассистент SOS24 (Узбекистан). Ведёшь короткий триаж-диалог.
Правила:
- Отвечай на языке пользователя (русский по умолчанию; поддерживай узбекский).
- Задавай ПО ОДНОМУ уточняющему вопросу за раз (характер симптомов, длительность, температура, важные детали).
- Всегда предлагай 2–4 коротких варианта быстрого ответа (quickReplies).
- Когда собрано достаточно для предварительной оценки — верни canFinalize=true и короткую подводящую фразу.
- При признаках неотложного состояния (боль в груди, одышка, потеря сознания, сильное кровотечение, признаки инсульта) — сразу canFinalize=true и фраза о необходимости вызвать 103.
- Здесь диагноз НЕ ставишь — только собираешь информацию. Будь краток и участлив.`;

const FINAL_SYSTEM = `Ты — медицинский ИИ-ассистент SOS24 (Узбекистан). По диалогу сформируй ПРЕДВАРИТЕЛЬНУЮ оценку (НЕ окончательный диагноз).
Требования к JSON:
- verdict: краткое вероятное состояние (не диагноз).
- description: 2–3 предложения простым языком.
- urgency: low | medium | high.
- confidence: целое 0–100.
- symptoms: список коротких чипов-симптомов.
- recommendations: 2–4 пункта; критичные (вызов 103 и т.п.) с tone="red", остальные tone="default".
- suggestedSpecialty: специальность врача (Терапевт, ЛОР, Кардиолог, Гастроэнтеролог и т.п.).
Обязательно: при urgency=high добавь рекомендацию вызвать 103 с tone="red". Отвечай на языке пользователя.`;

const ASK_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    quickReplies: { type: 'array', items: { type: 'string' } },
    canFinalize: { type: 'boolean' },
  },
  required: ['text', 'quickReplies', 'canFinalize'],
};

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    description: { type: 'string' },
    urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
    confidence: { type: 'integer' },
    symptoms: { type: 'array', items: { type: 'string' } },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, tone: { type: 'string', enum: ['default', 'red'] } },
        required: ['text', 'tone'],
      },
    },
    suggestedSpecialty: { type: 'string' },
  },
  required: ['verdict', 'description', 'urgency', 'confidence', 'symptoms', 'recommendations', 'suggestedSpecialty'],
};

export class LlmTriageProvider implements TriageProvider {
  private readonly logger = new Logger('LlmTriage');

  async intro(): Promise<TriageTurn> {
    return INTRO;
  }

  async ask(messages: TriageMessage[]): Promise<TriageTurn> {
    try {
      const j = await this.gemini(ASK_SYSTEM, messages, ASK_SCHEMA);
      return {
        text: String(j.text ?? 'Расскажите подробнее о симптомах.'),
        quickReplies: Array.isArray(j.quickReplies) ? j.quickReplies.slice(0, 4).map(String) : [],
        canFinalize: !!j.canFinalize,
      };
    } catch (e: any) {
      this.logger.warn(`ask fallback: ${e?.message}`);
      // Безопасный фолбэк: даём завершить и получить оценку.
      return { text: 'Спасибо. Могу подготовить предварительную оценку.', quickReplies: [], canFinalize: true };
    }
  }

  async finalize(messages: TriageMessage[]): Promise<TriageVerdict> {
    try {
      const j = await this.gemini(FINAL_SYSTEM, messages, FINAL_SCHEMA);
      const urgency: Urgency = ['low', 'medium', 'high'].includes(j.urgency) ? j.urgency : 'medium';
      const recs: TriageRecommendation[] = Array.isArray(j.recommendations)
        ? j.recommendations.map((r: any) => ({ text: String(r.text ?? ''), tone: r.tone === 'red' ? 'red' : 'default' })).filter((r: TriageRecommendation) => r.text)
        : [];
      return {
        verdict: String(j.verdict ?? 'Требуется осмотр специалиста'),
        description: String(j.description ?? ''),
        urgency,
        confidence: Number.isFinite(j.confidence) ? Math.max(0, Math.min(100, Math.round(j.confidence))) : 50,
        symptoms: Array.isArray(j.symptoms) ? j.symptoms.map(String) : [],
        recommendations: recs.length ? recs : [{ text: 'Записаться к терапевту для очного осмотра', tone: 'default' }],
        suggestedSpecialty: j.suggestedSpecialty ? String(j.suggestedSpecialty) : 'Терапевт',
      };
    } catch (e: any) {
      this.logger.warn(`finalize fallback: ${e?.message}`);
      return {
        verdict: 'Требуется осмотр специалиста',
        description: 'Не удалось получить оценку ИИ. Рекомендуем очную консультацию врача.',
        urgency: 'medium', confidence: 40, symptoms: [],
        recommendations: [
          { text: 'Записаться к терапевту', tone: 'default' },
          { text: 'При резком ухудшении — вызовите 103', tone: 'red' },
        ],
        suggestedSpecialty: 'Терапевт',
      };
    }
  }

  // Один вызов Gemini со структурированным JSON-ответом.
  private async gemini(system: string, messages: TriageMessage[], schema: object): Promise<any> {
    // Контент должен начинаться с реплики пользователя — отбрасываем ведущие assistant-сообщения.
    const trimmed = [...messages];
    while (trimmed.length && trimmed[0].role === 'assistant') trimmed.shift();
    const contents = trimmed.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));

    const res = await fetch(GEMINI_URL(LLM_MODEL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.4 },
        safetySettings: SAFETY,
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data: any = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini: пустой ответ');
    return JSON.parse(text);
  }
}

let cached: TriageProvider | null = null;
export function getTriageProvider(): TriageProvider {
  const mode = effectiveTriageMode();
  if (!cached || (cached instanceof MockTriageProvider) !== (mode === 'mock')) {
    cached = mode === 'llm' ? new LlmTriageProvider() : new MockTriageProvider();
  }
  return cached;
}
