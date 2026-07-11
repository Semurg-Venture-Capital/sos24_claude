import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store на web падает (нет native-модуля). На web используем
// AsyncStorage (он → localStorage). На iOS/Android — настоящий Keychain/Keystore.
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

const ACCESS_KEY = 'sos24.accessToken';
const REFRESH_KEY = 'sos24.refreshToken';

// На native пробуем Keychain (SecureStore). Если он недоступен (например,
// dev-сборка без keychain-entitlement → «No keychain is available»), НЕ роняем
// логин, а падаем на AsyncStorage. Так вход всегда проходит; на корректной
// сборке используется настоящий Keychain.
async function setItem(key: string, value: string) {
  if (!isNative) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (!isNative) return AsyncStorage.getItem(key);
  try {
    const v = await SecureStore.getItemAsync(key);
    if (v != null) return v;
  } catch {
    // Keychain недоступен — читаем из fallback ниже.
  }
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string) {
  if (isNative) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // игнорируем — почистим fallback ниже
    }
  }
  await AsyncStorage.removeItem(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItem(ACCESS_KEY, accessToken);
  await setItem(REFRESH_KEY, refreshToken);
}

export async function getAccessToken() {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return getItem(REFRESH_KEY);
}

export async function clearTokens() {
  await removeItem(ACCESS_KEY);
  await removeItem(REFRESH_KEY);
}
