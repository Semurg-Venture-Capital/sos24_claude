import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { saveTokens } from '../lib/secure';
import { useAuthStore } from '../stores/authStore';

// На Android-эмуляторе localhost хоста — это 10.0.2.2. На iOS-симуляторе и web — localhost.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = `http://${HOST}:3030`;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Однократный refresh при 401 — без рекурсии, без storm-ов.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (!original || error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }

    original._retried = true;
    const newAccess = await (refreshing ??= refreshTokens());
    refreshing = null;

    if (!newAccess) {
      await useAuthStore.getState().signOut();
      return Promise.reject(error);
    }
    original.headers.set('Authorization', `Bearer ${newAccess}`);
    return api.request(original);
  },
);

async function refreshTokens(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const response = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    await saveTokens(response.data.accessToken, response.data.refreshToken);
    useAuthStore.setState({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    return response.data.accessToken;
  } catch {
    return null;
  }
}
