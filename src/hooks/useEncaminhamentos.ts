import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCampo } from '@/contexts/CampoContext';

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

export function useEncaminhamentos(novaVidaId?: string, campoId?: string | null) {
  return useQuery({
    queryKey: ['encaminhamentos', novaVidaId, campoId],
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
      if (campoId) {
        q = q.eq('campo_id', campoId);
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
  const { activeCampoId } = useCampo();

  return useMutation({
    mutationFn: async (enc: EncaminhamentoInsert) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Resolve campo_id: explicit > context > user_access_links > nova_vida
      let campoId = activeCampoId;

      if (!campoId && user) {
        const { data: links } = await supabase
          .from('user_access_links')
          .select('campo_id')
          .eq('user_id', user.id)
          .eq('active', true)
          .not('campo_id', 'is', null)
          .limit(1);
        campoId = links?.[0]?.campo_id ?? null;
      }

      if (!campoId) {
        // Last resort: inherit from the nova_vida itself
        const { data: vida } = await supabase
          .from('novas_vidas')
          .select('campo_id')
          .eq('id', enc.nova_vida_id)
          .single();
        campoId = vida?.campo_id ?? null;
      }

      if (!campoId) {
        throw new Error('Seu acesso não está vinculado a um campus. Fale com o administrador.');
      }

      const { data, error } = await supabase
        .from('encaminhamentos_recomeco')
        .insert({ ...enc, campo_id: campoId, created_by_user_id: user?.id ?? null } as any)
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
