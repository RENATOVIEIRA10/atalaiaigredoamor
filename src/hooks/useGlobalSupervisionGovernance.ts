import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface SupervisionCampusSummary {
  campo_id: string;
  campo_nome: string;
  total_celulas: number;
  supervisoes_bimestre: number;
  cobertura_pct: number;
  pendentes: number;
}

export function useGlobalSupervisionGovernance() {
  return useQuery({
    queryKey: ['global-supervision-governance'],
    staleTime: 120_000,
    queryFn: async (): Promise<SupervisionCampusSummary[]> => {
      const bimestreStart = format(subDays(new Date(), 60), 'yyyy-MM-dd');

      const { data: campos } = await supabase.from('campos').select('id, nome').eq('ativo', true).order('nome');
      if (!campos) return [];

      const results: SupervisionCampusSummary[] = [];

      for (const campo of campos) {
        const [celRes, supRes] = await Promise.all([
          supabase.from('celulas').select('id', { count: 'exact', head: true }).eq('campo_id', campo.id),
          supabase.from('supervisoes').select('celula_id').eq('campo_id', campo.id).gte('data_supervisao', bimestreStart),
        ]);

        const totalCelulas = celRes.count || 0;
        const distinctSup = new Set((supRes.data || []).map(s => s.celula_id)).size;
        const cobertura = totalCelulas > 0 ? Math.round((distinctSup / totalCelulas) * 100) : 0;

        results.push({
          campo_id: campo.id,
          campo_nome: campo.nome,
          total_celulas: totalCelulas,
          supervisoes_bimestre: distinctSup,
          cobertura_pct: cobertura,
          pendentes: Math.max(0, totalCelulas - distinctSup),
        });
      }

      return results;
    },
  });
}
