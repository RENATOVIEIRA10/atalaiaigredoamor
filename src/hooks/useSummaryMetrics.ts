import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';

export interface SummaryMetrics {
  // Cell-level
  membrosCelula?: number;
  novasVidasCelula?: number;
  // Supervisor
  celulasSupervisionadas?: number;
  // Coord
  celulasCoordenacao?: number;
  membrosCoordenacao?: number;
  // Network+
  celulasAtivas?: number;
  membrosAtivos?: number;
  novasVidasMes?: number;
  redesAtivas?: number;
  coordenacoesAtivas?: number;
}

export type ScopeLevel = 'celula' | 'supervisor' | 'coordenacao' | 'rede' | 'pastor' | 'global' | 'ministerio';

export function getScopeLevel(scopeType: string | null): ScopeLevel {
  if (!scopeType) return 'celula';
  if (scopeType === 'celula') return 'celula';
  if (scopeType === 'supervisor') return 'supervisor';
  if (scopeType === 'coordenacao') return 'coordenacao';
  if (scopeType === 'rede') return 'rede';
  if (['pastor', 'pastor_de_campo'].includes(scopeType)) return 'pastor';
  if (scopeType === 'pastor_senior_global') return 'global';
  // Ministerial scopes
  if (['recomeco_cadastro', 'central_celulas', 'batismo_lider', 'batismo_central', 'lider_recomeco_central', 'operador_recomeco'].includes(scopeType)) return 'ministerio';
  if (scopeType === 'admin') return 'global';
  return 'celula';
}

export function useSummaryMetrics() {
  const { activeCampoId } = useCampo();
  const { scopeId, scopeType } = useRole();
  const level = getScopeLevel(scopeType);

  return useQuery({
    queryKey: ['summary-metrics', level, scopeId, activeCampoId],
    queryFn: async (): Promise<SummaryMetrics> => {
      // ── CELL LEADER ──
      if (level === 'celula' && scopeId) {
        const { count: membrosCelula } = await supabase
          .from('members').select('id', { count: 'exact', head: true })
          .eq('celula_id', scopeId).eq('is_active', true);

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { count: novasVidasCelula } = await supabase
          .from('novas_vidas').select('id', { count: 'exact', head: true })
          .eq('assigned_cell_id', scopeId).gte('created_at', monthStart);

        return { membrosCelula: membrosCelula || 0, novasVidasCelula: novasVidasCelula || 0 };
      }

      // ── SUPERVISOR ──
      if (level === 'supervisor' && scopeId) {
        const { count: celulasSupervisionadas } = await supabase
          .from('celulas').select('id', { count: 'exact', head: true })
          .eq('supervisor_id', scopeId);

        return { celulasSupervisionadas: celulasSupervisionadas || 0 };
      }

      // ── COORDINATOR ──
      if (level === 'coordenacao' && scopeId) {
        const { count: celulasCoordenacao } = await supabase
          .from('celulas').select('id', { count: 'exact', head: true })
          .eq('coordenacao_id', scopeId);

        const { data: celIds } = await supabase.from('celulas').select('id').eq('coordenacao_id', scopeId);
        let membrosCoordenacao = 0;
        if (celIds?.length) {
          const { count } = await supabase
            .from('members').select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .in('celula_id', celIds.map(c => c.id));
          membrosCoordenacao = count || 0;
        }

        return { celulasCoordenacao: celulasCoordenacao || 0, membrosCoordenacao };
      }

      // ── NETWORK / PASTOR / GLOBAL / MINISTERIO ──
      if (!activeCampoId && level !== 'global') {
        console.warn('[useSummaryMetrics] campoId required but missing for level:', level);
        return {};
      }

      let cQ = supabase.from('celulas').select('id', { count: 'exact', head: true });
      if (level === 'rede' && scopeId) {
        cQ = cQ.eq('rede_id', scopeId);
      } else if (activeCampoId) {
        cQ = cQ.eq('campo_id', activeCampoId);
      }
      const { count: celulasAtivas } = await cQ;

      let mQ = supabase.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true);
      if (level === 'rede' && scopeId) {
        mQ = mQ.eq('rede_id', scopeId);
      } else if (activeCampoId) {
        mQ = mQ.eq('campo_id', activeCampoId);
      }
      const { count: membrosAtivos } = await mQ;

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      let nvQ = supabase.from('novas_vidas').select('id', { count: 'exact', head: true }).gte('created_at', monthStart);
      if (activeCampoId) nvQ = nvQ.eq('campo_id', activeCampoId);
      const { count: novasVidasMes } = await nvQ;

      const result: SummaryMetrics = {
        celulasAtivas: celulasAtivas || 0,
        membrosAtivos: membrosAtivos || 0,
        novasVidasMes: novasVidasMes || 0,
      };

      // Only pastor+ sees redes/coordenações
      if (['pastor', 'global'].includes(level)) {
        let rQ = supabase.from('redes').select('id', { count: 'exact', head: true }).eq('ativa', true);
        if (activeCampoId) rQ = rQ.eq('campo_id', activeCampoId);
        const { count: redesAtivas } = await rQ;

        let coQ = supabase.from('coordenacoes').select('id', { count: 'exact', head: true });
        if (activeCampoId) coQ = coQ.eq('campo_id', activeCampoId);
        const { count: coordenacoesAtivas } = await coQ;

        result.redesAtivas = redesAtivas || 0;
        result.coordenacoesAtivas = coordenacoesAtivas || 0;
      }

      return result;
    },
    staleTime: 120_000,
  });
}
