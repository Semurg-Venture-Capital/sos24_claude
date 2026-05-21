import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { PaymentMethod, PaymentStatus } from './types';
import type { Policy } from './policies';

export interface PaymentResult {
  id: string;
  userId: string;
  policyId: string;
  amount: number;
  method: PaymentMethod;
  cardId: string | null;
  status: PaymentStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  policy?: Policy;
}

export interface PayPolicyInput {
  policyId: string;
  method: PaymentMethod;
  cardId?: string;
}

export async function payForPolicy(input: PayPolicyInput) {
  const { data } = await api.post<PaymentResult>('/payments/uzcard', input);
  return data;
}

export function usePayPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payForPolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
