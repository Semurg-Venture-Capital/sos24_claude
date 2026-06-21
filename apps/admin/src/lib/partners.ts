import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  active: boolean;
}

export interface PartnerService {
  id: string;
  name: string;
  description: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  durationMin: number | null;
  active: boolean;
  sortOrder: number;
}

export interface PartnerListItem {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  active: boolean;
  category: { id: string; name: string } | null;
  _count: { services: number; bookings: number; reviews: number };
}

export interface PartnerFull {
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
  categoryId: string | null;
  logoKey: string | null;
  coverKey: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  workingHours: Record<string, { open: string; close: string } | null> | null;
  active: boolean;
  services: PartnerService[];
}

export interface AdminBooking {
  id: string;
  partnerName: string;
  userName: string;
  userPhone: string;
  scheduledAt: string;
  status: string;
  comment: string | null;
  services: string[];
  createdAt: string;
}

export const partnersApi = {
  categories: () => api.get<Category[]>('/admin/partners/categories').then((r) => r.data),
  createCategory: (b: Partial<Category>) => api.post('/admin/partners/categories', b).then((r) => r.data),
  updateCategory: (id: string, b: Partial<Category>) => api.patch(`/admin/partners/categories/${id}`, b).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`/admin/partners/categories/${id}`).then((r) => r.data),

  list: (search?: string, categoryId?: string) =>
    api.get<{ partners: PartnerListItem[] }>('/admin/partners', { params: { search: search || undefined, categoryId: categoryId || undefined } }).then((r) => r.data.partners),
  get: (id: string) => api.get<PartnerFull>(`/admin/partners/${id}`).then((r) => r.data),
  create: (b: Record<string, unknown>) => api.post<PartnerFull>('/admin/partners', b).then((r) => r.data),
  update: (id: string, b: Record<string, unknown>) => api.patch(`/admin/partners/${id}`, b).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/partners/${id}`).then((r) => r.data),

  createService: (partnerId: string, b: Partial<PartnerService>) => api.post(`/admin/partners/${partnerId}/services`, b).then((r) => r.data),
  updateService: (serviceId: string, b: Partial<PartnerService>) => api.patch(`/admin/partners/services/${serviceId}`, b).then((r) => r.data),
  deleteService: (serviceId: string) => api.delete(`/admin/partners/services/${serviceId}`).then((r) => r.data),

  bookings: (status?: string) => api.get<{ bookings: AdminBooking[] }>('/admin/partners/bookings', { params: { status: status || undefined } }).then((r) => r.data.bookings),
  setBookingStatus: (id: string, status: string) => api.patch(`/admin/partners/bookings/${id}/status`, { status }).then((r) => r.data),
};

// Загрузка изображения (лого/баннер) → возвращает ключ.
export async function uploadPartnerImage(file: File): Promise<string> {
  const kind = file.type.startsWith('image/') ? 'image' : 'doc';
  const { data } = await api.post('/files/presign-upload', { kind, contentType: file.type });
  const form = new FormData();
  Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => form.append(k, v));
  form.append('file', file);
  const res = await fetch(data.url, { method: 'POST', body: form });
  if (!(res.ok || res.status === 204)) throw new Error('upload failed');
  return data.key as string;
}

export function useCategories() {
  return useQuery({ queryKey: ['partners', 'categories'], queryFn: partnersApi.categories });
}
export function usePartners(search: string, categoryId: string) {
  return useQuery({ queryKey: ['partners', 'list', search, categoryId], queryFn: () => partnersApi.list(search, categoryId) });
}
export function usePartnerBookings(status: string) {
  return useQuery({ queryKey: ['partners', 'bookings', status], queryFn: () => partnersApi.bookings(status), refetchInterval: 30_000 });
}

export function useInvalidatePartners() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['partners'] });
}
