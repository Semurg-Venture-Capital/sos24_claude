import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      qc.invalidateQueries({ queryKey: ['cards'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export interface GatewayInitResult {
  paymentId: string;
  redirectUrl: string;
}

export async function initPayme(policyId: string): Promise<GatewayInitResult> {
  const { data } = await api.post<GatewayInitResult>('/payments/payme/init', { policyId });
  return data;
}

export async function initClick(policyId: string): Promise<GatewayInitResult> {
  const { data } = await api.post<GatewayInitResult>('/payments/click/init', { policyId });
  return data;
}

export function useInitPayme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: initPayme,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export function useInitClick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: initClick,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export async function getPaymentHistory() {
  const { data } = await api.get<PaymentResult[]>('/payments/history');
  return data;
}

export function usePaymentHistory() {
  return useQuery({ queryKey: ['payments'], queryFn: getPaymentHistory });
}
