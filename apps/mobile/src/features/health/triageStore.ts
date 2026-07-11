import { create } from 'zustand';
import { storage, storageKeys } from '../../lib/storage';
import type { TriageDiagnosis, TriageMessage } from '../../api/health';

// Стор чата ИИ-диагноза. Переживает выход/возврат и перезапуск приложения (persist в
// storage → AsyncStorage), пока пользователь не нажмёт «Начать сначала».

const KEY = storageKeys.triageChat;
const DEFAULT_DISCLAIMER = 'Это не диагноз. ИИ помогает сориентироваться.';

interface Persisted {
  sessionId: string | null;
  messages: TriageMessage[];
  quickReplies: string[];
  canFinalize: boolean;
  disclaimer: string;
  diagnosis: TriageDiagnosis | null;
}

const EMPTY: Persisted = {
  sessionId: null,
  messages: [],
  quickReplies: [],
  canFinalize: false,
  disclaimer: DEFAULT_DISCLAIMER,
  diagnosis: null,
};

function load(): Persisted {
  try {
    const raw = storage.getString(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Persisted) };
  } catch {
    // повреждённое значение — стартуем с пустого
  }
  return { ...EMPTY };
}

interface TriageState extends Persisted {
  hasChat: () => boolean;
  // Ответ сервера (intro или на сообщение). Сбрасывает устаревший диагноз.
  setTurn: (t: { sessionId?: string | null; messages: TriageMessage[]; quickReplies: string[]; canFinalize: boolean; disclaimer?: string }) => void;
  // Локально добавить реплику пользователя (до ответа сервера).
  appendUser: (text: string) => void;
  setDiagnosis: (d: TriageDiagnosis) => void;
  reset: () => void;
}

export const useTriageStore = create<TriageState>((set, get) => {
  const persist = () => {
    const s = get();
    storage.set(KEY, JSON.stringify({
      sessionId: s.sessionId,
      messages: s.messages,
      quickReplies: s.quickReplies,
      canFinalize: s.canFinalize,
      disclaimer: s.disclaimer,
      diagnosis: s.diagnosis,
    } satisfies Persisted));
  };

  return {
    ...load(),

    hasChat: () => !!get().sessionId,

    setTurn: (t) => {
      set((s) => ({
        sessionId: t.sessionId ?? s.sessionId,
        messages: t.messages,
        quickReplies: t.quickReplies,
        canFinalize: t.canFinalize,
        disclaimer: t.disclaimer ?? s.disclaimer,
        diagnosis: null, // новый ход делает прошлый диагноз неактуальным
      }));
      persist();
    },

    appendUser: (text) => {
      set((s) => ({
        messages: [...s.messages, { role: 'user', text, at: new Date().toISOString() }],
        quickReplies: [],
        diagnosis: null,
      }));
      persist();
    },

    setDiagnosis: (d) => {
      set({ diagnosis: d });
      persist();
    },

    reset: () => {
      set({ ...EMPTY });
      storage.remove(KEY);
    },
  };
});
