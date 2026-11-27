import { LanguageCode } from '../supabase/types';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResponses?: ToolResponse[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResponse {
  name: string;
  response: Record<string, any>;
}

export interface AgentContext {
  clinic_id: string;
  clinic_name: string;
  session_id: string;
  language: LanguageCode;
  history: ChatMessage[];
}

export interface AgentResponse {
  reply: string;
  language: LanguageCode;
  toolsExecuted: Array<{
    name: string;
    args: Record<string, any>;
    result: Record<string, any>;
  }>;
  actionRequired?: 'PAYMENT_CHECKOUT' | 'EMERGENCY_ALERT' | 'SLOT_HELD' | null;
  paymentPayload?: {
    order_id: string;
    amount: number;
    key_id: string;
    currency: string;
    appointment_id: string;
  };
  slotHeldPayload?: {
    slot_id: string;
    appointment_id: string;
    expires_at: string;
  };
  escalationPayload?: {
    severity: 'ROUTINE' | 'EMERGENCY';
    reason: string;
  };
}
