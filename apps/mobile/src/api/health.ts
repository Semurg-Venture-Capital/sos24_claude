import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// API раздела «Здоровье» (M14) · врачи и запись на приём.

export interface DoctorClinic {
  id: string;
  name: string;
  city?: string;
}

export interface DoctorCard {
  id: string;
  fullName: string;
  specialty: string;
  experienceY: number | null;
  rating: number;
  reviewCount: number;
  pricePrimary: number | null;
  videoEnabled: boolean;
  verified: boolean;
  photoUrl: string | null;
  clinic: DoctorClinic | null;
}

export interface DoctorService {
  label: string;
  price: number;
  accent?: boolean;
}

export interface DoctorDetail {
  id: string;
  fullName: string;
  specialty: string;
  experienceY: number | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
  pricePrimary: number | null;
  priceRepeat: number | null;
  priceVideo: number | null;
  videoEnabled: boolean;
  verified: boolean;
  photoUrl: string | null;
  clinic: (DoctorClinic & { address?: string }) | null;
  services: DoctorService[];
}

export interface DoctorSlot {
  time: string;
  iso: string;
  available: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  comment: string | null;
  createdAt: string;
}

export interface DoctorsParams {
  q?: string;
  specialty?: string;
}

export function useDoctors(params: DoctorsParams = {}) {
  return useQuery({
    queryKey: ['health', 'doctors', params],
    queryFn: () =>
      api.get<{ doctors: DoctorCard[]; specialties: string[] }>('/health/doctors', { params }).then((r) => r.data),
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['health', 'doctor', id],
    queryFn: () => api.get<DoctorDetail>(`/health/doctors/${id}`).then((r) => r.data),
  });
}

export async function fetchDoctorSlots(doctorId: string, date: string): Promise<DoctorSlot[]> {
  const { data } = await api.get<{ slots: DoctorSlot[] }>(`/health/doctors/${doctorId}/slots`, { params: { date } });
  return data.slots;
}

export async function createAppointment(payload: {
  doctorId: string;
  scheduledAt: string;
  comment?: string;
}): Promise<Appointment> {
  const { data } = await api.post<Appointment>('/health/appointments', payload);
  return data;
}

export function useMyAppointments() {
  return useQuery({
    queryKey: ['health', 'appointments'],
    queryFn: () => api.get<{ appointments: Appointment[] }>('/health/appointments').then((r) => r.data.appointments),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/health/appointments/${id}/cancel`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health', 'appointments'] }),
  });
}
