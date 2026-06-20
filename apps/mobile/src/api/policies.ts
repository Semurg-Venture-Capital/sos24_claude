import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Vehicle } from './vehicles';
import type { DriverLimit, PolicyStatus, ProductType } from './types';

export interface PolicyCoefficients {
  periodMultiplier: number;
  territoryK: number;
  experienceK: number;
  limitK: number;
}

export interface Policy {
  id: string;
  userId: string;
  type: ProductType;
  status: PolicyStatus;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  startDate: string;
  endDate: string;
  periodMonths: number;
  driverLimit: DriverLimit;
  basePrice: number;
  discount: number;
  totalPrice: number;
  promoCode: string | null;
  coefficients: PolicyCoefficients | null;
  policyNumber: string | null;
  qrPayload: string | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
}

export interface CalculatePolicyInput {
  type: ProductType;
  productId?: string;
  planId?: string;
  vehicleId?: string;
  periodMonths?: 3 | 6 | 12;
  driverLimit?: DriverLimit;
  promoCode?: string;
}

export interface CalculatePolicyResult {
  basePrice: number;
  discount: number;
  totalPrice: number;
  coefficients: PolicyCoefficients | null;
  breakdown: Array<{ label: string; value: string }>;
  promo?: { code: string; discountPct: number };
}

export interface CreatePolicyInput extends CalculatePolicyInput {
  driverIds?: string[];
  startDate?: string;
}

const KEYS = {
  list: ['policies'] as const,
  listByStatus: (status: PolicyStatus) => ['policies', { status }] as const,
  one: (id: string) => ['policies', id] as const,
};

export const policiesQueryKey = KEYS.list;

export async function listPolicies(status?: PolicyStatus) {
  const { data } = await api.get<Policy[]>('/me/policies', { params: status ? { status } : undefined });
  return data;
}
export async function getPolicy(id: string) {
  const { data } = await api.get<Policy>(`/policies/${id}`);
  return data;
}
export async function calculatePolicy(input: CalculatePolicyInput) {
  const { data } = await api.post<CalculatePolicyResult>('/policies/calculate', input);
  return data;
}
export async function createPolicy(input: CreatePolicyInput) {
  const { data } = await api.post<Policy>('/policies', input);
  return data;
}

export function usePolicies(status?: PolicyStatus) {
  return useQuery({
    queryKey: status ? KEYS.listByStatus(status) : KEYS.list,
    queryFn: () => listPolicies(status),
  });
}

export function usePolicy(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.one(id) : KEYS.list,
    queryFn: () => getPolicy(id!),
    enabled: !!id,
  });
}

export function useCalculatePolicy() {
  return useMutation({ mutationFn: calculatePolicy });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
