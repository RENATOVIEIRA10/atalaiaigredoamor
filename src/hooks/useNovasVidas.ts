import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NovaVida {
  id: string;
  nome: string;
  whatsapp: string | null;
  bairro: string | null;
  cidade: string | null;
  estado_civil: string | null;
  faixa_etaria: string | null;
  observacao: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NovaVidaInsert {
  nome: string;
  whatsapp?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado_civil?: string | null;
  faixa_etaria?: string | null;
  observacao?: string | null;
}

export function useNovasVidas() {
  return useQuery({
    queryKey: ['novas_vidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novas_vidas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NovaVida[];
    },
  });
}

export function useCreateNovaVida() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (nv: NovaVidaInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('novas_vidas')
        .insert({ ...nv, created_by_user_id: user?.id ?? null } as any)
        .select()
        .single();
      if (error) throw error;

      // Create audit event
      if (user && data) {
        await supabase.from('novas_vidas_events' as any).insert({
          vida_id: data.id,
          event_type: 'cadastro',
          actor_user_id: user.id,
          payload: { nome: nv.nome },
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      toast({ title: 'Nova vida cadastrada com sucesso!' });
    },
    onError: (e) => {
      toast({ title: 'Erro ao cadastrar', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateNovaVida() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<NovaVida> & { id: string }) => {
      const { error } = await supabase
        .from('novas_vidas')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      toast({ title: 'Atualizado com sucesso!' });
    },
    onError: (e) => {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    },
  });
}
