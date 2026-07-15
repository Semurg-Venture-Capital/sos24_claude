import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// API носимых устройств (WHOOP и т.п.) — раздел «Здоровье» (M14).

export interface WhoopRecovery {
  score: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  spo2: number | null;
  skinTempC: number | null;
  at: string | null;
}

export interface WhoopSleep {
  performance: number | null;
  totalMinutes: number | null;
  stages: { lightMin: number | null; deepMin: number | null; remMin: number | null; awakeMin: number | null };
  respiratoryRate: number | null;
  at: string | null;
}

export interface WhoopCycle {
  strain: number | null;
  avgHr: number | null;
  maxHr: number | null;
  at: string | null;
}

export interface WhoopMetrics {
  recovery: WhoopRecovery;
  sleep: WhoopSleep;
  cycle: WhoopCycle;
}

export interface WearableStatus {
  connected: boolean;
  provider: string;
  mode: 'mock' | 'real';
  lastSyncAt: string | null;
  metrics: WhoopMetrics | null;
}

// В mock-режиме connect возвращает уже готовый статус; в real — { authorizeUrl } для браузера.
export interface ConnectResult extends Partial<WearableStatus> {
  mode: 'mock' | 'real';
  authorizeUrl?: string;
}

const KEY = ['health', 'wearable'] as const;

export function useWearable() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<WearableStatus>('/health/wearable').then((r) => r.data),
  });
}

export function useConnectWhoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ConnectResult>('/health/wearable/whoop/connect').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSyncWhoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<WearableStatus>('/health/wearable/whoop/sync').then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}

export function useDisconnectWhoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/health/wearable/whoop').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// ── История метрик (графики/тренды) ──
export type WhoopMetric = 'recovery' | 'hrv' | 'rhr' | 'spo2' | 'strain' | 'sleep';
export interface WhoopHistoryPoint { date: string; value: number }
export interface WhoopHistory { metric: WhoopMetric; rangeDays: number; points: WhoopHistoryPoint[] }

export function useWhoopHistory(metric: WhoopMetric, range: 14 | 30 | 90 = 30) {
  return useQuery({
    queryKey: ['health', 'wearable', 'history', metric, range],
    queryFn: () =>
      api
        .get<WhoopHistory>('/health/wearable/whoop/history', { params: { metric, range } })
        .then((r) => r.data),
  });
}

// «обновлено N назад» из ISO-времени.
export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}
