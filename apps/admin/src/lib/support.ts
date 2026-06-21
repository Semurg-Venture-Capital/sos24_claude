import { io, type Socket } from 'socket.io-client';
import { api } from './api';

export type TicketStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type SenderRole = 'USER' | 'SUPPORT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'SYSTEM';

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
  category: string;
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
  user?: { id: string; name: string; phone: string };
}

export interface TicketsPage {
  tickets: SupportTicket[];
  nextCursor: string | null;
}
export interface MessagesPage {
  messages: SupportMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Открыто',
  PENDING: 'В ожидании',
  CLOSED: 'Закрыто',
};
export const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  PENDING: 'bg-[rgba(245,200,80,0.15)] text-[#b07d00]',
  CLOSED: 'bg-[rgba(20,20,20,0.06)] text-[#666]',
};

// ── REST ──
export const supportApi = {
  stats: () => api.get('/admin/support/stats').then((r) => r.data as { open: number; pending: number; unassigned: number }),
  list: (params: { status?: string; mine?: string; cursor?: string }) =>
    api.get('/admin/support/tickets', { params }).then((r) => r.data as TicketsPage),
  messages: (ticketId: string, cursor?: string) =>
    api.get(`/admin/support/tickets/${ticketId}/messages`, { params: { cursor } }).then((r) => r.data as MessagesPage),
  reply: (ticketId: string, body: { body?: string; attachment?: SupportAttachment }) =>
    api.post(`/admin/support/tickets/${ticketId}/reply`, body).then((r) => r.data as SupportMessage),
  read: (ticketId: string) => api.post(`/admin/support/tickets/${ticketId}/read`, {}).then((r) => r.data),
  update: (ticketId: string, body: { status?: TicketStatus; assignToMe?: string }) =>
    api.patch(`/admin/support/tickets/${ticketId}`, body).then((r) => r.data as SupportTicket),
};

// ── Загрузка вложения (presigned POST → MinIO) ──
export async function uploadAttachment(file: File): Promise<SupportAttachment> {
  const kind = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'doc';
  const { data } = await api.post('/files/presign-upload', { kind, contentType: file.type });
  const form = new FormData();
  Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => form.append(k, v));
  form.append('file', file);
  const res = await fetch(data.url, { method: 'POST', body: form });
  if (!(res.ok || res.status === 204)) throw new Error(`upload failed: ${res.status}`);
  return { key: data.key, mime: file.type, name: file.name, size: file.size };
}

// ── Socket.IO ──
export function connectSupportSocket(): Socket {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3030';
  const token = typeof window !== 'undefined' ? localStorage.getItem('sos24_admin_token') : null;
  return io(`${base}/support`, {
    transports: ['websocket'],
    auth: { token },
  });
}
