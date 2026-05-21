// Контент карточек продуктов — пока статика, потом в CMS / админку.
import type { ProductType } from '../../navigation/types';

export type { ProductType };

export interface ProductInfo {
  type: ProductType;
  eyebrow: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  longTitle: string[];
  price: string;
  // Для продуктов без калькулятора (health/home/finance) — фикс-цена в сум.
  fixedPrice?: number;
}

export const PRODUCTS: Record<ProductType, ProductInfo> = {
  osago: {
    type: 'osago',
    eyebrow: 'Обязательное',
    name: 'ОСАГО',
    shortDescription: 'Страхование гражданской ответственности',
    longTitle: ['Обязательное', 'страхование ОТВ'],
    longDescription: 'Покрывает ваш ущерб другим автомобилям и людям при ДТП.',
    price: 'от 285 000',
  },
  kasko: {
    type: 'kasko',
    eyebrow: 'Полное покрытие',
    name: 'КАСКО',
    shortDescription: 'Комплексное страхование автомобиля',
    longTitle: ['Комплексное', 'страхование КАСКО'],
    longDescription: 'Угон, ущерб от ДТП и третьих лиц, стихийные бедствия — всё в одном полисе.',
    price: 'от 4 200 000',
  },
  health: {
    type: 'health',
    eyebrow: 'Жизнь и здоровье',
    name: 'Здоровье',
    shortDescription: 'Защита при болезни и несчастных случаях',
    longTitle: ['Страхование', 'жизни и здоровья'],
    longDescription: 'Госпитализация, амбулаторное лечение и выплаты при тяжёлых состояниях.',
    price: 'от 1 200 000',
    fixedPrice: 1200000,
  },
  home: {
    type: 'home',
    eyebrow: 'Имущество',
    name: 'Дом и имущество',
    shortDescription: 'Защита квартиры или дома от рисков',
    longTitle: ['Страхование', 'дома и имущества'],
    longDescription: 'От пожара, кражи и стихийных бедствий — для квартиры или частного дома.',
    price: 'от 2 800 000',
    fixedPrice: 2800000,
  },
  finance: {
    type: 'finance',
    eyebrow: 'Финансовая защита',
    name: 'Финансовая защита',
    shortDescription: 'Поддержка при потере дохода',
    longTitle: ['Финансовая', 'защита кредитов'],
    longDescription: 'Покрытие платежей по кредиту при потере работы, болезни или несчастном случае.',
    price: 'от 800 000',
    fixedPrice: 800000,
  },
};
