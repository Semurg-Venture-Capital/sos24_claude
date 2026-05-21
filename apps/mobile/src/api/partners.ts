import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export type PartnerType = 'STO' | 'CLINIC' | 'TOWING';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  address: string;
  phone: string | null;
  rating: number;
  isOpen: boolean;
  city: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
}

const KEYS = {
  list: (type?: PartnerType, city?: string) => ['partners', type ?? '', city ?? ''] as const,
};

export async function listPartners(type?: PartnerType, city?: string) {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (city) params.city = city;
  const { data } = await api.get<Partner[]>('/partners', { params });
  return data;
}

export function usePartners(type?: PartnerType, city?: string) {
  return useQuery({
    queryKey: KEYS.list(type, city),
    queryFn: () => listPartners(type, city),
  });
}
