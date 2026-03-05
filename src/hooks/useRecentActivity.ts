import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';

export interface ActivityItem {
  id: string;
  type: 'nova_vida' | 'relatorio' | 'encaminhamento' | 'membro';
  description: string;
  timestamp: string;
}

export function useRecentActivity(limit = 8) {
  const { activeCampoId } = useCampo();

  return useQuery({
    queryKey: ['recent-activity', activeCampoId, limit],
    queryFn: async () => {
      const items: ActivityItem[] = [];
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceISO = since.toISOString();

      // Recent novas vidas
      let nvQ = supabase
        .from('novas_vidas')
        .select('id, nome, created_at')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(5);
      if (activeCampoId) nvQ = nvQ.eq('campo_id', activeCampoId);
      const { data: novasVidas } = await nvQ;

      (novasVidas || []).forEach(nv => {
        items.push({
          id: `nv-${nv.id}`,
          type: 'nova_vida',
          description: `${nv.nome} registrado como nova vida`,
          timestamp: nv.created_at,
        });
      });

      // Recent reports
      let rQ = supabase
        .from('weekly_reports')
        .select('id, created_at, celula:celulas(name)')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(5);
      if (activeCampoId) rQ = rQ.eq('campo_id', activeCampoId);
      const { data: reports } = await rQ;

      (reports || []).forEach((r: any) => {
        const name = r.celula?.name || 'Célula';
        items.push({
          id: `rep-${r.id}`,
          type: 'relatorio',
          description: `${name} enviou relatório semanal`,
          timestamp: r.created_at,
        });
      });

      // Recent encaminhamentos
      let eQ = supabase
        .from('encaminhamentos_recomeco')
        .select('id, created_at, nova_vida:novas_vidas(nome), celula:celulas(name)')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(5);
      if (activeCampoId) eQ = eQ.eq('campo_id', activeCampoId);
      const { data: enc } = await eQ;

      (enc || []).forEach((e: any) => {
        const vidaNome = e.nova_vida?.nome || 'Nova vida';
        const celulaNome = e.celula?.name || 'célula';
        items.push({
          id: `enc-${e.id}`,
          type: 'encaminhamento',
          description: `${vidaNome} encaminhada para ${celulaNome}`,
          timestamp: e.created_at,
        });
      });

      // Sort by timestamp desc, take limit
      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    staleTime: 30_000,
  });
}
