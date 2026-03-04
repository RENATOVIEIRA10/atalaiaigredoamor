import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subWeeks, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WeeklyTrend {
  week: string; // "Sem 1", "Sem 2"...
  weekStart: string;
  engajamento: number;
  novasVidas: number;
  conversoes: number;
  supervisoes: number;
  multiplicacoes: number;
}

export function useGlobalKingdomTrends(campoId?: string | null, weeks = 8) {
  return useQuery({
    queryKey: ['global-kingdom-trends', campoId, weeks],
    staleTime: 120_000,
    queryFn: async (): Promise<WeeklyTrend[]> => {
      const now = new Date();
      const results: WeeklyTrend[] = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const wEnd = addDays(wStart, 5);
        const mondayStr = format(wStart, 'yyyy-MM-dd');
        const saturdayStr = format(wEnd, 'yyyy-MM-dd');
        const label = format(wStart, 'dd/MM', { locale: ptBR });

        // Celulas total for engajamento calc (exclude test data)
        let celQ = supabase.from('celulas').select('id', { count: 'exact', head: true }).eq('is_test_data', false);
        if (campoId) celQ = celQ.eq('campo_id', campoId);
        const { count: celTotal } = await celQ;

        // Reports this week
        let repQ = supabase.from('weekly_reports').select('celula_id')
          .or(`and(meeting_date.gte.${mondayStr},meeting_date.lte.${saturdayStr}),and(meeting_date.is.null,week_start.gte.${mondayStr},week_start.lte.${saturdayStr})`);
        if (campoId) repQ = repQ.eq('campo_id', campoId);
        const { data: reps } = await repQ;
        const distinctRep = new Set((reps || []).map(r => r.celula_id)).size;
        const engPct = (celTotal || 0) > 0 ? Math.round((distinctRep / (celTotal || 1)) * 100) : 0;

        // Novas vidas created this week
        let nvQ = supabase.from('novas_vidas').select('id', { count: 'exact', head: true })
          .gte('created_at', mondayStr).lte('created_at', saturdayStr + 'T23:59:59');
        if (campoId) nvQ = nvQ.eq('campo_id', campoId);
        const { count: nvCount } = await nvQ;

        // Conversoes (promovido_membro_at this week)
        let convQ = supabase.from('encaminhamentos_recomeco').select('id', { count: 'exact', head: true })
          .gte('promovido_membro_at', mondayStr).lte('promovido_membro_at', saturdayStr + 'T23:59:59');
        if (campoId) convQ = convQ.eq('campo_id', campoId);
        const { count: convCount } = await convQ;

        // Supervisoes this week
        let supQ = supabase.from('supervisoes').select('id', { count: 'exact', head: true })
          .gte('data_supervisao', mondayStr).lte('data_supervisao', saturdayStr);
        if (campoId) supQ = supQ.eq('campo_id', campoId);
        const { count: supCount } = await supQ;

        // Multiplicações this week
        let mulQ = supabase.from('multiplicacoes').select('id', { count: 'exact', head: true })
          .gte('data_multiplicacao', mondayStr).lte('data_multiplicacao', saturdayStr);
        if (campoId) mulQ = mulQ.eq('campo_id', campoId);
        const { count: mulCount } = await mulQ;

        results.push({
          week: label,
          weekStart: mondayStr,
          engajamento: engPct,
          novasVidas: nvCount || 0,
          conversoes: convCount || 0,
          supervisoes: supCount || 0,
          multiplicacoes: mulCount || 0,
        });
      }

      return results;
    },
  });
}
