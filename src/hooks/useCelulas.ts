import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { LeadershipCouple } from './useLeadershipCouples';
import { useDemoScope } from '@/hooks/useDemoScope';

export type Celula = Tables<'celulas'> & {
  leader?: { id: string; name: string; avatar_url: string | null } | null;
  leadership_couple?: LeadershipCouple | null;
  coordenacao?: { id: string; name: string } | null;
  _count?: { members: number };
};

export function useCelulas() {
  const { campoId, isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['celulas', ...queryKeyExtra],
    queryFn: async () => {
      let query = supabase
        .from('celulas')
        .select(`
          *,
          leader:profiles!celulas_leader_id_fkey(id, name, avatar_url),
          leadership_couple:leadership_couples(
            id, spouse1_id, spouse2_id, created_at, updated_at,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url, email),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url, email)
          ),
          coordenacao:coordenacoes!celulas_coordenacao_id_fkey(id, name)
        `)
        .order('name');

      if (isDemoActive && seedRunId) {
        query = query.eq('is_test_data', true).eq('seed_run_id', seedRunId);
      }

      if (campoId) {
        query = query.eq('campo_id', campoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Get member counts
      let memberQuery = supabase
        .from('members')
        .select('celula_id')
        .eq('is_active', true);
      if (isDemoActive && seedRunId) {
        memberQuery = memberQuery.eq('is_test_data', true).eq('seed_run_id', seedRunId);
      }
      if (campoId) memberQuery = memberQuery.eq('campo_id', campoId);

      const { data: memberCounts } = await memberQuery;
      
      const countMap = memberCounts?.reduce((acc, m) => {
        acc[m.celula_id] = (acc[m.celula_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return data.map(c => ({
        ...c,
        _count: { members: countMap[c.id] || 0 }
      })) as Celula[];
    },
  });
}

export function useCelula(id: string | undefined) {
  return useQuery({
    queryKey: ['celulas', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('celulas')
        .select(`
          *,
          leader:profiles!celulas_leader_id_fkey(id, name, avatar_url),
          leadership_couple:leadership_couples(
            id, spouse1_id, spouse2_id, created_at, updated_at,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url, email),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url, email)
          ),
          coordenacao:coordenacoes!celulas_coordenacao_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Celula;
    },
    enabled: !!id,
  });
}

export function useCreateCelula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (celula: TablesInsert<'celulas'>) => {
      const { data, error } = await supabase
        .from('celulas')
        .insert(celula)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      toast({ title: 'Célula criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar célula', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCelula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...celula }: TablesUpdate<'celulas'> & { id: string }) => {
      const { data, error } = await supabase
        .from('celulas')
        .update(celula)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      toast({ title: 'Célula atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar célula', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCelula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('celulas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      toast({ title: 'Célula excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir célula', description: error.message, variant: 'destructive' });
    },
  });
}
