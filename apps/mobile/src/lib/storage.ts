import AsyncStorage from '@react-native-async-storage/async-storage';

// Синхронный фасад поверх AsyncStorage: на старте гидрируем кэш из диска,
// дальше чтения мгновенные, записи фоновые. Удобно для i18n init и zustand
// store, которым ожидаем sync API. Этот компромисс позволяет работать в
// Expo Go (без нативных модулей вроде MMKV).
const cache: Record<string, string> = {};
let hydrated = false;

export const storageKeys = {
  locale: 'sos24.locale',
  onboardingDone: 'sos24.onboardingDone',
  userId: 'sos24.userId',
  verificationStatus: 'sos24.verificationStatus',
  triageChat: 'sos24.triageChat',
  geoRegion: 'sos24.geoRegion',
} as const;

const KEYS = Object.values(storageKeys);

export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  try {
    const pairs = await AsyncStorage.multiGet(KEYS);
    for (const [k, v] of pairs) {
      if (v !== null) cache[k] = v;
    }
  } catch {
    // ignore — стартуем с пустого кэша
  }
  hydrated = true;
}

export const storage = {
  getString(key: string): string | undefined {
    return cache[key];
  },
  set(key: string, value: string) {
    cache[key] = value;
    void AsyncStorage.setItem(key, value).catch(() => {});
  },
  remove(key: string) {
    delete cache[key];
    void AsyncStorage.removeItem(key).catch(() => {});
  },
};
