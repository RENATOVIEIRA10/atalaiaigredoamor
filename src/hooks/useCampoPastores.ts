import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampoPastor {
  id: string;
  campo_id: string;
  profile_id: string;
  tipo: string;
  created_at: string;
  profile?: { id: string; name: string; avatar_url: string | null };
}

export function useCampoPastores(campoId?: string | null) {
  return useQuery({
    queryKey: ['campo_pastores', campoId],
    queryFn: async () => {
      let query = supabase
        .from('campo_pastores')
        .select('*, profile:profiles!campo_pastores_profile_id_fkey(id, name, avatar_url)')
        .order('created_at');
      
      if (campoId) query = query.eq('campo_id', campoId);

      const { data, error } = await query;
      if (error) throw error;
      return data as CampoPastor[];
    },
    enabled: campoId !== undefined,
  });
}

export function useAddCampoPastor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campo_id, profile_id, tipo }: { campo_id: string; profile_id: string; tipo: string }) => {
      const { error } = await supabase.from('campo_pastores').insert({ campo_id, profile_id, tipo });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campo_pastores'] }),
  });
}

export function useRemoveCampoPastor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campo_pastores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campo_pastores'] }),
  });
}
