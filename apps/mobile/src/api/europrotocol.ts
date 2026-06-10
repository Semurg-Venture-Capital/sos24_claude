import { startMyIdSdk } from '@sos24/myid-sdk';
import { api } from './client';
import { createMyIdSession } from './myid';

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
