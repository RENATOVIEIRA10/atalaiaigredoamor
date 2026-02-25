import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RecomecoAgent {
  id: string;
  user_id: string;
  nome: string;
  telefone_whatsapp: string;
  cargo: string;
  mensagem_assinatura: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecomecoAgentInsert {
  nome: string;
  telefone_whatsapp: string;
  cargo?: string;
  mensagem_assinatura?: string;
}

export function useRecomecoAgent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recomeco_agent', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from('recomeco_agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as RecomecoAgent | null;
    },
    enabled: !!user,
  });
}

export function useCreateRecomecoAgent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (agent: RecomecoAgentInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await (supabase as any)
        .from('recomeco_agents')
        .insert({ ...agent, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as RecomecoAgent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recomeco_agent'] });
      toast({ title: 'Perfil do agente salvo!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao salvar perfil', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateRecomecoAgent() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RecomecoAgent> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('recomeco_agents')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recomeco_agent'] });
      toast({ title: 'Perfil atualizado!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    },
  });
}

// Message templates
export function useRecomecoTemplates() {
  return useQuery({
    queryKey: ['recomeco_message_templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recomeco_message_templates')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

// Messages tracking
export function useRecomecoMessages(vidaId?: string) {
  return useQuery({
    queryKey: ['recomeco_messages', vidaId],
    queryFn: async () => {
      let q = (supabase as any)
        .from('recomeco_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (vidaId) q = q.eq('vida_id', vidaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateRecomecoMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (msg: {
      vida_id: string;
      template_id?: string;
      message_preview: string;
      status?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await (supabase as any)
        .from('recomeco_messages')
        .insert({
          vida_id: msg.vida_id,
          agent_user_id: user.id,
          template_id: msg.template_id || null,
          message_preview: msg.message_preview?.substring(0, 140),
          status: msg.status || 'opened_whatsapp',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recomeco_messages'] });
    },
  });
}

export function useConfirmRecomecoMessage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await (supabase as any)
        .from('recomeco_messages')
        .update({ status: 'sent_confirmed' })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recomeco_messages'] });
      toast({ title: 'Boas-vindas confirmada! ✅' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });
}
