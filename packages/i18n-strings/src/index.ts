import en from './locales/en.json';
import ru from './locales/ru.json';
import uzCyrl from './locales/uz-Cyrl.json';
import uzLatn from './locales/uz-Latn.json';

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
  'uz-Cyrl': { translation: uzCyrl },
  'uz-Latn': { translation: uzLatn },
} as const;

export const supportedLocales = ['uz-Latn', 'uz-Cyrl', 'ru', 'en'] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'uz-Latn';
