import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from '@/hooks/useDemoScope';
import { useRole } from '@/contexts/RoleContext';

export interface WhatsappBotStatus {
  configured?: boolean;
  ok?: boolean;
  status?: string;
  connection?: string;
  whatsapp_user?: string | null;
  mudo_ha_min?: number;
  last_message_at?: string;
  last_sent_at?: string | null;
  has_qr?: boolean;
  queue_pending?: number;
  queue_backoff_until?: string | null;
  queue_rate_limit_streak?: number;
  versao?: string;
  error?: string;
}

export interface WhatsappMessage {
  id: string;
  created_at: string;
  updated_at: string;
  phone: string | null;
  remote_jid: string | null;
  direction: 'inbound' | 'outbound' | 'system';
  classification: string;
  confidence: number | null;
  status: string;
  message_text: string | null;
  extracted_payload: Record<string, unknown> | null;
  error_message: string | null;
  campo_id: string | null;
  celula_id: string | null;
  weekly_report_id: string | null;
}

export interface WhatsappEvent {
  id: string;
  created_at: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string | null;
  phone: string | null;
  campo_id: string | null;
  celula_id: string | null;
  message_id: string | null;
  weekly_report_id: string | null;
  payload: Record<string, unknown> | null;
}

export interface WhatsappOpsOverview {
  bot: WhatsappBotStatus;
  metrics: {
    messages_total: number;
    pending_total: number;
    failed_total: number;
    reports_total: number;
    events_total: number;
  };
  messages: WhatsappMessage[];
  events: WhatsappEvent[];
}

export function useWhatsappOps() {
  const { campoId, isMissingCampo, queryKeyExtra } = useDemoScope();
  const { accessKeyId } = useRole();

  return useQuery({
    queryKey: ['whatsapp-ops', campoId ?? 'global', accessKeyId ?? 'no-access-key', isMissingCampo ? 'missing-campo' : 'ok', ...queryKeyExtra],
    enabled: !isMissingCampo && !!accessKeyId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<WhatsappOpsOverview>('whatsapp-ops', {
        body: { action: 'overview', campo_id: campoId, access_key_id: accessKeyId },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useSetWhatsappMessageStatus() {
  const queryClient = useQueryClient();
  const { accessKeyId } = useRole();

  return useMutation({
    mutationFn: async ({ messageId, status, note }: { messageId: string; status: string; note?: string }) => {
      if (!accessKeyId) throw new Error('Sessao sem funcao ativa.');

      const { data, error } = await supabase.functions.invoke('whatsapp-ops', {
        body: { action: 'set_message_status', message_id: messageId, status, note, access_key_id: accessKeyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-ops'] });
    },
  });
}
