import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { useCampoFilterDetailed } from '@/hooks/useCampoFilter';
import { getScopeLevel } from '@/hooks/useSummaryMetrics';
import { getCurrentWeekStart } from '@/hooks/useWeeklyReports';

export interface NovaVidaDetail {
  id: string;
  nome: string;
  whatsapp: string | null;
  status: string;
  created_at: string;
  celula_nome: string | null;
}

export interface CelulaSemRelatorioDetail {
  id: string;
  name: string;
  meeting_day: string | null;
}

export function useConciergeNovasVidasAguardando(enabled: boolean) {
  const { scopeId, scopeType } = useRole();
  const { campoId } = useCampoFilterDetailed();
  const level = getScopeLevel(scopeType);

  return useQuery({
    queryKey: ['concierge-drilldown-vidas-aguardando', level, scopeId, campoId],
    enabled,
    queryFn: async (): Promise<NovaVidaDetail[]> => {
      // For cell leader: show vidas assigned to their cell
      if (level === 'celula' && scopeId) {
        const { data } = await supabase
          .from('novas_vidas')
          .select('id, nome, whatsapp, status, created_at, assigned_cell_id')
          .eq('assigned_cell_id', scopeId)
          .in('status', ['recebida_pela_celula', 'encaminhada'])
          .order('created_at', { ascending: false });

        if (!data?.length) return [];

        const { data: celula } = await supabase.from('celulas').select('id, name').eq('id', scopeId).maybeSingle();

        return data.map(v => ({
          id: v.id,
          nome: v.nome,
          whatsapp: v.whatsapp,
          status: v.status,
          created_at: v.created_at,
          celula_nome: celula?.name ?? null,
        }));
      }

      // For coord+ and pastor: show vidas pendentes do campus
      if (campoId) {
        const { data } = await supabase
          .from('novas_vidas')
          .select('id, nome, whatsapp, status, created_at, assigned_cell_id')
          .eq('campo_id', campoId)
          .in('status', ['nova', 'em_triagem'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (!data?.length) return [];

        const cellIds = [...new Set(data.map(v => v.assigned_cell_id).filter(Boolean))] as string[];
        let cellMap: Record<string, string> = {};
        if (cellIds.length) {
          const { data: cells } = await supabase.from('celulas').select('id, name').in('id', cellIds);
          cellMap = Object.fromEntries((cells || []).map(c => [c.id, c.name]));
        }

        return data.map(v => ({
          id: v.id,
          nome: v.nome,
          whatsapp: v.whatsapp,
          status: v.status,
          created_at: v.created_at,
          celula_nome: v.assigned_cell_id ? cellMap[v.assigned_cell_id] ?? null : null,
        }));
      }

      return [];
    },
    staleTime: 60_000,
  });
}

export function useConciergeCelulasSemRelatorio(enabled: boolean) {
  const { scopeId, scopeType } = useRole();
  const { campoId } = useCampoFilterDetailed();
  const level = getScopeLevel(scopeType);

  return useQuery({
    queryKey: ['concierge-drilldown-celulas-sem-relatorio', level, scopeId, campoId],
    enabled,
    queryFn: async (): Promise<CelulaSemRelatorioDetail[]> => {
      const weekStart = getCurrentWeekStart();
      let celulaIds: string[] = [];

      if (level === 'supervisor' && scopeId) {
        const { data } = await supabase.from('celulas').select('id, name, meeting_day').eq('supervisor_id', scopeId);
        if (!data?.length) return [];
        const { data: reports } = await supabase.from('weekly_reports').select('celula_id').eq('week_start', weekStart).in('celula_id', data.map(c => c.id));
        const reported = new Set((reports || []).map(r => r.celula_id));
        return data.filter(c => !reported.has(c.id)).map(c => ({ id: c.id, name: c.name, meeting_day: c.meeting_day }));
      }

      if (level === 'coordenacao' && scopeId) {
        const { data } = await supabase.from('celulas').select('id, name, meeting_day').eq('coordenacao_id', scopeId);
        celulaIds = (data || []).map(c => c.id);
        if (!data?.length) return [];
        const { data: reports } = await supabase.from('weekly_reports').select('celula_id').eq('week_start', weekStart).in('celula_id', celulaIds.slice(0, 100));
        const reported = new Set((reports || []).map(r => r.celula_id));
        return data.filter(c => !reported.has(c.id)).map(c => ({ id: c.id, name: c.name, meeting_day: c.meeting_day }));
      }

      if (level === 'rede' && scopeId) {
        const { data: coords } = await supabase.from('coordenacoes').select('id').eq('rede_id', scopeId);
        if (!coords?.length) return [];
        const { data } = await supabase.from('celulas').select('id, name, meeting_day').in('coordenacao_id', coords.map(c => c.id));
        if (!data?.length) return [];
        const { data: reports } = await supabase.from('weekly_reports').select('celula_id').eq('week_start', weekStart).in('celula_id', data.map(c => c.id).slice(0, 100));
        const reported = new Set((reports || []).map(r => r.celula_id));
        return data.filter(c => !reported.has(c.id)).map(c => ({ id: c.id, name: c.name, meeting_day: c.meeting_day }));
      }

      if (['pastor', 'global'].includes(level) && campoId) {
        const { data } = await supabase.from('celulas').select('id, name, meeting_day').eq('campo_id', campoId);
        if (!data?.length) return [];
        const { data: reports } = await supabase.from('weekly_reports').select('celula_id').eq('week_start', weekStart).in('celula_id', data.map(c => c.id).slice(0, 100));
        const reported = new Set((reports || []).map(r => r.celula_id));
        return data.filter(c => !reported.has(c.id)).map(c => ({ id: c.id, name: c.name, meeting_day: c.meeting_day }));
      }

      return [];
    },
    staleTime: 60_000,
  });
}

export function useConciergeNovasVidasMes(enabled: boolean) {
  const { campoId } = useCampoFilterDetailed();

  return useQuery({
    queryKey: ['concierge-drilldown-vidas-mes', campoId],
    enabled,
    queryFn: async (): Promise<NovaVidaDetail[]> => {
      if (!campoId) return [];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data } = await supabase
        .from('novas_vidas')
        .select('id, nome, whatsapp, status, created_at, assigned_cell_id')
        .eq('campo_id', campoId)
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data?.length) return [];

      const cellIds = [...new Set(data.map(v => v.assigned_cell_id).filter(Boolean))] as string[];
      let cellMap: Record<string, string> = {};
      if (cellIds.length) {
        const { data: cells } = await supabase.from('celulas').select('id, name').in('id', cellIds);
        cellMap = Object.fromEntries((cells || []).map(c => [c.id, c.name]));
      }

      return data.map(v => ({
        id: v.id,
        nome: v.nome,
        whatsapp: v.whatsapp,
        status: v.status,
        created_at: v.created_at,
        celula_nome: v.assigned_cell_id ? cellMap[v.assigned_cell_id] ?? null : null,
      }));
    },
    staleTime: 60_000,
  });
}
