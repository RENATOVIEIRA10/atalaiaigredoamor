import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';
import { getScopeLevel } from '@/hooks/useSummaryMetrics';

export interface ActivityItem {
  id: string;
  type: 'nova_vida' | 'relatorio' | 'encaminhamento' | 'membro';
  description: string;
  timestamp: string;
}

export function useRecentActivity(limit = 8) {
  const { activeCampoId } = useCampo();
  const { scopeId, scopeType } = useRole();
  const level = getScopeLevel(scopeType);

  return useQuery({
    queryKey: ['recent-activity', level, scopeId, activeCampoId, limit],
    queryFn: async () => {
      const items: ActivityItem[] = [];
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceISO = since.toISOString();

      // ── Resolve celula IDs for scope filtering ──
      let scopeCelulaIds: string[] | null = null;

      if (level === 'celula' && scopeId) {
        scopeCelulaIds = [scopeId];
      } else if (level === 'supervisor' && scopeId) {
        const { data } = await supabase.from('celulas').select('id').eq('supervisor_id', scopeId);
        scopeCelulaIds = (data || []).map(c => c.id);
      } else if (level === 'coordenacao' && scopeId) {
        const { data } = await supabase.from('celulas').select('id').eq('coordenacao_id', scopeId);
        scopeCelulaIds = (data || []).map(c => c.id);
      } else if (level === 'rede' && scopeId) {
        const { data: coords } = await supabase.from('coordenacoes').select('id').eq('rede_id', scopeId);
        if (coords?.length) {
          const { data } = await supabase.from('celulas').select('id').in('coordenacao_id', coords.map(c => c.id));
          scopeCelulaIds = (data || []).map(c => c.id);
        } else {
          scopeCelulaIds = [];
        }
      }

      // ── Novas vidas ──
      let nvQ = supabase
        .from('novas_vidas')
        .select('id, nome, created_at')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(5);

      if (scopeCelulaIds !== null) {
        nvQ = nvQ.in('assigned_cell_id', scopeCelulaIds.length ? scopeCelulaIds : ['00000000-0000-0000-0000-000000000000']);
      } else if (activeCampoId) {
        nvQ = nvQ.eq('campo_id', activeCampoId);
      }
      const { data: novasVidas } = await nvQ;

      (novasVidas || []).forEach(nv => {
        items.push({
          id: `nv-${nv.id}`,
          type: 'nova_vida',
          description: `${nv.nome} registrado como nova vida`,
          timestamp: nv.created_at,
        });
      });

      // ── Reports ──
      let rQ = supabase
        .from('weekly_reports')
        .select('id, created_at, celula:celulas(name)')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(5);

      if (scopeCelulaIds !== null) {
        rQ = rQ.in('celula_id', scopeCelulaIds.length ? scopeCelulaIds : ['00000000-0000-0000-0000-000000000000']);
      } else if (activeCampoId) {
        rQ = rQ.eq('campo_id', activeCampoId);
      }
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

      // ── Encaminhamentos ──
      let eQ = supabase
        .from('encaminhamentos_recomeco')
        .select('id, created_at, nova_vida:novas_vidas(nome), celula:celulas(name)')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(5);

      if (scopeCelulaIds !== null) {
        eQ = eQ.in('celula_id', scopeCelulaIds.length ? scopeCelulaIds : ['00000000-0000-0000-0000-000000000000']);
      } else if (activeCampoId) {
        eQ = eQ.eq('campo_id', activeCampoId);
      }
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

      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    staleTime: 30_000,
  });
}
