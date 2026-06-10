import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { saveTokens } from '../lib/secure';
import { useAuthStore } from '../stores/authStore';

// ХАРДКОД LAN-IP Mac (dev). Телефон и Mac в одной локальной сети.
// ⚠️ Поменять при смене сети: `ipconfig getifaddr en0` на Mac.
// Работает и для реального устройства, и для симулятора (Mac достижим по LAN).
const DEV_API_HOST = '192.168.13.88';

export function apiBaseUrl(): string {
  return `http://${DEV_API_HOST}:3030`;
}
export const API_BASE_URL = apiBaseUrl();

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Пересчитываем хост на каждый запрос — устойчиво к кешу модуля/Fast Refresh
  // и к смене активного IP Mac (берётся хост Metro, достижимый с устройства).
  config.baseURL = apiBaseUrl();
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
