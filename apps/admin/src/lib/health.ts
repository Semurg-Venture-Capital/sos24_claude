import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// Админка модуля «Здоровье» (M14): врачи и записи.

export interface DoctorAdmin {
  id: string;
  fullName: string;
  specialty: string;
  phone: string | null;
  bookingEnabled: boolean;
  city: string | null;
  experienceY: number | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
  pricePrimary: number | null;
  priceRepeat: number | null;
  priceVideo: number | null;
  videoEnabled: boolean;
  verified: boolean;
  active: boolean;
  partnerId: string | null;
  clinicName: string | null;
  bookingsCount: number;
  createdAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
}

export interface AppointmentAdmin {
  id: string;
  doctorName: string | null;
  specialty: string | null;
  clinicName: string | null;
  patientName: string;
  patientPhone: string | null;
  scheduledAt: string;
  status: string;
  comment: string | null;
  createdAt: string;
}

export interface DoctorInput {
  fullName?: string;
  specialty?: string;
  phone?: string;
  bookingEnabled?: boolean;
  clinicName?: string;
  city?: string;
  partnerId?: string | null;
  experienceY?: number;
  bio?: string;
  pricePrimary?: number;
  priceRepeat?: number;
  priceVideo?: number;
  videoEnabled?: boolean;
  verified?: boolean;
  active?: boolean;
}

export function useDoctors() {
  return useQuery({
    queryKey: ['health', 'doctors'],
    queryFn: () => api.get<{ doctors: DoctorAdmin[] }>('/admin/health/doctors').then((r) => r.data.doctors),
  });
}

export function useClinics() {
  return useQuery({
    queryKey: ['health', 'clinics'],
    queryFn: () => api.get<{ clinics: Clinic[] }>('/admin/health/clinics').then((r) => r.data.clinics),
    staleTime: 5 * 60_000,
  });
}

export function useAppointments(status: string) {
  return useQuery({
    queryKey: ['health', 'appointments', status],
    queryFn: () =>
      api
        .get<{ appointments: AppointmentAdmin[] }>('/admin/health/appointments', { params: status ? { status } : {} })
        .then((r) => r.data.appointments),
  });
}

export interface SosContact {
  name: string;
  phone: string;
  status: string;
}

export interface SosAlertAdmin {
  id: string;
  patientName: string;
  patientPhone: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  status: string;
  notified: number;
  acknowledgedAt: string | null;
  dispatcherName: string | null;
  note: string | null;
  contacts: SosContact[];
  createdAt: string;
  cancelledAt: string | null;
}

export function useSosAlerts(status: string) {
  return useQuery({
    queryKey: ['health', 'sos', status],
    queryFn: () =>
      api.get<{ alerts: SosAlertAdmin[] }>('/admin/health/sos', { params: status ? { status } : {} }).then((r) => r.data.alerts),
    refetchInterval: 8000, // диспетчер: подтягиваем новые тревоги каждые 8 с
  });
}

export function useInvalidateHealth() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['health'] });
}

export const healthApi = {
  createDoctor: (data: DoctorInput) => api.post('/admin/health/doctors', data).then((r) => r.data),
  updateDoctor: (id: string, data: DoctorInput) => api.patch(`/admin/health/doctors/${id}`, data).then((r) => r.data),
  deleteDoctor: (id: string) => api.delete(`/admin/health/doctors/${id}`).then((r) => r.data),
  setAppointmentStatus: (id: string, status: string) =>
    api.patch(`/admin/health/appointments/${id}/status`, { status }).then((r) => r.data),
  updateSos: (id: string, action: 'acknowledge' | 'resolve', note?: string) =>
    api.patch(`/admin/health/sos/${id}`, { action, note }).then((r) => r.data),
};
