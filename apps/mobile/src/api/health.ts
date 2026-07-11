import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// API раздела «Здоровье» (M14) · врачи и запись на приём.

export interface DoctorClinic {
  id: string | null; // null — свободное место работы (врач-контакт без партнёра)
  name: string;
  city?: string | null;
  region?: string | null;
}

export interface DoctorCard {
  id: string;
  fullName: string;
  specialty: string;
  phone: string | null;
  bookingEnabled: boolean; // false → «Позвонить», true → «Записаться»
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
  phone: string | null;
  bookingEnabled: boolean;
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
  region?: string;
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

// ── Области + клиники-справочник ──
export function useRegions() {
  return useQuery({
    queryKey: ['health', 'regions'],
    queryFn: () => api.get<{ regions: string[] }>('/health/regions').then((r) => r.data.regions),
    staleTime: 60 * 60 * 1000,
  });
}

export interface ClinicCard {
  id: string;
  name: string;
  city: string;
  region: string | null;
  address: string;
  phone: string | null;
  category: string | null;
  rating: number;
  reviewCount: number;
  logoUrl: string | null;
  doctorCount: number;
}

export interface ClinicDetail extends ClinicCard {
  description: string | null;
  workingHours: Record<string, { open: string; close: string } | null> | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  coverUrl: string | null;
  doctors: DoctorCard[];
}

export function useClinics(params: { region?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['health', 'clinics', params],
    queryFn: () => api.get<{ clinics: ClinicCard[] }>('/health/clinics', { params }).then((r) => r.data.clinics),
  });
}

export function useClinic(id: string) {
  return useQuery({
    queryKey: ['health', 'clinic', id],
    queryFn: () => api.get<ClinicDetail>(`/health/clinics/${id}`).then((r) => r.data),
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

// ── Мед.карта (M14.9/14.10) ──

export interface MedicalProfileData {
  fullName: string | null;
  birthDate: string | null;
  gender: 'M' | 'F' | null;
  bloodType: string | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string[];
  chronic: string | null;
  medications: string | null;
  organDonor: boolean | null;
  pregnancy: boolean | null;
  dmsPolicy: string | null;
  doctorName: string | null;
  updatedAt: string;
}

export interface MedicalProfileDefaults {
  fullName: string | null;
  birthDate: string | null;
  gender: 'M' | 'F' | null;
}

export interface MedicalProfileResponse {
  exists: boolean;
  consented: boolean;
  profile: MedicalProfileData | null;
  // Автозаполнение из профиля пользователя (MyID) — для незаполненной карты.
  defaults: MedicalProfileDefaults;
}

export interface MedicalProfileInput {
  fullName?: string;
  birthDate?: string;
  gender?: 'M' | 'F';
  bloodType?: string;
  heightCm?: number;
  weightKg?: number;
  allergies?: string[];
  chronic?: string;
  medications?: string;
  organDonor?: boolean;
  pregnancy?: boolean;
  dmsPolicy?: string;
  doctorName?: string;
  consent?: boolean;
}

export function useMedicalProfile() {
  return useQuery({
    queryKey: ['health', 'medical-profile'],
    queryFn: () => api.get<MedicalProfileResponse>('/health/medical-profile').then((r) => r.data),
  });
}

export function useSaveMedicalProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicalProfileInput) =>
      api.put<MedicalProfileResponse>('/health/medical-profile', input).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(['health', 'medical-profile'], data),
  });
}

// ── Экстренные контакты (M14.11) ──

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string | null;
  phone: string;
  sortOrder: number;
  createdAt: string;
}

const CONTACTS_KEY = ['health', 'emergency-contacts'];

export function useEmergencyContacts() {
  return useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: () => api.get<{ contacts: EmergencyContact[]; limit: number }>('/health/emergency-contacts').then((r) => r.data),
  });
}

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; relation?: string; phone: string }) =>
      api.post<EmergencyContact>('/health/emergency-contacts', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/health/emergency-contacts/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}

// ── ЧП / SOS (M14.12) ──

export interface SosContact extends EmergencyContact {
  notifyStatus?: 'SENT' | 'FAILED';
}

export interface SosTriggerResult {
  alert: { id: string; status: string; createdAt: string; lat: number | null; lng: number | null; address: string | null };
  contacts: SosContact[];
}

export async function triggerSos(payload: { lat?: number; lng?: number; address?: string }): Promise<SosTriggerResult> {
  const { data } = await api.post<SosTriggerResult>('/health/sos/trigger', payload);
  return data;
}

export async function cancelSos(alertId: string): Promise<void> {
  await api.post(`/health/sos/${alertId}/cancel`);
}

// ── ИИ-триаж (M14.2/14.3) ──

export interface TriageMessage {
  role: 'assistant' | 'user';
  text: string;
  at: string;
}

export interface TriageTurn {
  sessionId?: string;
  messages: TriageMessage[];
  quickReplies: string[];
  canFinalize: boolean;
  disclaimer: string;
}

export type Urgency = 'low' | 'medium' | 'high';

export interface TriageRecommendation {
  text: string;
  tone: 'default' | 'red';
}

export interface TriageDiagnosis {
  verdict: string;
  description: string;
  urgency: Urgency;
  confidence: number;
  symptoms: string[];
  recommendations: TriageRecommendation[];
  suggestedSpecialty: string | null;
  disclaimer: string;
}

export async function startTriage(): Promise<TriageTurn> {
  const { data } = await api.post<TriageTurn>('/health/triage/start');
  return data;
}

export async function sendTriageMessage(sessionId: string, text: string): Promise<TriageTurn> {
  const { data } = await api.post<TriageTurn>(`/health/triage/${sessionId}/message`, { text });
  return data;
}

export async function finalizeTriage(sessionId: string): Promise<TriageDiagnosis> {
  const { data } = await api.post<TriageDiagnosis>(`/health/triage/${sessionId}/finalize`);
  return data;
}
