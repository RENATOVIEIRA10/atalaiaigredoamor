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

const REQUEST_TIMEOUT_MS = 25000;

export async function requestUnifiedAI(payload: UnifiedAIRequest): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente para usar o Pastor Digital.');
  }

  const invokePromise = supabase.functions.invoke('unified-ai', {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('A IA demorou para responder. Tente novamente.')), REQUEST_TIMEOUT_MS);
  });

  const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

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
