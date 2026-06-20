// Типы и справочники для модуля «Страховые компании»

export const PRODUCT_TYPES = [
  'OSAGO',
  'KASKO',
  'HEALTH',
  'HOME',
  'FINANCE',
  'LIFE',
  'TRAVEL',
  'OTHER',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  OSAGO: 'ОСАГО',
  KASKO: 'КАСКО',
  HEALTH: 'Здоровье',
  HOME: 'Имущество',
  FINANCE: 'Финансы',
  LIFE: 'Жизнь',
  TRAVEL: 'Путешествия',
  OTHER: 'Прочее',
};

export const PRODUCT_TYPE_COLOR: Record<ProductType, string> = {
  OSAGO: '#e61428',
  KASKO: '#568cff',
  HEALTH: '#34d399',
  HOME: '#f5c850',
  FINANCE: '#9a9a9a',
  LIFE: '#a855f7',
  TRAVEL: '#06b6d4',
  OTHER: '#9a9a9a',
};

export const PRICING_MODES = ['COEFFICIENT', 'PLANS'] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const PRICING_MODE_LABEL: Record<PricingMode, string> = {
  COEFFICIENT: 'Коэффициенты (baseRate)',
  PLANS: 'Тарифные планы',
};

// ── Структура content (Json) ──
export interface ContentCover {
  title: string;
  body: string;
}
export interface ContentStep {
  title: string;
  body: string;
}
export interface ContentFaq {
  question: string;
  answer: string;
}
export interface ProductContent {
  covers: ContentCover[];
  exceptions: string[];
  steps: ContentStep[];
  faqs: ContentFaq[];
}

export function emptyContent(): ProductContent {
  return { covers: [], exceptions: [], steps: [], faqs: [] };
}

export function normalizeContent(raw: unknown): ProductContent {
  const c = (raw ?? {}) as Partial<ProductContent>;
  return {
    covers: Array.isArray(c.covers) ? c.covers : [],
    exceptions: Array.isArray(c.exceptions) ? c.exceptions : [],
    steps: Array.isArray(c.steps) ? c.steps : [],
    faqs: Array.isArray(c.faqs) ? c.faqs : [],
  };
}

// ── Сущности ──
export interface InsurancePlan {
  id: string;
  productId: string;
  name: string;
  price: number;
  coverageAmount?: number | null;
  features?: string[] | null;
  active: boolean;
  sortOrder: number;
}

export interface InsuranceProduct {
  id: string;
  companyId: string;
  type: ProductType;
  name: string;
  slug: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  pricingMode: PricingMode;
  baseRate?: number | null;
  content?: unknown;
  active: boolean;
  sortOrder: number;
  plans?: InsurancePlan[];
  company?: InsuranceCompany;
  _count?: { policies: number };
  createdAt?: string;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
  sortOrder: number;
  logoKey?: string | null;
  logoUrl?: string | null;
  productCount?: number;
  createdAt?: string;
}

// ── DTO для мутаций ──
export interface CompanyInput {
  name: string;
  slug: string;
  description?: string;
  active?: boolean;
  sortOrder?: number;
  logoKey?: string;
}

export interface ProductInput {
  companyId: string;
  type: ProductType;
  name: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  pricingMode: PricingMode;
  baseRate?: number | null;
  content?: ProductContent;
  active?: boolean;
  sortOrder?: number;
}

export interface PlanInput {
  name: string;
  price: number;
  coverageAmount?: number | null;
  features?: string[];
  active?: boolean;
  sortOrder?: number;
}

// ── Утилиты ──
export function apiErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  return fallback;
}

export function fmtSum(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('ru-RU') + ' сум';
}

export function minPlanPrice(plans?: InsurancePlan[] | null): number | null {
  if (!plans || plans.length === 0) return null;
  return Math.min(...plans.map((p) => p.price));
}
