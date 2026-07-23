import { useQuery } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { api } from './api';

export type CallDirection = 'INBOUND_EXTERNAL' | 'INBOUND_APP' | 'OUTBOUND';
export type CallStatus = 'RINGING' | 'ANSWERED' | 'MISSED' | 'COMPLETED' | 'FAILED';

export interface CallPerson {
  id: string;
  name: string | null;
  surname?: string | null;
  phone?: string | null;
}

export interface Call {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  externalNumber: string | null;
  user: CallPerson | null;
  operator: CallPerson | null;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  waitSec: number | null;
  recordingKey: string | null;
  ticketId: string | null;
  note: string | null;
}

// screen-pop клиента (приходит в событии call:incoming)
export interface ScreenPop {
  id: string;
  name: string | null;
  phone: string;
  verified: boolean;
  policies: number;
}

export interface IncomingCall {
  callId: string;
  direction: CallDirection;
  number?: string;
  user: ScreenPop | null;
  at: string;
}

export interface CallUpdate {
  callId: string;
  status: CallStatus;
  durationSec?: number;
}

export const callcenterApi = {
  health: () =>
    api.get('/admin/call-center/health').then((r) => r.data as { enabled: boolean; connected: boolean }),
  list: (params?: { status?: string; operatorId?: string }) =>
    api.get('/admin/call-center/calls', { params }).then((r) => r.data.calls as Call[]),
  get: (id: string) => api.get(`/admin/call-center/calls/${id}`).then((r) => r.data as Call),
  recording: (id: string) =>
    api.get(`/admin/call-center/calls/${id}/recording`).then((r) => r.data as { url: string }),
  attachTicket: (id: string, body: { ticketId?: string | null; note?: string }) =>
    api.patch(`/admin/call-center/calls/${id}/ticket`, body).then((r) => r.data),
  createTicket: (id: string, body: { category?: string; subject?: string; note?: string }) =>
    api.post(`/admin/call-center/calls/${id}/ticket`, body).then((r) => r.data as { id: string }),
  sipCredentials: () => api.get('/admin/call-center/sip-credentials').then((r) => r.data),
  queueStatus: () =>
    api.get('/admin/call-center/queue').then((r) => r.data as { enabled: boolean; connected: boolean; waiting: number; available: number; loggedIn: number }),
  operators: () =>
    api.get('/admin/call-center/operators').then((r) => r.data as { id: string; name: string; ext: string }[]),
  operatorPause: (paused: boolean) =>
    api.post('/admin/call-center/operator/pause', { paused }).then((r) => r.data),
};

export function useQueueStatus() {
  return useQuery({
    queryKey: ['cc', 'queue'],
    queryFn: callcenterApi.queueStatus,
    refetchInterval: 10_000,
  });
}

export function useCallHealth() {
  return useQuery({
    queryKey: ['cc', 'health'],
    queryFn: callcenterApi.health,
    refetchInterval: 15_000,
  });
}

export function useCalls(status = '') {
  return useQuery({
    queryKey: ['cc', 'calls', status],
    queryFn: () => callcenterApi.list(status ? { status } : undefined),
    refetchInterval: 20_000,
  });
}

// Socket.IO к namespace /calls (события операторов).
export function callsSocket(): Socket {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3030';
  const token = typeof window !== 'undefined' ? localStorage.getItem('sos24_admin_token') : null;
  return io(`${base}/calls`, {
    transports: ['websocket'],
    auth: { token },
  });
}
