import { Platform } from 'react-native';

// Импорт данных из системного приложения «Здоровье» (Apple HealthKit) для
// автозаполнения мед.карты (M14.10). Доступно только на iOS.
//
// Что реально отдаёт HealthKit сторонним приложениям:
//   • группа крови (характеристика) — единственный источник в приложении;
//   • рост и вес (последний замер).
// Medical ID (аллергии, лекарства, хронические, донор) HealthKit НЕ отдаёт —
// эти поля пользователь заполняет вручную.

export interface HealthImportResult {
  bloodType?: string; // «B(III) Rh+»
  heightCm?: number;
  weightKg?: number;
}

// BloodType enum HealthKit → наш формат группы крови.
const BLOOD_MAP: Record<number, string> = {
  1: 'A(II) Rh+',
  2: 'A(II) Rh−',
  3: 'B(III) Rh+',
  4: 'B(III) Rh−',
  5: 'AB(IV) Rh+',
  6: 'AB(IV) Rh−',
  7: 'O(I) Rh+',
  8: 'O(I) Rh−',
};

export function isHealthImportSupported(): boolean {
  return Platform.OS === 'ios';
}

// Запрашивает доступ и читает доступные поля. Возвращает null, если платформа
// не поддерживается или данные о здоровье недоступны на устройстве.
// Важно: HealthKit не сообщает об отказе в чтении — просто вернёт пустые поля.
export async function importFromHealth(): Promise<HealthImportResult | null> {
  if (Platform.OS !== 'ios') return null;

  const HK = await import('@kingstinct/react-native-healthkit');

  if (!HK.isHealthDataAvailable()) return null;

  await HK.requestAuthorization({
    toRead: [
      'HKCharacteristicTypeIdentifierBloodType',
      'HKQuantityTypeIdentifierHeight',
      'HKQuantityTypeIdentifierBodyMass',
    ],
  });

  const result: HealthImportResult = {};

  try {
    const bt = (await HK.getBloodTypeAsync()) as number;
    if (BLOOD_MAP[bt]) result.bloodType = BLOOD_MAP[bt];
  } catch {
    /* группа крови не задана */
  }

  try {
    const h = await HK.getMostRecentQuantitySample('HKQuantityTypeIdentifierHeight', 'cm');
    if (h?.quantity) result.heightCm = Math.round(h.quantity);
  } catch {
    /* рост не задан */
  }

  try {
    const w = await HK.getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg');
    if (w?.quantity) result.weightKg = Math.round(w.quantity);
  } catch {
    /* вес не задан */
  }

  return result;
}
