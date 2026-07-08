// Конфигурация интеграции WHOOP. По умолчанию — mock-режим (без ключей), чтобы весь флоу
// и UI работали до получения реального dev-аккаунта. Реальный режим включается только когда
// заданы WHOOP_MODE=real + client_id + client_secret (иначе безопасно остаёмся на mock).

export const WHOOP_API_BASE = 'https://api.prod.whoop.com';
export const WHOOP_AUTH_URL = `${WHOOP_API_BASE}/oauth/oauth2/auth`;
export const WHOOP_TOKEN_URL = `${WHOOP_API_BASE}/oauth/oauth2/token`;

export const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID ?? '';
export const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET ?? '';

// Редирект после авторизации — на наш API (нужен для обмена кода). Прод по умолчанию.
export const WHOOP_REDIRECT_URI =
  process.env.WHOOP_REDIRECT_URI ?? 'https://api.sos24.uz/health/wearable/whoop/callback';

// offline — обязателен для refresh-token.
export const WHOOP_SCOPES =
  process.env.WHOOP_SCOPES ?? 'offline read:recovery read:sleep read:cycles read:body_measurement read:profile';

// Куда возвращаем пользователя из браузера обратно в приложение после подключения.
export const WHOOP_SUCCESS_DEEPLINK = process.env.WHOOP_SUCCESS_DEEPLINK ?? 'sos24://health/wearable';

// Реальный режим доступен только при полной настройке ключей.
export function whoopConfigured(): boolean {
  return (process.env.WHOOP_MODE ?? 'mock').toLowerCase() === 'real' && !!WHOOP_CLIENT_ID && !!WHOOP_CLIENT_SECRET;
}

export function effectiveWhoopMode(): 'mock' | 'real' {
  return whoopConfigured() ? 'real' : 'mock';
}
