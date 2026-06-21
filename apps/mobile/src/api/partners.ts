import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface PartnerCategory {
  id: string;
  name: string;
  icon: string | null;
  color?: string | null;
}

export interface PartnerCard {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; icon: string | null } | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  openNow: boolean | null;
  logoUrl: string | null;
  tags: string[];
}

export interface PartnerService {
  id: string;
  name: string;
  description: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  durationMin: number | null;
}

export interface PartnerReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  authorName: string;
}

export interface PartnerDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  rating: number;
  reviewCount: number;
  lat: number | null;
  lng: number | null;
  category: { id: string; name: string; icon: string | null } | null;
  workingHours: Record<string, { open: string; close: string } | null> | null;
  openNow: boolean | null;
  logoUrl: string | null;
  coverUrl: string | null;
  services: PartnerService[];
  reviews: PartnerReview[];
}

export interface Slot {
  time: string;
  iso: string;
  available: boolean;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  partnerId: string;
  partnerName: string;
  scheduledAt: string;
  status: BookingStatus;
  comment: string | null;
  policyId: string | null;
  services: { id: string; name: string; priceFrom: number | null }[];
  hasReview: boolean;
  createdAt: string;
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Выполнена',
};

interface CatalogParams {
  search?: string;
  categoryId?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: 'distance' | 'rating';
}

export function useCategories() {
  return useQuery({
    queryKey: ['partners', 'categories'],
    queryFn: () => api.get<PartnerCategory[]>('/partners/categories').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useCatalog(params: CatalogParams) {
  return useQuery({
    queryKey: ['partners', 'catalog', params],
    queryFn: () => api.get<{ partners: PartnerCard[] }>('/partners', { params }).then((r) => r.data.partners),
  });
}

export function useNearbyPartners(lat?: number, lng?: number, limit = 10) {
  return useQuery({
    queryKey: ['partners', 'nearby', lat, lng, limit],
    queryFn: () =>
      api.get<{ partners: PartnerCard[] }>('/partners/nearby', { params: { lat, lng, limit } }).then((r) => r.data.partners),
    enabled: lat != null && lng != null,
  });
}

export function usePartnerDetail(id: string) {
  return useQuery({
    queryKey: ['partners', 'detail', id],
    queryFn: () => api.get<PartnerDetail>(`/partners/${id}`).then((r) => r.data),
  });
}

export async function fetchSlots(partnerId: string, date: string, serviceId?: string): Promise<Slot[]> {
  const { data } = await api.get<{ slots: Slot[] }>(`/partners/${partnerId}/slots`, { params: { date, serviceId } });
  return data.slots;
}

export async function createBooking(
  partnerId: string,
  payload: { serviceIds?: string[]; scheduledAt: string; policyId?: string; comment?: string },
): Promise<Booking> {
  const { data } = await api.post<Booking>(`/partners/${partnerId}/bookings`, payload);
  return data;
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['partners', 'my-bookings'],
    queryFn: () => api.get<{ bookings: Booking[] }>('/partners/me/bookings').then((r) => r.data.bookings),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/partners/me/bookings/${id}/cancel`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners', 'my-bookings'] }),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerId, bookingId, rating, text }: { partnerId: string; bookingId: string; rating: number; text?: string }) =>
      api.post(`/partners/${partnerId}/reviews`, { bookingId, rating, text }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners', 'my-bookings'] });
      qc.invalidateQueries({ queryKey: ['partners', 'detail'] });
    },
  });
}
