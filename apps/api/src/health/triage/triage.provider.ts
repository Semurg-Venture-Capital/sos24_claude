// Движок ИИ-триажа (M14.2/14.3). Интерфейс + mock-реализация со сценарными
// вопросами и правилами вердикта. Реальный LLM подключается позже через тот же
// интерфейс (TRIAGE_MODE=mock|llm) — сигнатуры менять не нужно.

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
  intro(): TriageTurn;
  ask(step: number, userText: string, history: string[]): TriageTurn;
  finalize(history: string[]): TriageVerdict;
}

// Сценарные уточняющие вопросы (задаются по порядку).
const QUESTIONS: TriageTurn[] = [
  { text: 'Поняла. Уточню пару деталей. Какая температура сейчас?', quickReplies: ['до 37.5°', '37.5–38.5°', 'выше 38.5°', 'не мерил(а)'], canFinalize: false },
  { text: 'Есть ли боль в горле или кашель?', quickReplies: ['Только насморк', 'Болит горло', 'Есть кашель', 'Ничего из этого'], canFinalize: false },
  { text: 'Как давно это началось?', quickReplies: ['Сегодня', '2-й день', '3+ дня'], canFinalize: false },
];

const RED_FLAGS = ['боль в груди', 'в груди', 'давит груд', 'одышк', 'задыха', 'теряю сознан', 'потерял сознан', 'кровотеч', 'инсульт', 'немеет', 'речь', 'сильная боль'];

function has(text: string, keys: string[]): boolean {
  const t = text.toLowerCase();
  return keys.some((k) => t.includes(k));
}

const URGENT_TURN: TriageTurn = {
  text: 'Судя по описанию, это может быть неотложное состояние. Не откладывайте — при ухудшении вызывайте 103. Подготовлю рекомендации.',
  quickReplies: [],
  canFinalize: true,
};

export class MockTriageProvider implements TriageProvider {
  intro(): TriageTurn {
    return {
      text: 'Здравствуйте! Я медицинский ИИ SOS24. Помогу сориентироваться. Что вас беспокоит? Опишите симптомы своими словами.',
      quickReplies: ['Температура', 'Боль в горле', 'Головная боль', 'Кашель', 'Боль в животе', 'Боль в груди'],
      canFinalize: false,
    };
  }

  ask(step: number, userText: string, _history: string[]): TriageTurn {
    // Красные флаги — сразу к финалу с высокой срочностью.
    if (has(userText, RED_FLAGS)) return URGENT_TURN;
    if (step < QUESTIONS.length) return QUESTIONS[step];
    return {
      text: 'Спасибо, всё понятно. Готовлю предварительный результат.',
      quickReplies: [],
      canFinalize: true,
    };
  }

  finalize(history: string[]): TriageVerdict {
    const all = history.join(' · ').toLowerCase();
    const symptoms: string[] = [];

    // Симптомы-чипы из ответов.
    if (has(all, ['нос', 'насморк', 'заложен'])) symptoms.push('Заложен нос');
    if (has(all, ['горло'])) symptoms.push('Боль в горле');
    if (has(all, ['кашель'])) symptoms.push('Кашель');
    if (has(all, ['голов', 'мигрень'])) symptoms.push('Головная боль');
    if (has(all, ['живот', 'тошнот', 'рвот', 'понос', 'диар'])) symptoms.push('ЖКТ');
    if (has(all, ['37.5–38.5', '37.5-38.5'])) symptoms.push('Температура 37.5–38.5°');
    else if (has(all, ['выше 38.5', 'выше 39', '39'])) symptoms.push('Высокая температура');
    else if (has(all, ['температур', 'до 37.5'])) symptoms.push('Температура');
    if (has(all, ['2-й день', '2 день', 'вчера'])) symptoms.push('2-й день');
    else if (has(all, ['3+', '3 дня', 'несколько дней'])) symptoms.push('3+ дня');

    // Красный флаг.
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

    // ЖКТ.
    if (has(all, ['живот', 'тошнот', 'рвот', 'понос', 'диар'])) {
      return {
        verdict: 'Расстройство ЖКТ',
        description: 'Симптомы похожи на пищевое расстройство или гастрит. Обычно помогает терапевт или гастроэнтеролог.',
        urgency: 'medium',
        confidence: 64,
        symptoms,
        recommendations: [
          { text: 'Записаться к терапевту в ближайшие 1–2 дня', tone: 'default' },
          { text: 'Пить воду маленькими глотками, лёгкая диета', tone: 'default' },
          { text: 'При сильной боли, крови или температуре >39° — вызовите 103', tone: 'red' },
        ],
        suggestedSpecialty: 'Терапевт',
      };
    }

    // Респираторное (ОРВИ/ринит).
    if (has(all, ['нос', 'насморк', 'горло', 'кашель', 'температур', 'озноб', 'простуд'])) {
      const high = has(all, ['выше 38.5', 'выше 39', '39']);
      return {
        verdict: 'Острый ринит / ОРВИ',
        description: 'Симптомы похожи на вирусную инфекцию верхних дыхательных путей. Скорее всего, поможет ЛОР-врач или терапевт.',
        urgency: high ? 'medium' : 'low',
        confidence: 78,
        symptoms,
        recommendations: [
          { text: 'Записаться к ЛОР-врачу в ближайшие 1–2 дня', tone: 'default' },
          { text: 'Обильное питьё, покой, проветривание', tone: 'default' },
          { text: 'Если температура выше 39° или одышка — вызовите 103', tone: 'red' },
        ],
        suggestedSpecialty: 'ЛОР',
      };
    }

    // Головная боль.
    if (has(all, ['голов', 'мигрень', 'давление'])) {
      return {
        verdict: 'Головная боль напряжения',
        description: 'Похоже на головную боль напряжения или мигрень. При частых эпизодах стоит обратиться к терапевту или неврологу.',
        urgency: 'low',
        confidence: 60,
        symptoms,
        recommendations: [
          { text: 'Отдых, сон, снижение нагрузки на глаза', tone: 'default' },
          { text: 'Записаться к терапевту при повторяющихся эпизодах', tone: 'default' },
          { text: 'Резкая «громовая» боль или онемение — вызовите 103', tone: 'red' },
        ],
        suggestedSpecialty: 'Терапевт',
      };
    }

    // По умолчанию.
    return {
      verdict: 'Требуется осмотр специалиста',
      description: 'Недостаточно данных для предварительной оценки. Рекомендуем очную консультацию врача.',
      urgency: 'medium',
      confidence: 50,
      symptoms: symptoms.length ? symptoms : ['Симптомы уточняются'],
      recommendations: [
        { text: 'Записаться к терапевту для очного осмотра', tone: 'default' },
        { text: 'При резком ухудшении — вызовите 103', tone: 'red' },
      ],
      suggestedSpecialty: 'Терапевт',
    };
  }
}
