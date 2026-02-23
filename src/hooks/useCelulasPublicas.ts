import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CelulaPublica {
  id: string;
  name: string;
  bairro: string | null;
  cidade: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  rede_id: string | null;
  rede_name: string | null;
  lideres: string;
}

export function useCelulasPublicas(filters?: { bairro?: string; cidade?: string; rede_id?: string }) {
  return useQuery({
    queryKey: ['celulas_publicas', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celulas')
        .select(`
          id, name, bairro, cidade, meeting_day, meeting_time, rede_id,
          rede:redes(name),
          leadership_couple:leadership_couples(
            spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
          )
        `)
        .order('name');

      if (error) throw error;

      let result = (data || []).map((c: any) => {
        const spouse1 = c.leadership_couple?.spouse1?.name;
        const spouse2 = c.leadership_couple?.spouse2?.name;
        const lideres = [spouse1, spouse2].filter(Boolean).join(' & ') || '—';

        return {
          id: c.id,
          name: c.name,
          bairro: c.bairro,
          cidade: c.cidade,
          meeting_day: c.meeting_day,
          meeting_time: c.meeting_time,
          rede_id: c.rede_id,
          rede_name: c.rede?.name || null,
          lideres,
        } as CelulaPublica;
      });

      if (filters?.bairro) {
        result = result.filter(c => c.bairro?.toLowerCase().includes(filters.bairro!.toLowerCase()));
      }
      if (filters?.cidade) {
        result = result.filter(c => c.cidade?.toLowerCase().includes(filters.cidade!.toLowerCase()));
      }
      if (filters?.rede_id) {
        result = result.filter(c => c.rede_id === filters.rede_id);
      }

      return result;
    },
  });
}
