import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store на web падает (нет native-модуля). На web используем
// AsyncStorage (он → localStorage). На iOS/Android — настоящий Keychain/Keystore.
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

const ACCESS_KEY = 'sos24.accessToken';
const REFRESH_KEY = 'sos24.refreshToken';

async function setItem(key: string, value: string) {
  if (isNative) await SecureStore.setItemAsync(key, value);
  else await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isNative) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string) {
  if (isNative) await SecureStore.deleteItemAsync(key);
  else await AsyncStorage.removeItem(key);
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
