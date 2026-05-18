import { defaultLocale, resources, type Locale } from '@sos24/i18n-strings';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage, storageKeys } from './storage';

const saved = storage.getString(storageKeys.locale) as Locale | undefined;

void i18next.use(initReactI18next).init({
  resources,
  lng: saved ?? defaultLocale,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export function setLocale(locale: Locale) {
  storage.set(storageKeys.locale, locale);
  return i18next.changeLanguage(locale);
}

export { i18next };
