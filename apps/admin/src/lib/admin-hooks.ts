import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });
}

export function useUsers(page = 1, limit = 20, search = '', verified = '') {
  return useQuery({
    queryKey: ['admin', 'users', page, search, verified],
    queryFn: () =>
      api
        .get('/admin/users', { params: { page, limit, search: search || undefined, verified: verified || undefined } })
        .then((r) => r.data),
  });
}

export function usePolicies(page = 1, limit = 20, search = '', type = '', status = '') {
  return useQuery({
    queryKey: ['admin', 'policies', page, search, type, status],
    queryFn: () =>
      api
        .get('/admin/policies', {
          params: {
            page,
            limit,
            search: search || undefined,
            type: type || undefined,
            status: status || undefined,
          },
        })
        .then((r) => r.data),
  });
}

export function useAdjusterStats() {
  return useQuery({
    queryKey: ['admin', 'adjuster', 'stats'],
    queryFn: () => api.get('/admin/adjuster/stats').then((r) => r.data as {
      new: number; inProgress: number; completedToday: number; cancelledToday: number;
    }),
    refetchInterval: 30_000,
  });
}

export function useAdjusterRequests(status = '', page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'adjuster', status, page],
    queryFn: () =>
      api
        .get('/admin/adjuster', { params: { status: status || undefined, page, limit } })
        .then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useUpdateAdjusterStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      id: string; status: string;
      adjusterNote?: string;
      assignedAdjusterId?: string;
      adjusterName?: string;
      adjusterPhone?: string;
    }) => {
      const { id, ...body } = dto;
      return api.patch(`/admin/adjuster/${id}`, body).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'adjuster'] }),
  });
}

export function useAdjusterUsers() {
  return useQuery({
    queryKey: ['admin', 'adjuster-users'],
    queryFn: () => api.get('/admin/adjusters').then((r) => r.data as {
      id: string; name: string | null; surname: string | null; phone: string | null;
    }[]),
  });
}

export function useCreateAdjusterUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; surname?: string; phone: string }) =>
      api.post('/admin/adjusters', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'adjuster-users'] }),
  });
}
