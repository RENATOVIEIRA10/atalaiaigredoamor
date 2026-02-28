import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { LeadershipCouple } from './useLeadershipCouples';
import { useDemoScope } from '@/hooks/useDemoScope';

export type Rede = Tables<'redes'> & {
  leader?: { id: string; name: string; avatar_url: string | null } | null;
  leadership_couple?: LeadershipCouple | null;
  _count?: { coordenacoes: number };
};

export function useRedes() {
  const { campoId, isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['redes', ...queryKeyExtra],
    queryFn: async () => {
      let query = supabase
        .from('redes')
        .select(`
          *,
          leader:profiles!redes_leader_id_fkey(id, name, avatar_url),
          leadership_couple:leadership_couples(
            id, spouse1_id, spouse2_id, created_at, updated_at,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url, email),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url, email)
          )
        `)
        .order('name');

      if (campoId) {
        query = query.eq('campo_id', campoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Get coordenacao counts
      let coordQuery = supabase.from('coordenacoes').select('rede_id');
      if (campoId) coordQuery = coordQuery.eq('campo_id', campoId);
      const { data: coordCounts } = await coordQuery;
      
      const countMap = coordCounts?.reduce((acc, c) => {
        acc[c.rede_id] = (acc[c.rede_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return data.map(r => ({
        ...r,
        _count: { coordenacoes: countMap[r.id] || 0 }
      })) as Rede[];
    },
  });
}

export function useCreateRede() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rede: TablesInsert<'redes'>) => {
      const { data, error } = await supabase
        .from('redes')
        .insert(rede)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      toast({ title: 'Rede criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar rede', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateRede() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...rede }: TablesUpdate<'redes'> & { id: string }) => {
      const { data, error } = await supabase
        .from('redes')
        .update(rede)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      toast({ title: 'Rede atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar rede', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteRede() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('redes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      toast({ title: 'Rede excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir rede', description: error.message, variant: 'destructive' });
    },
  });
}
