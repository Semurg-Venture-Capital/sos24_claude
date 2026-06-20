import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ProductType } from '../navigation/types';

// Тип страхования с бэкенда (enum) → внутренний lowercase-тип мобайла.
export type ApiProductType = 'OSAGO' | 'KASKO' | 'HEALTH' | 'HOME' | 'FINANCE' | 'LIFE' | 'TRAVEL' | 'OTHER';
export type PricingMode = 'COEFFICIENT' | 'PLANS';

export function apiTypeToLocal(t: ApiProductType): ProductType {
  // ProductType мобайла пока покрывает 5 базовых; остальные мапим на 'finance'-подобный «прочий» путь
  // (без авто-калькулятора). Для COEFFICIENT приходят только OSAGO/KASKO.
  switch (t) {
    case 'OSAGO':
      return 'osago';
    case 'KASKO':
      return 'kasko';
    case 'HEALTH':
      return 'health';
    case 'HOME':
      return 'home';
    default:
      return 'finance';
  }
}

export interface InsuranceCompany {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  productCount: number;
}

export interface CompanyProduct {
  id: string;
  type: ApiProductType;
  name: string;
  slug: string;
  shortDescription: string | null;
  pricingMode: PricingMode;
  fromPrice: number | null;
  planCount: number;
}

export interface ProductPlan {
  id: string;
  name: string;
  price: number;
  coverageAmount: number | null;
  features: string[] | null;
}

export interface ProductContent {
  covers?: { title: string; body: string }[];
  exceptions?: string[];
  steps?: { title: string; body: string }[];
  faqs?: { question: string; answer?: string }[];
}

export interface ProductDetail {
  id: string;
  type: ApiProductType;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;
  pricingMode: PricingMode;
  baseRate: number | null;
  content: ProductContent | null;
  fromPrice: number | null;
  company: { id: string; name: string; slug: string; logoUrl: string | null };
  plans: ProductPlan[];
}

const KEYS = {
  companies: ['insurance', 'companies'] as const,
  products: (companyId: string) => ['insurance', 'companies', companyId, 'products'] as const,
  product: (id: string) => ['insurance', 'products', id] as const,
};

export async function listCompanies() {
  const { data } = await api.get<InsuranceCompany[]>('/insurance/companies');
  return data;
}
export async function listCompanyProducts(companyId: string) {
  const { data } = await api.get<CompanyProduct[]>(`/insurance/companies/${companyId}/products`);
  return data;
}
export async function getInsuranceProduct(id: string) {
  const { data } = await api.get<ProductDetail>(`/insurance/products/${id}`);
  return data;
}

export function useCompanies() {
  return useQuery({ queryKey: KEYS.companies, queryFn: listCompanies });
}
export function useCompanyProducts(companyId: string | undefined) {
  return useQuery({
    queryKey: companyId ? KEYS.products(companyId) : KEYS.companies,
    queryFn: () => listCompanyProducts(companyId!),
    enabled: !!companyId,
  });
}
export function useInsuranceProduct(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.product(id) : KEYS.companies,
    queryFn: () => getInsuranceProduct(id!),
    enabled: !!id,
  });
}
