import { create } from 'zustand';
import * as Location from 'expo-location';
import { storage, storageKeys } from '../lib/storage';

// Определённая область пользователя (по GPS). Сохраняется и переиспользуется как дефолт
// фильтра в разделе «Здоровье». Пользователь может сменить вручную (setRegion).

const KEY = storageKeys.geoRegion;

// Нормализация ответа reverse-geocode (англ/узб/рус) в наши канонические области.
function normalizeRegion(raw?: string | null, city?: string | null): string | null {
  const s = `${raw ?? ''} ${city ?? ''}`.toLowerCase();
  const has = (...k: string[]) => k.some((x) => s.includes(x));
  const isRegion = has('region', 'область', 'viloyat', 'вилоят', 'obl');
  if (has('tashkent', 'toshkent', 'ташкент')) return isRegion ? 'Ташкентская' : 'Ташкент';
  if (has('samarq', 'samark', 'самарк')) return 'Самаркандская';
  if (has('andij', 'andizh', 'андиж')) return 'Андижанская';
  if (has('bukhar', 'buxor', 'бухар')) return 'Бухарская';
  if (has('jizzax', 'jizzakh', 'джизак')) return 'Джизакская';
  if (has('qashqadaryo', 'kashkadar', 'кашкадар')) return 'Кашкадарьинская';
  if (has('navoiy', 'navoi', 'навои')) return 'Навоийская';
  if (has('namangan', 'наманган')) return 'Наманганская';
  if (has('surxondaryo', 'surkhandar', 'сурхандар')) return 'Сурхандарьинская';
  if (has('sirdaryo', 'syrdar', 'сырдар')) return 'Сырдарьинская';
  if (has("farg'ona", 'fergana', 'ферган')) return 'Ферганская';
  if (has('xorazm', 'khorezm', 'хорезм')) return 'Хорезмская';
  if (has("qoraqalpog", 'karakalpak', 'каракалпак')) return 'Каракалпакстан';
  return null;
}

interface GeoState {
  region: string | null;
  setRegion: (r: string | null) => void;
  detect: () => Promise<void>;
}

export const useGeoStore = create<GeoState>((set) => ({
  region: storage.getString(KEY) ?? null,

  setRegion: (r) => {
    if (r) storage.set(KEY, r);
    else storage.remove(KEY);
    set({ region: r });
  },

  // Определить область по текущей геопозиции (тихо, без запроса разрешения — используем
  // уже выданное). Вызывается на главной, где координаты и так берутся.
  detect: async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted) return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [g] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const r = normalizeRegion(g?.region, g?.city);
      if (r) {
        storage.set(KEY, r);
        set({ region: r });
      }
    } catch {
      // нет доступа/ошибка — оставляем как есть
    }
  },
}));
