import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Encaminhamento {
  id: string;
  nova_vida_id: string;
  celula_id: string;
  rede_id: string | null;
  status: string;
  data_encaminhamento: string;
  encaminhado_por: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // joined
  celula?: { id: string; name: string; bairro: string | null; cidade: string | null; meeting_day: string | null; meeting_time: string | null };
  rede?: { id: string; name: string } | null;
  nova_vida?: { id: string; nome: string; whatsapp: string | null; bairro: string | null; cidade: string | null; status: string };
}

export interface EncaminhamentoInsert {
  nova_vida_id: string;
  celula_id: string;
  rede_id?: string | null;
  encaminhado_por?: string | null;
  notas?: string | null;
}

export function useEncaminhamentos(novaVidaId?: string) {
  return useQuery({
    queryKey: ['encaminhamentos', novaVidaId],
    queryFn: async () => {
      let q = supabase
        .from('encaminhamentos_recomeco')
        .select(`
          *,
          celula:celulas(id, name, bairro, cidade, meeting_day, meeting_time),
          rede:redes(id, name),
          nova_vida:novas_vidas(id, nome, whatsapp, bairro, cidade, status)
        `)
        .order('data_encaminhamento', { ascending: false });

      if (novaVidaId) {
        q = q.eq('nova_vida_id', novaVidaId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Encaminhamento[];
    },
  });
}

export function useCreateEncaminhamento() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (enc: EncaminhamentoInsert) => {
      const { data, error } = await supabase
        .from('encaminhamentos_recomeco')
        .insert(enc)
        .select()
        .single();
      if (error) throw error;

      // Update nova_vida status to 'encaminhada'
      await supabase
        .from('novas_vidas')
        .update({ status: 'encaminhada' })
        .eq('id', enc.nova_vida_id);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encaminhamentos'] });
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      toast({ title: 'Vida encaminhada com sucesso!' });
    },
    onError: (e) => {
      toast({ title: 'Erro ao encaminhar', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEncaminhamento() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Encaminhamento> & { id: string }) => {
      const { error } = await supabase
        .from('encaminhamentos_recomeco')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encaminhamentos'] });
      toast({ title: 'Encaminhamento atualizado!' });
    },
    onError: (e) => {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    },
  });
}
