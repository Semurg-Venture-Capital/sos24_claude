import { create } from 'zustand';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../lib/secure';
import { storage, storageKeys } from '../lib/storage';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (tokens: { accessToken: string; refreshToken: string }, userId: string) => Promise<void>;
  setAccessToken: (token: string) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  userId: null,
  accessToken: null,
  refreshToken: null,

  hydrate: async () => {
    // Минимальная задержка 1500 мс — на дизайн Splash рассчитан progress-бар
    // и pulse-анимация, чтобы экран не мигнул и сразу не исчез.
    const [tokens, _] = await Promise.all([
      Promise.all([getAccessToken(), getRefreshToken()]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
    const [access, refresh] = tokens;
    const userId = storage.getString(storageKeys.userId) ?? null;
    if (access && refresh && userId) {
      set({ status: 'authenticated', accessToken: access, refreshToken: refresh, userId });
    } else {
      set({ status: 'unauthenticated' });
    }
  },

  setSession: async (tokens, userId) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    storage.set(storageKeys.userId, userId);
    set({
      status: 'authenticated',
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  signOut: async () => {
    await clearTokens();
    storage.remove(storageKeys.userId);
    set({ status: 'unauthenticated', userId: null, accessToken: null, refreshToken: null });
  },
}));
