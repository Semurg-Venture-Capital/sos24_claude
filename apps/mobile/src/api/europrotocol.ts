import { startMyIdSdk } from '@sos24/myid-sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { createMyIdSession } from './myid';

export type EuroStatus = 'SUBMITTED' | 'REVIEW' | 'NEED_INFO' | 'APPROVED' | 'REJECTED' | 'PAID';

// Запись европротокола (ответ бэкенда).
export interface EuroProtocolRecord {
  id: string;
  number: string;
  status: EuroStatus;
  incidentDate: string;
  incidentTime: string;
  place: string;
  selfVerified: boolean;
  schemeType: string | null;
  description: string | null;
  otherGov: string | null;
  otherPhone: string | null;
  otherPolicySeria: string | null;
  otherPolicyNumber: string | null;
  otherPolicyValid: boolean | null;
  otherVehicleRaw: Record<string, unknown> | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: { id: string; plate: string; brand: string; model: string; year: number } | null;
  participant?: EuroParticipant | null;
}

export interface SubmitEuroPayload {
  incidentDate: string;
  incidentTime: string;
  place: string;
  lat?: number;
  lng?: number;
  vehicleId?: string;
  selfVerified?: boolean;
  participantId?: string;
  otherGov?: string;
  otherPhone?: string;
  otherVehicleRaw?: Record<string, unknown>;
  otherPolicySeria?: string;
  otherPolicyNumber?: string;
  otherPolicyValid?: boolean;
  schemeType?: string;
  schemeImageKey?: string;
  description?: string;
  photos?: unknown[];

  // Общая часть
  medCheck?: boolean;
  witnesses?: string;
  officialRegistered?: boolean;

  // Обстоятельства (22 boolean на сторону)
  circumstancesA?: boolean[];
  circumstancesB?: boolean[];

  // Сторона A — доп.
  damageDescA?: string;
  objectionsA?: string;

  // Сторона B — ручной ввод
  otherOwnerAddr?: string;
  otherDlSeria?: string;
  otherDlNumber?: string;
  otherDlCategories?: string;
  otherDlIssue?: string;
  otherInsurer?: string;
  otherPolicyValidUntil?: string;
  damageDescB?: string;
  objectionsB?: string;

  // Оборот
  driverRole?: 'owner' | 'other';
  canMove?: boolean;
  cannotMovePlace?: string;
  remarks?: string;
}

export interface StepUpResult {
  ok: boolean;
  pinfl: string;
}

// EuroParticipant — личность второго участника, подтверждённая через MyID.
export interface EuroParticipant {
  id: string;
  pinfl: string;
  name: string | null;
  surname: string | null;
  patronymic: string | null;
  nameEn: string | null;
  surnameEn: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  gender: string | null;
  nationality: string | null;
  citizenship: string | null;
  address: string | null;
  passportSeria: string | null;
  passportNumber: string | null;
  verifiedAt: string;
}

export interface PolicyValidation {
  valid: boolean;
  message: string;
  result: unknown;
}

// Запускает нативный MyID SDK и возвращает одноразовый code (только iOS-устройство).
export async function runMyIdCode(pinfl?: string): Promise<string> {
  const session = await createMyIdSession(pinfl);
  const result = await startMyIdSdk(session);
  return result.code;
}

// Шаг-ап инициатора: подтверждение присутствия владельца аккаунта.
export async function stepUpMyId(code: string): Promise<StepUpResult> {
  const { data } = await api.post<StepUpResult>('/europrotocol/me/step-up', { code });
  return data;
}

// Верификация второго участника → EuroParticipant (find-or-create по ПИНФЛ).
export async function verifyParticipant(code: string): Promise<EuroParticipant> {
  const { data } = await api.post<EuroParticipant>('/europrotocol/participant/verify', { code });
  return data;
}

// Валидация полиса ОСАГО второго участника через НАПП.
export async function validateOtherPolicy(seria: string, number: string): Promise<PolicyValidation> {
  const { data } = await api.post<PolicyValidation>('/europrotocol/validate-policy', { seria, number });
  return data;
}

export function participantFullName(p: EuroParticipant): string {
  return [p.surname, p.name, p.patronymic].filter(Boolean).join(' ') || p.pinfl;
}

// ── Загрузка медиа в MinIO (через API) ──
export interface UploadedMedia {
  key: string;
  contentType: string;
  size: number;
}

// Заливает локальный файл (фото/видео) на бэкенд → MinIO. Возвращает ключ объекта.
export async function uploadEuroMedia(uri: string, kind: 'image' | 'video'): Promise<UploadedMedia> {
  const ext = (uri.split('.').pop() || '').toLowerCase();
  const type =
    kind === 'video'
      ? ext === 'mp4'
        ? 'video/mp4'
        : 'video/quicktime'
      : ext === 'png'
        ? 'image/png'
        : 'image/jpeg';
  const name = `media.${ext || (kind === 'video' ? 'mov' : 'jpg')}`;
  const form = new FormData();
  // RN FormData принимает { uri, name, type } как файл.
  form.append('file', { uri, name, type } as unknown as Blob);
  const { data } = await api.post<UploadedMedia>('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// Подпись стороны «В» по OTP (на otherPhone).
export async function signOtherParty(id: string, code: string): Promise<{ signedAt: string }> {
  const { data } = await api.post<{ signedAt: string }>(`/europrotocol/${id}/sign-other`, { code });
  return data;
}

// ── Отправка / список / деталь ──
export async function submitEuroProtocol(payload: SubmitEuroPayload) {
  const { data } = await api.post<{ id: string; number: string }>('/europrotocol', payload);
  return data;
}
export async function listMyEuroProtocols() {
  const { data } = await api.get<EuroProtocolRecord[]>('/europrotocol/mine');
  return data;
}
export async function getEuroProtocol(id: string) {
  const { data } = await api.get<EuroProtocolRecord>(`/europrotocol/${id}`);
  return data;
}

export function useMyEuroProtocols() {
  return useQuery({ queryKey: ['europrotocols'], queryFn: listMyEuroProtocols });
}
export function useEuroProtocol(id: string | undefined) {
  return useQuery({
    queryKey: ['europrotocol', id],
    queryFn: () => getEuroProtocol(id!),
    enabled: !!id,
  });
}
export function useSubmitEuroProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitEuroProtocol,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['europrotocols'] }),
  });
}

// Лейблы статусов + тон бейджа (для списка/трекера).
export const EURO_STATUS_LABEL: Record<EuroStatus, string> = {
  SUBMITTED: 'Подано',
  REVIEW: 'На рассмотрении',
  NEED_INFO: 'Требуется информация',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  PAID: 'Выплачено',
};
export const EURO_STATUS_TONE: Record<EuroStatus, 'ink' | 'blue' | 'yellow' | 'green' | 'red'> = {
  SUBMITTED: 'ink',
  REVIEW: 'blue',
  NEED_INFO: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  PAID: 'green',
};
