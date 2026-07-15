import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client';

// SOS-ассистент (центральный ИИ-роутер). См. docs/SOS_ASSISTANT_SPEC.md.
// Навигацию по действиям выполняет КЛИЕНТ (закрытый набор), не LLM.

export type AssistantActionType =
  | 'europrotocol'
  | 'onsite_help'
  | 'health_triage'
  | 'emergency_call'
  | 'panic_alarm'
  | 'buy_policy'
  | 'support'
  | 'navigate';

export interface AssistantAction {
  type: AssistantActionType;
  label: string;
  hint?: string;
  param?: string; // navigate: policies|garage|catalog|health|documents
}

export interface AssistantMessage {
  role: 'user' | 'ai';
  text: string;
  at: string;
  actions?: AssistantAction[];
  quickReplies?: string[];
}

export type AssistantCategory =
  | 'accident'
  | 'medical'
  | 'theft'
  | 'property'
  | 'insurance'
  | 'other'
  | 'greeting';
export type AssistantUrgency = 'low' | 'medium' | 'high';

export interface AssistantTurn {
  reply: string;
  category: AssistantCategory;
  urgency: AssistantUrgency;
  actions: AssistantAction[];
  quickReplies: string[];
  sessionId: string;
}

export interface AssistantSessionResponse {
  sessionId: string | null;
  messages: AssistantMessage[];
}

export async function fetchAssistantSession(): Promise<AssistantSessionResponse> {
  const { data } = await api.get<AssistantSessionResponse>('/assistant/session');
  return data;
}

export async function sendAssistantMessage(text: string, sessionId?: string): Promise<AssistantTurn> {
  const { data } = await api.post<AssistantTurn>('/assistant/message', { text, sessionId });
  return data;
}

export async function resetAssistant(): Promise<{ sessionId: string }> {
  const { data } = await api.post<{ sessionId: string }>('/assistant/reset');
  return data;
}

// Восстановление последней сессии при входе (диалог переживает выход).
export function useAssistantSession() {
  return useQuery({ queryKey: ['assistant', 'session'], queryFn: fetchAssistantSession });
}

export function useSendAssistantMessage() {
  return useMutation({
    mutationFn: ({ text, sessionId }: { text: string; sessionId?: string }) =>
      sendAssistantMessage(text, sessionId),
  });
}
