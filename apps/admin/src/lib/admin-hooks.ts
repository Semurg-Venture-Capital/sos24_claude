import { useQuery } from '@tanstack/react-query';
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
