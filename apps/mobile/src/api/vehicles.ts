import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Vehicle {
  id: string;
  userId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  engine: string | null;
  power: string | null;
  vin: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  plate: string;
  brand: string;
  model: string;
  year: number;
  engine?: string;
  power?: string;
  vin?: string;
  color?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface NappVehicleData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  power: string;
  vin: string;
  color: string;
}

const KEYS = {
  list: ['vehicles'] as const,
  one: (id: string) => ['vehicles', id] as const,
  napp: (plate: string) => ['napp', 'vehicle', plate] as const,
};

export const vehiclesQueryKey = KEYS.list;

export async function listVehicles() {
  const { data } = await api.get<Vehicle[]>('/me/vehicles');
  return data;
}
export async function getVehicle(id: string) {
  const { data } = await api.get<Vehicle>(`/me/vehicles/${id}`);
  return data;
}
export async function createVehicle(input: CreateVehicleInput) {
  const { data } = await api.post<Vehicle>('/me/vehicles', input);
  return data;
}
export async function updateVehicle(id: string, input: UpdateVehicleInput) {
  const { data } = await api.patch<Vehicle>(`/me/vehicles/${id}`, input);
  return data;
}
export async function deleteVehicle(id: string) {
  await api.delete(`/me/vehicles/${id}`);
}
export async function lookupVehicleByPlate(plate: string) {
  const { data } = await api.get<NappVehicleData>(`/napp/vehicle/${encodeURIComponent(plate)}`);
  return data;
}

export function useVehicles() {
  return useQuery({ queryKey: KEYS.list, queryFn: listVehicles });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.one(id) : KEYS.list,
    queryFn: () => getVehicle(id!),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) => updateVehicle(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.one(vars.id) });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useNappLookup() {
  return useMutation({ mutationFn: lookupVehicleByPlate });
}
