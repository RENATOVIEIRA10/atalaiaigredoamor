import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDemoScope } from '@/hooks/useDemoScope';

export interface Multiplicacao {
  id: string;
  celula_origem_id: string;
  celula_destino_id: string;
  data_multiplicacao: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  celula_origem?: {
    id: string;
    name: string;
  };
  celula_destino?: {
    id: string;
    name: string;
  };
}

/**
 * useMultiplicacoes — Campus-isolated query.
 * Uses useDemoScope internally. Optional override campoId.
 */
export function useMultiplicacoes(overrideCampoId?: string | null) {
  const { campoId: scopeCampoId, isMissingCampo, queryKeyExtra } = useDemoScope();
  const effectiveCampoId = overrideCampoId !== undefined ? overrideCampoId : scopeCampoId;

  return useQuery({
    queryKey: ['multiplicacoes', effectiveCampoId ?? 'global', ...queryKeyExtra],
    enabled: !isMissingCampo,
    queryFn: async () => {
      let query = supabase
        .from('multiplicacoes')
        .select(`
          *,
          celula_origem:celulas!multiplicacoes_celula_origem_id_fkey(id, name),
          celula_destino:celulas!multiplicacoes_celula_destino_id_fkey(id, name)
        `)
        .order('data_multiplicacao', { ascending: false });
      
      if (effectiveCampoId) query = query.eq('campo_id', effectiveCampoId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Multiplicacao[];
    },
  });
}

export function useCreateMultiplicacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      celula_origem_id: string;
      celula_destino_id: string;
      data_multiplicacao: string;
      notes?: string;
      campo_id: string;
    }) => {
      const { error } = await supabase
        .from('multiplicacoes')
        .insert({
          celula_origem_id: data.celula_origem_id,
          celula_destino_id: data.celula_destino_id,
          data_multiplicacao: data.data_multiplicacao,
          notes: data.notes,
          campo_id: data.campo_id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiplicacoes'] });
      toast({
        title: 'Multiplicação registrada!',
        description: 'A origem da célula foi salva com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar multiplicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMultiplicacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('multiplicacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiplicacoes'] });
      toast({
        title: 'Multiplicação removida',
        description: 'O registro foi excluído.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
