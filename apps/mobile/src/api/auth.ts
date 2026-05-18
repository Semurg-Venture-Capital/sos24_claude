import { api } from './client';

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface MeResponse {
  id: string;
  phone: string;
  name: string | null;
  surname: string | null;
  patronymic: string | null;
  birthDate: string | null;
  locale: 'uz_Latn' | 'uz_Cyrl' | 'ru' | 'en';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  surname?: string;
  patronymic?: string;
  birthDate?: string;
  locale?: MeResponse['locale'];
}

export async function requestOtp(phone: string) {
  const { data } = await api.post<{ sent: true; devCode: string }>('/auth/request-otp', { phone });
  return data;
}

export async function verifyOtp(phone: string, code: string) {
  const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', { phone, code });
  return data;
}

export async function getMe() {
  const { data } = await api.get<MeResponse>('/me');
  return data;
}

export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await api.patch<MeResponse>('/me/profile', input);
  return data;
}
