import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useDemoScope } from '@/hooks/useDemoScope';

export type Member = Tables<'members'> & {
  profile?: { 
    id: string; 
    name: string; 
    avatar_url: string | null; 
    email: string | null;
    birth_date: string | null;
    joined_church_at: string | null;
  } | null;
  celula?: { id: string; name: string } | null;
  batismo?: boolean;
  encontro_com_deus?: boolean;
  renovo?: boolean;
  encontro_de_casais?: boolean;
  curso_lidere?: boolean;
  is_discipulado?: boolean;
  is_lider_em_treinamento?: boolean;
};

export function useMembers(celulaId?: string) {
  const { campoId, isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['members', celulaId, ...queryKeyExtra],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select(`
          id, profile_id, celula_id, is_active, joined_at,
          batismo, encontro_com_deus, renovo, encontro_de_casais, curso_lidere,
          is_discipulado, is_lider_em_treinamento,
          profile:profiles!members_profile_id_fkey(id, name, avatar_url, email, birth_date, joined_church_at),
          celula:celulas!members_celula_id_fkey(id, name)
        `)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });
      
      if (celulaId) {
        query = query.eq('celula_id', celulaId);
      }

      if (isDemoActive && seedRunId) {
        query = query.eq('is_test_data', true).eq('seed_run_id', seedRunId);
      }

      if (campoId) {
        query = query.eq('campo_id', campoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (member: TablesInsert<'members'>) => {
      const { data, error } = await supabase
        .from('members')
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      toast({ title: 'Membro adicionado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar membro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...member }: TablesUpdate<'members'> & { id: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update(member)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      toast({ title: 'Membro atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar membro', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      toast({ title: 'Membro removido com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover membro', description: error.message, variant: 'destructive' });
    },
  });
}
