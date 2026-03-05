import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';

export interface SummaryMetrics {
  celulasAtivas: number;
  membrosAtivos: number;
  novasVidasMes: number;
  batismosAno: number;
  redesAtivas: number;
  coordenacoesAtivas: number;
}

export function useSummaryMetrics() {
  const { activeCampoId } = useCampo();

  return useQuery({
    queryKey: ['summary-metrics', activeCampoId],
    queryFn: async () => {
      const campoFilter = activeCampoId ? { campo_id: activeCampoId } : {};

      // Celulas ativas
      let cQ = supabase.from('celulas').select('id', { count: 'exact', head: true });
      if (activeCampoId) cQ = cQ.eq('campo_id', activeCampoId);
      const { count: celulasAtivas } = await cQ;

      // Membros ativos
      let mQ = supabase.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true);
      if (activeCampoId) mQ = mQ.eq('campo_id', activeCampoId);
      const { count: membrosAtivos } = await mQ;

      // Novas vidas no mês
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      let nvQ = supabase.from('novas_vidas').select('id', { count: 'exact', head: true }).gte('created_at', monthStart);
      if (activeCampoId) nvQ = nvQ.eq('campo_id', activeCampoId);
      const { count: novasVidasMes } = await nvQ;

      // Redes ativas
      let rQ = supabase.from('redes').select('id', { count: 'exact', head: true }).eq('ativa', true);
      if (activeCampoId) rQ = rQ.eq('campo_id', activeCampoId);
      const { count: redesAtivas } = await rQ;

      // Coordenações
      let coQ = supabase.from('coordenacoes').select('id', { count: 'exact', head: true });
      if (activeCampoId) coQ = coQ.eq('campo_id', activeCampoId);
      const { count: coordenacoesAtivas } = await coQ;

      return {
        celulasAtivas: celulasAtivas || 0,
        membrosAtivos: membrosAtivos || 0,
        novasVidasMes: novasVidasMes || 0,
        batismosAno: 0, // Would need events_spiritual query
        redesAtivas: redesAtivas || 0,
        coordenacoesAtivas: coordenacoesAtivas || 0,
      } satisfies SummaryMetrics;
    },
    staleTime: 120_000,
  });
}
