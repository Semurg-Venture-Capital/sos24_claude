import { create } from 'zustand';
import type { ProductType } from './productData';
import type { PricingMode } from '../../api/insurance';

// Состояние калькулятора покупки. Хранит выбор между шагами 1-4.
// Сбрасывается при старте новой покупки (resetForProduct).

export type DriverLimit = 'limited' | 'unlimited';
export type PeriodMonths = 3 | 6 | 12;
export type PaymentPlan = 'oneTime' | 'installment';

export interface MockCar {
  id: string;
  plate: string;
  name: string;
  year: number;
  engine: string;
  power: string;
}

export interface MockDriver {
  id: string;
  name: string;
  doc: string;
  experience: string;
}

export const MOCK_CARS: MockCar[] = [
  { id: 'c1', plate: '01 A 123 BB', name: 'Chevrolet Cobalt', year: 2021, engine: '1.5 л', power: '105 л.с.' },
  { id: 'c2', plate: '10 R 555 AC', name: 'Hyundai Sonata', year: 2019, engine: '2.0 л', power: '150 л.с.' },
];

export const MOCK_DRIVERS: MockDriver[] = [
  { id: 'd1', name: 'Каримов А. С.', doc: 'AB 2345678', experience: '8 лет' },
  { id: 'd2', name: 'Каримова М. Х.', doc: 'AC 1122334', experience: '4 года' },
];

interface PurchaseState {
  productType: ProductType | null;
  // Выбор из каталога: компания / продукт / тарифный план
  companyId: string | null;
  productId: string | null;
  pricingMode: PricingMode | null;
  productBaseRate: number | null; // для COEFFICIENT (авто)
  planId: string | null;
  planPrice: number | null; // для PLANS — цена выбранного тарифа
  // Step 1: vehicle (id из /me/vehicles)
  carId: string | null;
  // Step 2: drivers (ids из /me/drivers)
  driverLimit: DriverLimit;
  driverIds: string[];
  // Step 3: period
  periodMonths: PeriodMonths;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  // Step 4: payment
  paymentPlan: PaymentPlan;
  // Промокод применён в Checkout (для передачи в createPolicy)
  promoCode: string | null;
  // Создан draft-полис после Checkout (для Payment и Success)
  draftPolicyId: string | null;

  // Старт покупки конкретного продукта компании (из каталога).
  startProduct: (args: {
    companyId: string;
    productId: string;
    productType: ProductType;
    pricingMode: PricingMode;
    baseRate: number | null;
  }) => void;
  setPlan: (planId: string, price: number) => void;
  setCar: (id: string) => void;
  setDriverLimit: (limit: DriverLimit) => void;
  toggleDriver: (id: string) => void;
  setDriverIds: (ids: string[]) => void;
  setPeriod: (months: PeriodMonths) => void;
  setPaymentPlan: (plan: PaymentPlan) => void;
  setPromoCode: (code: string | null) => void;
  setDraftPolicyId: (id: string | null) => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftMonths(dateISO: string, months: number): string {
  const d = new Date(dateISO);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  productType: null,
  companyId: null,
  productId: null,
  pricingMode: null,
  productBaseRate: null,
  planId: null,
  planPrice: null,
  carId: null,
  driverLimit: 'limited',
  driverIds: [],
  periodMonths: 12,
  startDate: todayISO(),
  endDate: shiftMonths(todayISO(), 12),
  paymentPlan: 'oneTime',
  promoCode: null,
  draftPolicyId: null,

  startProduct: ({ companyId, productId, productType, pricingMode, baseRate }) => {
    const start = todayISO();
    set({
      productType,
      companyId,
      productId,
      pricingMode,
      productBaseRate: baseRate,
      planId: null,
      planPrice: null,
      carId: null,
      driverLimit: 'limited',
      driverIds: [],
      periodMonths: 12,
      startDate: start,
      endDate: shiftMonths(start, 12),
      paymentPlan: 'oneTime',
      promoCode: null,
      draftPolicyId: null,
    });
  },

  setPlan: (planId, price) => set({ planId, planPrice: price }),

  setCar: (id) => set({ carId: id }),

  setDriverLimit: (limit) => set({ driverLimit: limit }),

  toggleDriver: (id) => {
    const cur = get().driverIds;
    set({
      driverIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  },

  setDriverIds: (ids) => set({ driverIds: ids }),

  setPeriod: (months) =>
    set((s) => ({
      periodMonths: months,
      endDate: shiftMonths(s.startDate, months),
    })),

  setPaymentPlan: (plan) => set({ paymentPlan: plan }),

  setPromoCode: (code) => set({ promoCode: code }),

  setDraftPolicyId: (id) => set({ draftPolicyId: id }),
}));

// Рендер цены для шагов расчёта/checkout. Финальную цену авторитетно считает бэкенд
// при создании полиса; здесь — превью.
//  PLANS  → фикс-цена выбранного тарифа (state.planPrice).
//  COEFFICIENT (авто) → база продукта (state.productBaseRate) × коэффициенты.
export function calculatePrice(state: PurchaseState): {
  base: number;
  total: number;
  coefficients: Array<{ label: string; value: string }>;
} {
  if (!state.productType) return { base: 0, total: 0, coefficients: [] };

  if (state.pricingMode === 'PLANS') {
    const price = state.planPrice ?? 0;
    return {
      base: price,
      total: price,
      coefficients: [{ label: 'Стоимость полиса (тариф)', value: price.toLocaleString('ru-RU') }],
    };
  }

  const isOsago = state.productType === 'osago';
  const base = state.productBaseRate ?? (isOsago ? 320000 : 4200000);

  // Простые мок-коэффициенты по периоду
  const periodMultiplier = state.periodMonths === 12 ? 1 : state.periodMonths === 6 ? 0.55 : 0.32;
  const territoryK = 1.15; // Ташкент
  const experienceK = 0.95; // стаж 8 лет
  const limitK = state.driverLimit === 'limited' ? 0.9 : 1.25;

  const total = Math.round(base * periodMultiplier * territoryK * experienceK * limitK);

  return {
    base,
    total,
    coefficients: [
      { label: 'Базовая ставка', value: base.toLocaleString('ru-RU') },
      { label: 'К. период', value: `× ${periodMultiplier.toFixed(2)}` },
      { label: 'К. территория · Ташкент', value: `× ${territoryK.toFixed(2)}` },
      { label: 'К. стажа · 8 лет', value: `× ${experienceK.toFixed(2)}` },
      {
        label: state.driverLimit === 'limited' ? 'К. ограниченный круг' : 'К. без ограничений',
        value: `× ${limitK.toFixed(2)}`,
      },
    ],
  };
}
