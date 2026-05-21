import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { CardBrandApi } from './types';

export interface CardApi {
  id: string;
  userId: string;
  brand: CardBrandApi;
  last4: string;
  expiry: string;
  token: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  brand: CardBrandApi;
  last4: string;
  expiry: string;
}

const KEYS = { list: ['cards'] as const };

export async function listCards() {
  const { data } = await api.get<CardApi[]>('/me/cards');
  return data;
}
export async function createCard(input: CreateCardInput) {
  const { data } = await api.post<CardApi>('/me/cards', input);
  return data;
}
export async function deleteCard(id: string) {
  await api.delete(`/me/cards/${id}`);
}

export function useCards() {
  return useQuery({ queryKey: KEYS.list, queryFn: listCards });
}
export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCard,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCard,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
