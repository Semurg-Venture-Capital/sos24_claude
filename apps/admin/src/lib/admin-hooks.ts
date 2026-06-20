import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  InsuranceCompany,
  InsuranceProduct,
  CompanyInput,
  ProductInput,
  PlanInput,
} from './insurance';

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

// ── Европротоколы (M9/M10) ──
export function useEuroStats() {
  return useQuery({
    queryKey: ['admin', 'euro', 'stats'],
    queryFn: () =>
      api.get('/admin/europrotocols/stats').then(
        (r) =>
          r.data as {
            submitted: number;
            review: number;
            needInfo: number;
            approved: number;
            paid: number;
            rejected: number;
          },
      ),
  });
}

export function useEuroProtocols(status = '', page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'euro', status, page],
    queryFn: () =>
      api
        .get('/admin/europrotocols', { params: { status: status || undefined, page, limit } })
        .then((r) => r.data),
  });
}

export function useEuroProtocol(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'euro', 'one', id],
    queryFn: () => api.get(`/admin/europrotocols/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateEuroStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      api.patch(`/admin/europrotocols/${id}`, { status, adminNote }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'euro'] }),
  });
}

// ── Страховые компании / продукты / тарифы ──
const INS_KEY = ['admin', 'insurance'] as const;

export function useInsuranceCompanies() {
  return useQuery({
    queryKey: [...INS_KEY, 'companies'],
    queryFn: () => api.get('/admin/insurance/companies').then((r) => r.data as InsuranceCompany[]),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompanyInput) =>
      api.post('/admin/insurance/companies', body).then((r) => r.data as InsuranceCompany),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY, 'companies'] }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CompanyInput> & { id: string }) =>
      api.patch(`/admin/insurance/companies/${id}`, body).then((r) => r.data as InsuranceCompany),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY, 'companies'] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/insurance/companies/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY, 'companies'] }),
  });
}

export function useUploadCompanyLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      return api
        .post(`/admin/insurance/companies/${id}/logo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data as { logoKey: string; logoUrl: string });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY, 'companies'] }),
  });
}

export function useCompanyProducts(companyId: string | null) {
  return useQuery({
    queryKey: [...INS_KEY, 'companies', companyId, 'products'],
    queryFn: () =>
      api
        .get(`/admin/insurance/companies/${companyId}/products`)
        .then((r) => r.data as InsuranceProduct[]),
    enabled: !!companyId,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: [...INS_KEY, 'products', id],
    queryFn: () => api.get(`/admin/insurance/products/${id}`).then((r) => r.data as InsuranceProduct),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductInput) =>
      api.post('/admin/insurance/products', body).then((r) => r.data as InsuranceProduct),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ProductInput> & { id: string }) =>
      api.patch(`/admin/insurance/products/${id}`, body).then((r) => r.data as InsuranceProduct),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/insurance/products/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY] }),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlanInput & { productId: string }) =>
      api.post('/admin/insurance/plans', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<PlanInput> & { id: string }) =>
      api.patch(`/admin/insurance/plans/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/insurance/plans/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...INS_KEY] }),
  });
}
