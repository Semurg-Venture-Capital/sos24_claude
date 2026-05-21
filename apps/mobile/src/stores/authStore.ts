import { create } from 'zustand';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../lib/secure';
import { storage, storageKeys } from '../lib/storage';

export type AuthStatus = 'loading' | 'unauthenticated' | 'needs_verification' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (
    tokens: { accessToken: string; refreshToken: string },
    userId: string,
    verificationStatus: string,
  ) => Promise<void>;
  setVerified: () => void;
  setAccessToken: (token: string) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  userId: null,
  accessToken: null,
  refreshToken: null,

  hydrate: async () => {
    const [tokens, _] = await Promise.all([
      Promise.all([getAccessToken(), getRefreshToken()]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
    const [access, refresh] = tokens;
    const userId = storage.getString(storageKeys.userId) ?? null;
    const verificationStatus = storage.getString(storageKeys.verificationStatus) ?? 'NOT_VERIFIED';
    if (access && refresh && userId) {
      const status = verificationStatus === 'MYID_VERIFIED' ? 'authenticated' : 'needs_verification';
      set({ status, accessToken: access, refreshToken: refresh, userId });
    } else {
      set({ status: 'unauthenticated' });
    }
  },

  setSession: async (tokens, userId, verificationStatus) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    storage.set(storageKeys.userId, userId);
    storage.set(storageKeys.verificationStatus, verificationStatus);
    const status = verificationStatus === 'MYID_VERIFIED' ? 'authenticated' : 'needs_verification';
    set({
      status,
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  setVerified: () => {
    storage.set(storageKeys.verificationStatus, 'MYID_VERIFIED');
    set({ status: 'authenticated' });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  signOut: async () => {
    await clearTokens();
    storage.remove(storageKeys.userId);
    storage.remove(storageKeys.verificationStatus);
    set({ status: 'unauthenticated', userId: null, accessToken: null, refreshToken: null });
  },
}));
