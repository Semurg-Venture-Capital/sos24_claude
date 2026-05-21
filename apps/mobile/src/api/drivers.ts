import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Driver {
  id: string;
  userId: string;
  name: string;
  licenseSeries: string | null;
  licenseNumber: string | null;
  experienceYears: number;
  birthDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverInput {
  name: string;
  licenseSeries?: string;
  licenseNumber?: string;
  experienceYears?: number;
  birthDate?: string;
}

export type UpdateDriverInput = Partial<CreateDriverInput>;

const KEYS = { list: ['drivers'] as const };

export async function listDrivers() {
  const { data } = await api.get<Driver[]>('/me/drivers');
  return data;
}
export async function createDriver(input: CreateDriverInput) {
  const { data } = await api.post<Driver>('/me/drivers', input);
  return data;
}
export async function updateDriver(id: string, input: UpdateDriverInput) {
  const { data } = await api.patch<Driver>(`/me/drivers/${id}`, input);
  return data;
}
export async function deleteDriver(id: string) {
  await api.delete(`/me/drivers/${id}`);
}

export function useDrivers() {
  return useQuery({ queryKey: KEYS.list, queryFn: listDrivers });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDriverInput }) => updateDriver(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
