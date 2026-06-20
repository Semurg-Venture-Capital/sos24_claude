import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type NotificationType =
  | 'POLICY_ACTIVATED'
  | 'POLICY_EXPIRING'
  | 'CLAIM_STATUS'
  | 'EUROPROTOCOL_STATUS'
  | 'SUPPORT_REPLY'
  | 'PROMO'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
}

const KEYS = {
  list: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
};

export async function listNotifications() {
  const { data } = await api.get<AppNotification[]>('/me/notifications');
  return data;
}
export async function getUnreadCount() {
  const { data } = await api.get<{ count: number }>('/me/notifications/unread-count');
  return data.count;
}
// Plain-функция отметки прочитанным (для обработчика push-тапа вне React-дерева).
export async function markNotificationRead(id: string) {
  await api.patch(`/me/notifications/${id}/read`);
}
export async function registerDevice(token: string, platform: 'IOS' | 'ANDROID') {
  await api.post('/me/devices', { token, platform });
}
export async function unregisterDevice(token: string) {
  await api.delete(`/me/devices/${encodeURIComponent(token)}`);
}

export function useNotifications() {
  return useQuery({ queryKey: KEYS.list, queryFn: listNotifications });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unread,
    queryFn: getUnreadCount,
    refetchInterval: 60_000, // лёгкий поллинг для бейджа
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/me/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/me/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

export function useRemoveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}
