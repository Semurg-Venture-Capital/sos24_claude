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

  // --- Данные из НАПП (госреестр). Заполняются при создании/синхронизации авто. ---
  techPassportSeria: string | null;
  techPassportNumber: string | null;
  techPassportDate: string | null;
  vehicleTypeId: number | null;
  bodyNumber: string | null;
  engineNumber: string | null;
  fuelType: string | null;
  seats: number | null;
  stands: number | null;
  fullWeight: string | null;
  emptyWeight: string | null;
  division: string | null;
  ownerName: string | null;
  ownerInn: string | null;
  ownerPinfl: string | null;
  nappSyncedAt: string | null;

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
  // Если переданы — backend дозагрузит и сохранит полные данные ТС из НАПП.
  techPassportSeria?: string;
  techPassportNumber?: string;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

// Запрос к NAPP-провайдеру (зеркало ProviderVehicleDto на бэке).
export interface NappVehicleLookupInput {
  techPassportSeria: string;
  techPassportNumber: string;
  govNumber: string;
}

// Данные ТС от НАПП — структура TechPassportInfo (реальный формат /api/provider/osago/vehicle).
export interface TechPassportInfo {
  techPassportIssueDate: string;
  issueYear: number;
  vehicleTypeId: number;
  bodyNumber: string;
  engineNumber: string;
  pVehicleId: string;
  govNumber: string;
  modelName: string;
  vehicleColor: string;
  division: string;
  fullWeight: string;
  emptyWeight: string;
  fuelType: string;
  seats: string;
  stands: string;
  comment: string;
  pinfl: string;
  inn: string;
  owner: string;
  horsePowers: string;
}

// Конверт ответа НАПП.
export interface NappEnvelope<T> {
  error: number;
  error_message: string;
  result: T | null;
}

// Маппинг ответа НАПП (TechPassportInfo) на поля формы Vehicle.
// modelName приходит единой строкой "CHEVROLET COBALT" → делим на марку (1-е слово) и модель.
export function mapTechPassportToForm(info: TechPassportInfo): {
  brand: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  power: string;
} {
  const parts = info.modelName.trim().split(/\s+/);
  const brand = parts[0] ?? '';
  const model = parts.slice(1).join(' ') || parts[0] || '';
  return {
    brand,
    model,
    year: String(info.issueYear),
    color: info.vehicleColor ?? '',
    vin: info.bodyNumber ?? '',
    power: info.horsePowers ? `${info.horsePowers} л.с.` : '',
  };
}

const KEYS = {
  list: ['vehicles'] as const,
  one: (id: string) => ['vehicles', id] as const,
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

// Серия+номер ТП опциональны — если не переданы, бэкенд берёт сохранённые у авто.
export interface SyncNappInput {
  techPassportSeria?: string;
  techPassportNumber?: string;
}
export interface SyncNappResult {
  found: boolean;
  vehicle: Vehicle;
}
export async function syncVehicleNapp(id: string, input: SyncNappInput) {
  const { data } = await api.post<SyncNappResult>(`/me/vehicles/${id}/sync-napp`, input);
  return data;
}
// Запрос данных ТС из НАПП по техпаспорту + госномеру.
// Бросает Error с текстом, если НАПП вернул error !== 0 (не найдено и т.п.).
export async function lookupVehicleByTechPassport(input: NappVehicleLookupInput) {
  const { data } = await api.post<NappEnvelope<TechPassportInfo>>(
    '/napp/provider/osago/vehicle',
    input,
  );
  if (data.error !== 0 || !data.result) {
    throw new Error(data.error_message || 'Транспортное средство не найдено');
  }
  return data.result;
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
  return useMutation({ mutationFn: lookupVehicleByTechPassport });
}

export function useSyncVehicleNapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SyncNappInput }) => syncVehicleNapp(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.one(vars.id) });
    },
  });
}

// --- Справочник типов ТС НАПП (для расшифровки vehicleTypeId) ---
export interface NappRefItem {
  id: number | string;
  name: string;
  nameUz?: string;
  nameUzc?: string;
}
export async function getVehicleTypes() {
  const { data } = await api.get<NappRefItem[]>('/napp/references/vehicle-types-osago');
  return data;
}
// Возвращает функцию-декодер vehicleTypeId → подпись (или null, пока не загружено).
export function useVehicleTypeLabel() {
  const { data } = useQuery({
    queryKey: ['napp-ref', 'vehicle-types-osago'],
    queryFn: getVehicleTypes,
    staleTime: 24 * 60 * 60 * 1000,
  });
  return (id: number | null | undefined): string | null => {
    if (id === null || id === undefined) return null;
    const item = data?.find((x) => String(x.id) === String(id));
    return item?.name ?? null;
  };
}
