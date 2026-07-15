import { create } from 'zustand';
import { storage, storageKeys } from '../../lib/storage';
import type { AssistantMessage } from '../../api/assistant';

// Стор чата SOS-ассистента. Переживает выход/возврат и перезапуск приложения
// (persist в storage → AsyncStorage), пока пользователь не нажмёт «Начать сначала».
// По образцу triageStore.

const KEY = storageKeys.assistantChat;

interface Persisted {
  sessionId: string | null;
  messages: AssistantMessage[];
}

const EMPTY: Persisted = { sessionId: null, messages: [] };

function load(): Persisted {
  try {
    const raw = storage.getString(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Persisted) };
  } catch {
    // повреждённое значение — стартуем с пустого
  }
  return { ...EMPTY };
}

interface AssistantState extends Persisted {
  hasChat: () => boolean;
  // Загрузить восстановленную с сервера сессию (перезаписывает локальную).
  hydrate: (s: { sessionId: string | null; messages: AssistantMessage[] }) => void;
  // Локально добавить реплику пользователя (до ответа сервера).
  appendUser: (text: string) => void;
  // Ответ ассистента на последнее сообщение.
  appendAi: (m: AssistantMessage, sessionId: string) => void;
  reset: () => void;
}

export const useAssistantStore = create<AssistantState>((set, get) => {
  const persist = () => {
    const s = get();
    storage.set(KEY, JSON.stringify({ sessionId: s.sessionId, messages: s.messages } satisfies Persisted));
  };

  return {
    ...load(),

    hasChat: () => get().messages.length > 0,

    hydrate: (t) => {
      set({ sessionId: t.sessionId, messages: t.messages });
      persist();
    },

    appendUser: (text) => {
      set((s) => ({
        messages: [...s.messages, { role: 'user', text, at: new Date().toISOString() }],
      }));
      persist();
    },

    appendAi: (m, sessionId) => {
      set((s) => ({ sessionId, messages: [...s.messages, m] }));
      persist();
    },

    reset: () => {
      set({ ...EMPTY });
      storage.remove(KEY);
    },
  };
});
