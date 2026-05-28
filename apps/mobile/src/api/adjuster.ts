import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type IncidentType = 'ACCIDENT' | 'DAMAGE' | 'THEFT';
export type AdjusterStatus = 'NEW' | 'ACCEPTED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';

export interface AdjusterRequest {
  id: string;
  incidentType: IncidentType;
  address: string;
  lat: number | null;
  lng: number | null;
  comment: string | null;
  policyId: string | null;
  status: AdjusterStatus;
  createdAt: string;
  // Назначенный аджастер (заполняется при ACCEPTED/EN_ROUTE)
  adjusterDisplayName: string | null;
  adjusterDisplayPhone: string | null;
  adjusterNote: string | null;
}

export interface CreateAdjusterDto {
  incidentType: IncidentType;
  address: string;
  lat?: number;
  lng?: number;
  comment?: string;
  policyId?: string;
}

export async function createAdjusterRequest(dto: CreateAdjusterDto): Promise<AdjusterRequest> {
  const { data } = await api.post<AdjusterRequest>('/adjuster', dto);
  return data;
}

export function useMyAdjusterRequests() {
  return useQuery({
    queryKey: ['adjuster', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<AdjusterRequest[]>('/me/adjuster');
      return data;
    },
  });
}

export function useActiveAdjusterRequest() {
  return useQuery({
    queryKey: ['adjuster', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<AdjusterRequest[]>('/me/adjuster');
      return data;
    },
    refetchInterval: 15_000,
    select: (requests) =>
      requests.find((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED') ?? null,
  });
}

export function useAdjusterRequest(id: string) {
  return useQuery({
    queryKey: ['adjuster', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<AdjusterRequest[]>('/me/adjuster');
      return data;
    },
    refetchInterval: 15_000,
    select: (requests) => requests.find((r) => r.id === id) ?? null,
  });
}

export function useCreateAdjusterRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdjusterRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adjuster', 'mine'] }),
  });
}
