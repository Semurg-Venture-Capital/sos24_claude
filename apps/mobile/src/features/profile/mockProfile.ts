import type { DocumentStatus } from '../../components/ui/StatusPill';

// Mock-данные профиля. Заменим на /me + /me/documents в этапе D.

export interface MockUserProfile {
  name: string;
  surname: string;
  patronymic?: string;
  fullName: string;
  phone: string;
  prettyPhone: string;
  birthDate: string; // YYYY-MM-DD
  address?: string;
  locale: 'uz-Latn' | 'uz-Cyrl' | 'ru' | 'en';
  themeMode: 'system' | 'light' | 'dark';
  notificationsEnabled: boolean;
}

export const MOCK_USER: MockUserProfile = {
  name: 'Азиз',
  surname: 'Каримов',
  patronymic: 'Эркинович',
  fullName: 'Азиз Каримов',
  phone: '+998901234567',
  prettyPhone: '+998 (90) 123-45-67',
  birthDate: '1995-05-14',
  address: 'Ташкент, ул. Амира Темура, 15',
  locale: 'ru',
  themeMode: 'system',
  notificationsEnabled: true,
};

export type DocumentKind = 'passport' | 'license';

export interface MockDocument {
  kind: DocumentKind;
  title: string;
  status: DocumentStatus;
  series?: string;
  number?: string;
  issuedAt?: string;
  issuedBy?: string;
  pinfl?: string;
}

export const MOCK_DOCUMENTS: Record<DocumentKind, MockDocument> = {
  passport: {
    kind: 'passport',
    title: 'Паспорт',
    status: 'verified',
    series: 'AA',
    number: '1234567',
    issuedAt: '2018-03-12',
    issuedBy: 'УВД Юнусабадского района',
    pinfl: '12345678901234',
  },
  license: {
    kind: 'license',
    title: 'Водительское удостоверение',
    status: 'pending',
    series: 'AB',
    number: '2345678',
    issuedAt: '2017-08-20',
    issuedBy: 'ГАИ Ташкента',
  },
};

const LOCALE_LABELS: Record<MockUserProfile['locale'], string> = {
  'uz-Latn': "O'zbek (lotin)",
  'uz-Cyrl': 'Ўзбек (кирилл)',
  ru: 'Русский',
  en: 'English',
};

const THEME_LABELS: Record<MockUserProfile['themeMode'], string> = {
  system: 'Системная',
  light: 'Светлая',
  dark: 'Тёмная',
};

export function getLocaleLabel(l: MockUserProfile['locale']): string {
  return LOCALE_LABELS[l];
}

export function getThemeLabel(t: MockUserProfile['themeMode']): string {
  return THEME_LABELS[t];
}
