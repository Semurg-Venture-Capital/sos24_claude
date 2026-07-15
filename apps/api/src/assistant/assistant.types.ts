// Типы SOS-ассистента (центральный ИИ-роутер). См. docs/SOS_ASSISTANT_SPEC.md.

export type Category = 'accident' | 'medical' | 'theft' | 'property' | 'insurance' | 'other' | 'greeting';
export type Urgency = 'low' | 'medium' | 'high';

// Закрытый набор действий. Навигацию по ним выполняет КЛИЕНТ, не LLM.
export type ActionType =
  | 'europrotocol'
  | 'onsite_help'
  | 'health_triage'
  | 'emergency_call'
  | 'panic_alarm'
  | 'buy_policy'
  | 'support'
  | 'navigate';

export interface Action {
  type: ActionType;
  label: string;
  hint?: string;
  param?: string; // для navigate: policies|garage|catalog|health|documents
}

export interface AssistantMessage {
  role: 'user' | 'ai';
  text: string;
  at: string; // ISO
  actions?: Action[];
  quickReplies?: string[];
}

// Ответ роутера на одно сообщение пользователя.
export interface AssistantTurn {
  reply: string;
  category: Category;
  urgency: Urgency;
  actions: Action[];
  quickReplies: string[];
}
