// Mock-данные полисов. Подключим к /me/policies на этапе D.
export interface MockPolicy {
  id: string;
  type: 'ОСАГО' | 'КАСКО';
  car: string;
  carYear: number;
  plate: string;
  number: string;
  formattedNumber: string;
  period: string;
  validFrom: string;
  validTo: string;
  daysLeft: number;
  status: 'active' | 'expiring' | 'expired';
  holder: string;
  drivers: Array<{ name: string; experience: string }>;
  insuredAmount: string;
  premium: string;
  termMonths: number;
}

export const MOCK_POLICIES: MockPolicy[] = [
  {
    id: 'p1',
    type: 'КАСКО',
    car: 'Chevrolet Cobalt',
    carYear: 2021,
    plate: '01 A 123 BB',
    number: '1224558200091',
    formattedNumber: '№ 1224 5582 0091',
    period: '11.05.2026 — 11.05.2027',
    validFrom: '2026-05-11',
    validTo: '2027-05-11',
    daysLeft: 365,
    status: 'active',
    holder: 'Каримов А. С.',
    drivers: [
      { name: 'Каримов А. С.', experience: 'стаж 8 лет' },
      { name: 'Каримова М. Х.', experience: 'стаж 4 года' },
    ],
    insuredAmount: '85 000 000 сум',
    premium: '4 250 000 сум',
    termMonths: 12,
  },
  {
    id: 'p2',
    type: 'ОСАГО',
    car: 'Hyundai Sonata',
    carYear: 2022,
    plate: '10 R 555 AC',
    number: '1224447100782',
    formattedNumber: '№ 1224 4471 0782',
    period: '26.06.2025 — 26.06.2026',
    validFrom: '2025-06-26',
    validTo: '2026-06-26',
    daysLeft: 43,
    status: 'expiring',
    holder: 'Каримов А. С.',
    drivers: [{ name: 'Без ограничений', experience: '' }],
    insuredAmount: 'Лимит по закону',
    premium: '480 000 сум',
    termMonths: 12,
  },
];

export const MOCK_EXPIRED: MockPolicy[] = [
  {
    id: 'p3',
    type: 'ОСАГО',
    car: 'Chevrolet Cobalt',
    carYear: 2021,
    plate: '01 A 123 BB',
    number: '1223999100000',
    formattedNumber: '№ 1223 9991 0000',
    period: '11.05.2025 — 11.05.2026',
    validFrom: '2025-05-11',
    validTo: '2026-05-11',
    daysLeft: 0,
    status: 'expired',
    holder: 'Каримов А. С.',
    drivers: [],
    insuredAmount: '—',
    premium: '440 000 сум',
    termMonths: 12,
  },
  {
    id: 'p4',
    type: 'КАСКО',
    car: 'Hyundai Sonata',
    carYear: 2022,
    plate: '10 R 555 AC',
    number: '1223777100000',
    formattedNumber: '№ 1223 7771 0000',
    period: '26.06.2024 — 26.06.2025',
    validFrom: '2024-06-26',
    validTo: '2025-06-26',
    daysLeft: 0,
    status: 'expired',
    holder: 'Каримов А. С.',
    drivers: [],
    insuredAmount: '—',
    premium: '3 900 000 сум',
    termMonths: 12,
  },
];

export function getPolicyById(id: string): MockPolicy | undefined {
  return [...MOCK_POLICIES, ...MOCK_EXPIRED].find((p) => p.id === id);
}
