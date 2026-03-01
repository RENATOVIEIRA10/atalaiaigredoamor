import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

export interface CampusKPI {
  campo_id: string;
  campo_nome: string;
  // 1. Saúde das células
  celulas_ativas: number;
  celulas_com_relatorio: number;
  engajamento_pct: number;
  // 2. Movimento novas vidas
  novas_vidas_total: number;
  novas_vidas_convertidas: number; // integrado + membro
  // 3. Discipulado
  disc_encontros: number;
  disc_presencas: number;
  // 4. Supervisões
  supervisoes_bimestre: number;
  supervisoes_total_celulas: number;
  // 5. Marcos espirituais
  marcos_encontro: number;
  marcos_batismo: number;
  marcos_curso_lidere: number;
  marcos_renovo: number;
  membros_total: number;
}

export interface RedeDetail {
  id: string;
  name: string;
  celulas_count: number;
  membros_count: number;
  relatorios_semana: number;
  engajamento_pct: number;
}

export interface CampusAlert {
  type: 'sem_relatorio' | 'baixa_saude' | 'nv_parada' | 'supervisao_pendente' | 'disc_baixa';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  count: number;
}

async function countQ(table: string, filters?: (q: any) => any): Promise<number> {
  let q = (supabase.from as any)(table).select('id', { count: 'exact', head: true });
  if (filters) q = filters(q);
  const { count } = await q;
  return count || 0;
}

export function useGlobalKingdomData() {
  return useQuery({
    queryKey: ['global-kingdom-data'],
    staleTime: 120_000,
    queryFn: async (): Promise<CampusKPI[]> => {
      const { data: campos } = await supabase
        .from('campos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (!campos || campos.length === 0) return [];

      const now = new Date();
      const monday = startOfWeek(now, { weekStartsOn: 1 });
      const saturday = addDays(monday, 5);
      const mondayStr = format(monday, 'yyyy-MM-dd');
      const saturdayStr = format(saturday, 'yyyy-MM-dd');
      const bimestreStart = format(subDays(now, 60), 'yyyy-MM-dd');

      const results: CampusKPI[] = [];

      for (const campo of campos) {
        const cid = campo.id;

        const [
          celulasAtivas, membrosTotal,
          nvTotal, nvConvertidas,
          discEnc, discPres,
          supBim,
          marcosEncontro, marcosBatismo, marcosCurso, marcosRenovo,
        ] = await Promise.all([
          countQ('celulas', q => q.eq('campo_id', cid).eq('is_test_data', false)),
          countQ('members', q => q.eq('campo_id', cid).eq('is_active', true)),
          countQ('novas_vidas', q => q.eq('campo_id', cid)),
          countQ('novas_vidas', q => q.eq('campo_id', cid).in('status', ['integrado', 'membro'])),
          countQ('discipulado_encontros', q => q.eq('campo_id', cid)),
          countQ('discipulado_presencas', q => q.eq('campo_id', cid)),
          countQ('supervisoes', q => q.eq('campo_id', cid).gte('data_supervisao', bimestreStart)),
          countQ('members', q => q.eq('campo_id', cid).eq('is_active', true).eq('encontro_com_deus', true)),
          countQ('members', q => q.eq('campo_id', cid).eq('is_active', true).eq('batismo', true)),
          countQ('members', q => q.eq('campo_id', cid).eq('is_active', true).eq('curso_lidere', true)),
          countQ('members', q => q.eq('campo_id', cid).eq('is_active', true).eq('renovo', true)),
        ]);

        // Reports this week
        const celulasComRelatorio = await countQ('weekly_reports', q =>
          q.eq('campo_id', cid).eq('is_test_data', false)
            .or(
              `and(meeting_date.gte.${mondayStr},meeting_date.lte.${saturdayStr}),` +
              `and(meeting_date.is.null,week_start.gte.${mondayStr},week_start.lte.${saturdayStr})`
            )
        );

        // Count distinct celula_ids with reports (approximate with count)
        const { data: reportedCelulas } = await supabase
          .from('weekly_reports')
          .select('celula_id')
          .eq('campo_id', cid)
          .eq('is_test_data', false)
          .or(
            `and(meeting_date.gte.${mondayStr},meeting_date.lte.${saturdayStr}),` +
            `and(meeting_date.is.null,week_start.gte.${mondayStr},week_start.lte.${saturdayStr})`
          );

        const distinctReported = new Set((reportedCelulas || []).map(r => r.celula_id)).size;
        const engPct = celulasAtivas > 0 ? Math.round((distinctReported / celulasAtivas) * 100) : 0;

        results.push({
          campo_id: cid,
          campo_nome: campo.nome,
          celulas_ativas: celulasAtivas,
          celulas_com_relatorio: distinctReported,
          engajamento_pct: engPct,
          novas_vidas_total: nvTotal,
          novas_vidas_convertidas: nvConvertidas,
          disc_encontros: discEnc,
          disc_presencas: discPres,
          supervisoes_bimestre: supBim,
          supervisoes_total_celulas: celulasAtivas,
          marcos_encontro: marcosEncontro,
          marcos_batismo: marcosBatismo,
          marcos_curso_lidere: marcosCurso,
          marcos_renovo: marcosRenovo,
          membros_total: membrosTotal,
        });
      }

      return results;
    },
  });
}

export function useCampusRedesDetail(campoId: string | null) {
  return useQuery({
    queryKey: ['campus-redes-detail', campoId],
    enabled: !!campoId,
    staleTime: 120_000,
    queryFn: async (): Promise<RedeDetail[]> => {
      if (!campoId) return [];

      const now = new Date();
      const monday = startOfWeek(now, { weekStartsOn: 1 });
      const saturday = addDays(monday, 5);
      const mondayStr = format(monday, 'yyyy-MM-dd');
      const saturdayStr = format(saturday, 'yyyy-MM-dd');

      const { data: redes } = await supabase
        .from('redes')
        .select('id, name')
        .eq('campo_id', campoId)
        .eq('ativa', true)
        .order('name');

      if (!redes || redes.length === 0) return [];

      const results: RedeDetail[] = [];

      for (const rede of redes) {
        const [celulas, membros] = await Promise.all([
          countQ('celulas', q => q.eq('rede_id', rede.id).eq('is_test_data', false)),
          countQ('members', q => q.eq('rede_id', rede.id).eq('is_active', true)),
        ]);

        const { data: reportedCelulas } = await supabase
          .from('weekly_reports')
          .select('celula_id')
          .eq('rede_id', rede.id)
          .eq('is_test_data', false)
          .or(
            `and(meeting_date.gte.${mondayStr},meeting_date.lte.${saturdayStr}),` +
            `and(meeting_date.is.null,week_start.gte.${mondayStr},week_start.lte.${saturdayStr})`
          );

        const distinctReported = new Set((reportedCelulas || []).map(r => r.celula_id)).size;
        const engPct = celulas > 0 ? Math.round((distinctReported / celulas) * 100) : 0;

        results.push({
          id: rede.id,
          name: rede.name,
          celulas_count: celulas,
          membros_count: membros,
          relatorios_semana: distinctReported,
          engajamento_pct: engPct,
        });
      }

      return results;
    },
  });
}

export function useCampusAlerts(campoId: string | null) {
  return useQuery({
    queryKey: ['campus-alerts', campoId],
    enabled: !!campoId,
    staleTime: 120_000,
    queryFn: async (): Promise<CampusAlert[]> => {
      if (!campoId) return [];

      const alerts: CampusAlert[] = [];
      const now = new Date();
      const monday = startOfWeek(now, { weekStartsOn: 1 });
      const saturday = addDays(monday, 5);
      const mondayStr = format(monday, 'yyyy-MM-dd');
      const saturdayStr = format(saturday, 'yyyy-MM-dd');
      const bimestreStart = format(subDays(now, 60), 'yyyy-MM-dd');

      // 1. Células sem relatório
      const totalCelulas = await countQ('celulas', q => q.eq('campo_id', campoId).eq('is_test_data', false));
      const { data: reportedCelulas } = await supabase
        .from('weekly_reports')
        .select('celula_id')
        .eq('campo_id', campoId)
        .eq('is_test_data', false)
        .or(
          `and(meeting_date.gte.${mondayStr},meeting_date.lte.${saturdayStr}),` +
          `and(meeting_date.is.null,week_start.gte.${mondayStr},week_start.lte.${saturdayStr})`
        );
      const distinctReported = new Set((reportedCelulas || []).map(r => r.celula_id)).size;
      const semRelatorio = totalCelulas - distinctReported;

      if (semRelatorio > 0) {
        alerts.push({
          type: 'sem_relatorio',
          severity: semRelatorio > 5 ? 'critical' : 'warning',
          title: 'Células sem relatório',
          description: `${semRelatorio} de ${totalCelulas} células sem relatório esta semana`,
          count: semRelatorio,
        });
      }

      // 2. Novas vidas paradas
      const nvParadas = await countQ('novas_vidas', q =>
        q.eq('campo_id', campoId).in('status', ['nova', 'contatado'])
      );
      if (nvParadas > 0) {
        alerts.push({
          type: 'nv_parada',
          severity: nvParadas > 10 ? 'critical' : 'warning',
          title: 'Novas vidas paradas no funil',
          description: `${nvParadas} pessoas aguardando avanço (nova/contatado)`,
          count: nvParadas,
        });
      }

      // 3. Supervisões pendentes
      const supRealizadas = await countQ('supervisoes', q =>
        q.eq('campo_id', campoId).gte('data_supervisao', bimestreStart)
      );
      const supPendentes = Math.max(0, totalCelulas - supRealizadas);
      if (supPendentes > 0 && totalCelulas > 0) {
        alerts.push({
          type: 'supervisao_pendente',
          severity: supPendentes > totalCelulas * 0.5 ? 'critical' : 'warning',
          title: 'Supervisões pendentes',
          description: `${supPendentes} células sem supervisão no bimestre (${supRealizadas}/${totalCelulas})`,
          count: supPendentes,
        });
      }

      return alerts;
    },
  });
}
