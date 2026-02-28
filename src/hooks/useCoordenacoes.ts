import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { LeadershipCouple } from './useLeadershipCouples';
import { useDemoScope } from '@/hooks/useDemoScope';

export type Coordenacao = Tables<'coordenacoes'> & {
  leader?: { id: string; name: string; avatar_url: string | null } | null;
  leadership_couple?: LeadershipCouple | null;
  rede?: { id: string; name: string } | null;
  _count?: { celulas: number };
};

export function useCoordenacoes() {
  const { campoId, isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['coordenacoes', ...queryKeyExtra],
    queryFn: async () => {
      let query = supabase
        .from('coordenacoes')
        .select(`
          *,
          leader:profiles!coordenacoes_leader_id_fkey(id, name, avatar_url),
          leadership_couple:leadership_couples(
            id, spouse1_id, spouse2_id, created_at, updated_at,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url, email),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url, email)
          ),
          rede:redes!coordenacoes_rede_id_fkey(id, name)
        `)
        .order('ordem');

      if (isDemoActive && seedRunId) {
        query = query.eq('is_test_data', true).eq('seed_run_id', seedRunId);
      }

      if (campoId) {
        query = query.eq('campo_id', campoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Get celula counts
      let celulaQuery = supabase.from('celulas').select('coordenacao_id');
      if (isDemoActive && seedRunId) {
        celulaQuery = celulaQuery.eq('is_test_data', true).eq('seed_run_id', seedRunId);
      }
      if (campoId) celulaQuery = celulaQuery.eq('campo_id', campoId);
      const { data: celulaCounts } = await celulaQuery;
      
      const countMap = celulaCounts?.reduce((acc, c) => {
        acc[c.coordenacao_id] = (acc[c.coordenacao_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return data.map(c => ({
        ...c,
        _count: { celulas: countMap[c.id] || 0 }
      })) as Coordenacao[];
    },
  });
}

export function useCreateCoordenacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (coordenacao: TablesInsert<'coordenacoes'>) => {
      const { data, error } = await supabase
        .from('coordenacoes')
        .insert(coordenacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      toast({ title: 'Coordenação criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar coordenação', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCoordenacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...coordenacao }: TablesUpdate<'coordenacoes'> & { id: string }) => {
      const { data, error } = await supabase
        .from('coordenacoes')
        .update(coordenacao)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      toast({ title: 'Coordenação atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar coordenação', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCoordenacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coordenacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      toast({ title: 'Coordenação excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir coordenação', description: error.message, variant: 'destructive' });
    },
  });
}
