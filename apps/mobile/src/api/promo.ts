import { useMutation } from '@tanstack/react-query';
import { api } from './client';

export interface ValidatedPromo {
  code: string;
  discountPct: number;
}

export async function validatePromo(code: string) {
  const { data } = await api.post<ValidatedPromo>('/promo/validate', { code });
  return data;
}

export function useValidatePromo() {
  return useMutation({ mutationFn: validatePromo });
}
