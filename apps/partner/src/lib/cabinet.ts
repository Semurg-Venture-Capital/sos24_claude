'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ─── Типы ───────────────────────────────────────────────────────────────

export type CabinetKind = 'INSURER' | 'SERVICE';

export interface CabinetMe {
  kind: CabinetKind;
  user: { id: string; name: string | null; phone: string };
  entity: { id: string; name: string; slug?: string; logoUrl: string | null };
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  logoKey: string | null;
  logoUrl: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  coverageAmount: number | null;
  features: string[] | null;
  active: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  type: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;
  pricingMode: 'PLANS' | 'COEFFICIENT';
  baseRate: number | null;
  active: boolean;
  sortOrder: number;
  plans: Plan[];
  _count?: { policies: number };
}

export interface CompanyStats {
  totalPolicies: number;
  premiumSum: number;
  byStatus: { status: string; count: number }[];
  byProduct: { productId: string | null; productName: string; type: string | null; count: number }[];
}

export interface PartnerProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
  reviewCount: number;
  logoKey: string | null;
  coverKey: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  workingHours: Record<string, { open: string; close: string } | null> | null;
  category: { id: string; name: string } | null;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  durationMin: number | null;
  active: boolean;
  sortOrder: number;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  partnerName?: string;
  userName: string | null;
  userPhone: string | null;
  scheduledAt: string;
  status: BookingStatus;
  comment: string | null;
  services: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  authorName: string;
  phone?: string | null;
}

// ─── Общее ──────────────────────────────────────────────────────────────

export function useCabinetMe() {
  return useQuery({
    queryKey: ['cabinet', 'me'],
    queryFn: async () => (await api.get<CabinetMe>('/cabinet/me')).data,
  });
}

// ─── Страховая ──────────────────────────────────────────────────────────

export function useCompany() {
  return useQuery({
    queryKey: ['cabinet', 'company'],
    queryFn: async () => (await api.get<Company>('/cabinet/company')).data,
  });
}

export function useCompanyStats() {
  return useQuery({
    queryKey: ['cabinet', 'company', 'stats'],
    queryFn: async () => (await api.get<CompanyStats>('/cabinet/company/stats')).data,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name?: string; description?: string }) =>
      (await api.patch('/cabinet/company', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet', 'company'] });
      qc.invalidateQueries({ queryKey: ['cabinet', 'me'] });
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['cabinet', 'products'],
    queryFn: async () => (await api.get<Product[]>('/cabinet/products')).data,
  });
}

export function useProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['cabinet', 'products'] });
  return {
    create: useMutation({ mutationFn: async (dto: Record<string, unknown>) => (await api.post('/cabinet/products', dto)).data, onSuccess: invalidate }),
    update: useMutation({ mutationFn: async ({ id, dto }: { id: string; dto: Record<string, unknown> }) => (await api.patch(`/cabinet/products/${id}`, dto)).data, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: async (id: string) => (await api.delete(`/cabinet/products/${id}`)).data, onSuccess: invalidate }),
    createPlan: useMutation({ mutationFn: async (dto: Record<string, unknown>) => (await api.post('/cabinet/plans', dto)).data, onSuccess: invalidate }),
    updatePlan: useMutation({ mutationFn: async ({ id, dto }: { id: string; dto: Record<string, unknown> }) => (await api.patch(`/cabinet/plans/${id}`, dto)).data, onSuccess: invalidate }),
    removePlan: useMutation({ mutationFn: async (id: string) => (await api.delete(`/cabinet/plans/${id}`)).data, onSuccess: invalidate }),
  };
}

// ─── Сервис-партнёр ───────────────────────────────────────────────────────

export function usePartnerProfile() {
  return useQuery({
    queryKey: ['cabinet', 'partner'],
    queryFn: async () => (await api.get<PartnerProfile>('/cabinet/partner')).data,
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Record<string, unknown>) => (await api.patch('/cabinet/partner', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet', 'partner'] });
      qc.invalidateQueries({ queryKey: ['cabinet', 'me'] });
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ['cabinet', 'services'],
    queryFn: async () => (await api.get<{ services: Service[] }>('/cabinet/services')).data.services,
  });
}

export function useServiceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['cabinet', 'services'] });
  return {
    create: useMutation({ mutationFn: async (dto: Record<string, unknown>) => (await api.post('/cabinet/services', dto)).data, onSuccess: invalidate }),
    update: useMutation({ mutationFn: async ({ id, dto }: { id: string; dto: Record<string, unknown> }) => (await api.patch(`/cabinet/services/${id}`, dto)).data, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: async (id: string) => (await api.delete(`/cabinet/services/${id}`)).data, onSuccess: invalidate }),
  };
}

export function useBookings(status?: string) {
  return useQuery({
    queryKey: ['cabinet', 'bookings', status ?? 'all'],
    queryFn: async () =>
      (await api.get<{ bookings: Booking[] }>('/cabinet/bookings', { params: status ? { status } : {} })).data.bookings,
    refetchInterval: 20_000,
  });
}

export function useSetBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) =>
      (await api.patch(`/cabinet/bookings/${id}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cabinet', 'bookings'] }),
  });
}

export function useReviews() {
  return useQuery({
    queryKey: ['cabinet', 'reviews'],
    queryFn: async () => (await api.get<{ reviews: Review[] }>('/cabinet/reviews')).data.reviews,
  });
}
