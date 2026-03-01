import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface KingdomAgendaItem {
  id: string;
  type: string;
  title: string;
  date: string;
  location: string | null;
  start_time: string | null;
  campo_nome?: string;
}

export function useGlobalKingdomAgenda(campoId?: string | null) {
  return useQuery({
    queryKey: ['global-kingdom-agenda', campoId],
    staleTime: 120_000,
    queryFn: async (): Promise<KingdomAgendaItem[]> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const limit = format(addDays(new Date(), 14), 'yyyy-MM-dd');

      let q = supabase
        .from('events_spiritual')
        .select('id, type, title, event_date, location, start_time, campo_id')
        .eq('is_active', true)
        .gte('event_date', today)
        .lte('event_date', limit)
        .order('event_date', { ascending: true });
      if (campoId) q = q.eq('campo_id', campoId);
      const { data } = await q;

      // Get campo names
      const { data: campos } = await supabase.from('campos').select('id, nome');
      const campoMap = new Map((campos || []).map(c => [c.id, c.nome]));

      return (data || []).map(e => ({
        id: e.id,
        type: e.type,
        title: e.title,
        date: e.event_date,
        location: e.location,
        start_time: e.start_time,
        campo_nome: campoMap.get((e as any).campo_id) || '',
      }));
    },
  });
}
