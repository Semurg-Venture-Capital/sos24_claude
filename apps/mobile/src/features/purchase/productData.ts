// Контент карточек продуктов — пока статика, потом в CMS / админку.
export type ProductType = 'osago' | 'kasko';

export interface ProductInfo {
  type: ProductType;
  eyebrow: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  longTitle: string[];
  price: string;
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
};
