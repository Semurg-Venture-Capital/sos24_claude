import { Platform } from 'react-native';
import { create } from 'zustand';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../lib/secure';
import { storage, storageKeys } from '../lib/storage';
import { unregisterPushToken } from '../lib/push';

export type AuthStatus = 'loading' | 'unauthenticated' | 'needs_verification' | 'authenticated';

// Определяет статус по результату MyID-верификации.
// ⚠️ Вариант A (временно): нативный MyID SDK есть только под iOS. Чтобы тестировать
// приложение на Android, на этой платформе пропускаем MyID-гейт и пускаем в приложение
// без верификации. TODO(android): убрать байпас после внедрения MyID Android SDK
// (см. docs/ANDROID.md, Вариант B).
function resolveAuthStatus(verificationStatus: string): AuthStatus {
  if (verificationStatus === 'MYID_VERIFIED') return 'authenticated';
  if (Platform.OS === 'android') return 'authenticated';
  return 'needs_verification';
}

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
      const status = resolveAuthStatus(verificationStatus);
      set({ status, accessToken: access, refreshToken: refresh, userId });
    } else {
      set({ status: 'unauthenticated' });
    }
  },

  setSession: async (tokens, userId, verificationStatus) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    storage.set(storageKeys.userId, userId);
    storage.set(storageKeys.verificationStatus, verificationStatus);
    const status = resolveAuthStatus(verificationStatus);
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
    // Снять push-токен текущего аккаунта (до сброса JWT — запрос требует авторизации).
    await unregisterPushToken().catch(() => undefined);
    await clearTokens();
    storage.remove(storageKeys.userId);
    storage.remove(storageKeys.verificationStatus);
    set({ status: 'unauthenticated', userId: null, accessToken: null, refreshToken: null });
  },
}));
