import { ProductType } from '@prisma/client';

// Базовые цены по продуктам. Для health/home/finance — это и есть финальная
// цена (фикс), для osago/kasko — базовая ставка, к ней применяются коэф-ты.
export const BASE_PRICE: Record<ProductType, number> = {
  OSAGO: 320000,
  KASKO: 4200000,
  HEALTH: 1200000,
  HOME: 2800000,
  FINANCE: 800000,
};

export interface PolicyCoefficients {
  periodMultiplier: number;
  territoryK: number;
  experienceK: number;
  limitK: number;
}

export interface PriceCalculation {
  basePrice: number;
  discount: number;
  totalPrice: number;
  coefficients: PolicyCoefficients | null;
  breakdown: Array<{ label: string; value: string }>;
}

export interface CalcInputs {
  type: ProductType;
  periodMonths?: number;
  driverLimit?: 'LIMITED' | 'UNLIMITED';
  discountPct?: number; // 0..100 от промокода
}

export function calculatePrice(input: CalcInputs): PriceCalculation {
  const isVehicleProduct = input.type === 'OSAGO' || input.type === 'KASKO';
  const base = BASE_PRICE[input.type];

  if (!isVehicleProduct) {
    // Фикс-цена без коэф-тов
    const discount = Math.round((base * (input.discountPct ?? 0)) / 100);
    return {
      basePrice: base,
      discount,
      totalPrice: base - discount,
      coefficients: null,
      breakdown: [{ label: 'Стоимость полиса', value: base.toLocaleString('ru-RU') }],
    };
  }

  // OSAGO/KASKO — коэф-ты
  const periodMonths = input.periodMonths ?? 12;
  const periodMultiplier = periodMonths === 12 ? 1 : periodMonths === 6 ? 0.55 : 0.32;
  const territoryK = 1.15; // Ташкент
  const experienceK = 0.95; // средний стаж 8 лет (когда подключим Drivers — считать с водителей)
  const limitK = input.driverLimit === 'UNLIMITED' ? 1.25 : 0.9;

  const beforeDiscount = Math.round(base * periodMultiplier * territoryK * experienceK * limitK);
  const discount = Math.round((beforeDiscount * (input.discountPct ?? 0)) / 100);
  const totalPrice = beforeDiscount - discount;

  return {
    basePrice: beforeDiscount,
    discount,
    totalPrice,
    coefficients: { periodMultiplier, territoryK, experienceK, limitK },
    breakdown: [
      { label: 'Базовая ставка', value: base.toLocaleString('ru-RU') },
      { label: 'К. период', value: `× ${periodMultiplier.toFixed(2)}` },
      { label: 'К. территория · Ташкент', value: `× ${territoryK.toFixed(2)}` },
      { label: 'К. стажа · 8 лет', value: `× ${experienceK.toFixed(2)}` },
      {
        label: input.driverLimit === 'UNLIMITED' ? 'К. без ограничений' : 'К. ограниченный круг',
        value: `× ${limitK.toFixed(2)}`,
      },
    ],
  };
}
