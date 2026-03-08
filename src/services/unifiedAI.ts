import { supabase } from '@/integrations/supabase/client';

export type UnifiedAIMode = 'concierge' | 'chatbot' | 'glossario' | 'dashboard';

interface UnifiedAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UnifiedAIRequest {
  mode: UnifiedAIMode;
  message?: string;
  messages?: UnifiedAIMessage[];
  context?: Record<string, unknown>;
  user?: Record<string, unknown>;
  scope?: Record<string, unknown>;
}

interface UnifiedAIResponse {
  content?: string;
  error?: string;
}

export async function requestUnifiedAI(payload: UnifiedAIRequest): Promise<string> {
  const { data, error } = await supabase.functions.invoke('unified-ai', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || 'Falha ao consultar a IA.');
  }

  const response = data as UnifiedAIResponse | null;
  if (!response) {
    throw new Error('Resposta vazia da IA.');
  }

  if (response.error) {
    throw new Error(response.error);
  }

  const content = response.content?.trim();
  if (!content) {
    throw new Error('A IA não retornou conteúdo.');
  }

  return content;
}
