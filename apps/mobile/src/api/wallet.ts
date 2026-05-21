import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { WalletTxType } from './types';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxType;
  amount: number;
  description: string | null;
  paymentId: string | null;
  createdAt: string;
}

export interface WalletState {
  id: string;
  balance: number;
  transactions: WalletTransaction[];
}

const KEYS = { wallet: ['wallet'] as const };

export async function getWallet() {
  const { data } = await api.get<WalletState>('/me/wallet');
  return data;
}
export async function topupWallet(amount: number) {
  const { data } = await api.post<{ id: string; balance: number }>('/me/wallet/topup', { amount });
  return data;
}

export function useWallet() {
  return useQuery({ queryKey: KEYS.wallet, queryFn: getWallet });
}

export function useTopupWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: topupWallet,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.wallet }),
  });
}
