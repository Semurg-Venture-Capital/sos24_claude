import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

// Бесплатный сервис погоды Open-Meteo (без API-ключа, коммерция разрешена).
// Координаты берём из геолокации устройства; при отказе — Ташкент по умолчанию.

const TASHKENT = { latitude: 41.3111, longitude: 69.2797, city: 'Ташкент' };

export interface Weather {
  tempC: number; // округлённая температура, °C
  code: number; // WMO weather code
  isDay: boolean;
  city: string;
}

// Группа погоды для выбора иконки/подписи.
export type WeatherKind = 'clear' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'thunder';

export function weatherKind(code: number): WeatherKind {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 95) return 'thunder';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  return 'cloud';
}

export function weatherLabel(code: number): string {
  switch (weatherKind(code)) {
    case 'clear':
      return 'Ясно';
    case 'partly':
      return 'Малооблачно';
    case 'cloud':
      return 'Облачно';
    case 'fog':
      return 'Туман';
    case 'rain':
      return 'Дождь';
    case 'snow':
      return 'Снег';
    case 'thunder':
      return 'Гроза';
  }
}

async function resolveLocation(): Promise<{ latitude: number; longitude: number; city: string }> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    let granted = perm.granted;
    if (!granted && perm.canAskAgain) {
      granted = (await Location.requestForegroundPermissionsAsync()).granted;
    }
    if (!granted) return TASHKENT;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;
    let city = TASHKENT.city;
    try {
      const [p] = await Location.reverseGeocodeAsync({ latitude, longitude });
      city = p?.city || p?.subregion || p?.region || TASHKENT.city;
    } catch {
      /* без названия города — оставим дефолт */
    }
    return { latitude, longitude, city };
  } catch {
    return TASHKENT;
  }
}

export async function fetchWeather(): Promise<Weather> {
  const loc = await resolveLocation();
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&current=temperature_2m,weather_code,is_day&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
  };
  const cur = data.current ?? {};
  return {
    tempC: Math.round(cur.temperature_2m ?? 0),
    code: cur.weather_code ?? 0,
    isDay: (cur.is_day ?? 1) === 1,
    city: loc.city,
  };
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 30 * 60 * 1000, // 30 минут
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
