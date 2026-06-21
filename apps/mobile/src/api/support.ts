import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { apiBaseUrl, api } from './client';
import { useAuthStore } from '../stores/authStore';

export type TicketStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type SenderRole = 'USER' | 'SUPPORT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'SYSTEM';
export type SupportCategory = 'POLICY' | 'PAYMENT' | 'ACCIDENT' | 'ACCOUNT' | 'OTHER';

export interface SupportAttachment {
  key: string;
  name?: string | null;
  mime?: string | null;
  size?: number | null;
  duration?: number | null;
  url?: string | null;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string | null;
  senderRole: SenderRole;
  type: MessageType;
  body: string | null;
  attachment: SupportAttachment | null;
  readAt: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: SupportCategory;
  categoryLabel: string;
  status: TicketStatus;
  agentId: string | null;
  agentName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadForUser: number;
  unreadForAgent: number;
  createdAt: string;
  closedAt: string | null;
}

export interface MessagesPage {
  messages: SupportMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const CATEGORY_LABEL: Record<SupportCategory, string> = {
  POLICY: 'Полисы',
  PAYMENT: 'Оплата',
  ACCIDENT: 'ДТП',
  ACCOUNT: 'Аккаунт',
  OTHER: 'Другое',
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Открыто',
  PENDING: 'В ожидании',
  CLOSED: 'Закрыто',
};

// ── REST ──
export async function fetchTickets(): Promise<{ tickets: SupportTicket[]; nextCursor: string | null }> {
  const { data } = await api.get('/me/support/tickets');
  return data;
}

export async function createTicket(input: {
  subject: string;
  category: SupportCategory;
  body?: string;
  attachment?: SupportAttachment;
}): Promise<SupportTicket> {
  const { data } = await api.post('/me/support/tickets', input);
  return data;
}

export async function fetchMessages(ticketId: string, cursor?: string): Promise<MessagesPage> {
  const { data } = await api.get(`/me/support/tickets/${ticketId}/messages`, { params: { cursor } });
  return data;
}

export async function sendMessage(
  ticketId: string,
  input: { body?: string; attachment?: SupportAttachment },
): Promise<SupportMessage> {
  const { data } = await api.post(`/me/support/tickets/${ticketId}/messages`, input);
  return data;
}

export async function markTicketRead(ticketId: string): Promise<void> {
  await api.post(`/me/support/tickets/${ticketId}/read`, {});
}

export async function fetchSupportUnread(): Promise<{ count: number }> {
  const { data } = await api.get('/me/support/unread-count');
  return data;
}

// ── React Query ──
export function useMyTickets() {
  return useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: fetchTickets,
    refetchInterval: 30_000,
  });
}

export function useSupportUnread() {
  return useQuery({
    queryKey: ['support', 'unread'],
    queryFn: fetchSupportUnread,
    refetchInterval: 60_000,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

// ── Socket.IO ──
export function connectSupportSocket(): Socket {
  const token = useAuthStore.getState().accessToken;
  return io(`${apiBaseUrl()}/support`, {
    transports: ['websocket'],
    auth: { token },
  });
}
