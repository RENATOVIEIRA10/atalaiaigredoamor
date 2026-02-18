import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays } from 'date-fns';
import { CelulaReportStatus } from '@/hooks/usePulsoPastoral';

export interface PulsoRedeData {
  totalCelulas: number;
  celulasComRelatorio: number;
  percentualEngajamento: number;
  percentualSemanaAnterior: number;
  celulasAlerta1Semana: CelulaReportStatus[];
  celulasAlerta2Semanas: CelulaReportStatus[];
  celulasAlerta3Semanas: CelulaReportStatus[];
  totalDiscipulados: number;
  lideresEmTreinamento: number;
}

interface UsePulsoRedeOptions {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
}

/**
 * Calcula a janela operacional (Seg→Sáb) de uma data.
 * Usa Segunda-feira como início (weekStartsOn: 1).
 * Sábado é Monday + 5 dias.
 */
function getOperacionalWindow(date: Date): { from: string; to: string } {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const saturday = addDays(monday, 5);
  return {
    from: format(monday, 'yyyy-MM-dd'),
    to: format(saturday, 'yyyy-MM-dd'),
  };
}

export function usePulsoRede({ scopeType, scopeId }: UsePulsoRedeOptions) {
  return useQuery({
    queryKey: ['pulso-rede', scopeType, scopeId],
    enabled: !!scopeId,
    queryFn: async (): Promise<PulsoRedeData> => {
      const now = new Date();
      // Semana operacional atual (Seg→Sáb)
      const thisWeek = getOperacionalWindow(now);
      // Semana anterior
      const lastWeek = getOperacionalWindow(addDays(startOfWeek(now, { weekStartsOn: 1 }), -7));
      // 2 semanas atrás
      const twoWeeksAgo = getOperacionalWindow(addDays(startOfWeek(now, { weekStartsOn: 1 }), -14));

      // 1. Get celulas in scope
      let celulaQuery = supabase.from('celulas').select('id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name, rede_id)')
        .eq('is_test_data', false);

      if (scopeType === 'coordenacao') {
        celulaQuery = celulaQuery.eq('coordenacao_id', scopeId);
      }

      const celulasRes = await celulaQuery;
      let allCelulas = celulasRes.data || [];

      if (scopeType === 'rede') {
        allCelulas = allCelulas.filter(c => (c.coordenacao as any)?.rede_id === scopeId);
      }

      const celulaIds = allCelulas.map(c => c.id);
      const totalCelulas = celulaIds.length;

      if (totalCelulas === 0) {
        return {
          totalCelulas: 0, celulasComRelatorio: 0, percentualEngajamento: 0,
          percentualSemanaAnterior: 0, celulasAlerta1Semana: [], celulasAlerta2Semanas: [],
          celulasAlerta3Semanas: [], totalDiscipulados: 0, lideresEmTreinamento: 0,
        };
      }

      // 2. Fetch reports using meeting_date as source of truth (Seg→Sáb window)
      // We filter by meeting_date within each week's Seg→Sáb window.
      // Fallback: also consider records where meeting_date is null but week_start falls in range.
      const buildReportQuery = (window: { from: string; to: string }) =>
        supabase.from('weekly_reports')
          .select('celula_id')
          .in('celula_id', celulaIds)
          .eq('is_test_data', false)
          .or(
            `and(meeting_date.gte.${window.from},meeting_date.lte.${window.to}),` +
            `and(meeting_date.is.null,week_start.gte.${window.from},week_start.lte.${window.to})`
          );

      const [thisWeekReports, lastWeekReports, twoWeekReports, membersRes] = await Promise.all([
        buildReportQuery(thisWeek),
        buildReportQuery(lastWeek),
        buildReportQuery(twoWeeksAgo),
        supabase.from('members').select('id, is_discipulado, is_lider_em_treinamento').eq('is_active', true).eq('is_test_data', false).in('celula_id', celulaIds),
      ]);

      const thisWeekIds = new Set((thisWeekReports.data || []).map(r => r.celula_id));
      const lastWeekIds = new Set((lastWeekReports.data || []).map(r => r.celula_id));
      const twoWeekIds = new Set((twoWeekReports.data || []).map(r => r.celula_id));

      const celulasComRelatorio = thisWeekIds.size;
      const percentualEngajamento = totalCelulas > 0 ? Math.round((celulasComRelatorio / totalCelulas) * 100) : 0;
      const percentualSemanaAnterior = totalCelulas > 0 ? Math.round((lastWeekIds.size / totalCelulas) * 100) : 0;

      const celulasAlerta1Semana: CelulaReportStatus[] = [];
      const celulasAlerta2Semanas: CelulaReportStatus[] = [];
      const celulasAlerta3Semanas: CelulaReportStatus[] = [];

      for (const cel of allCelulas) {
        if (thisWeekIds.has(cel.id)) continue;
        const coordName = (cel.coordenacao as any)?.name || '';
        const status: CelulaReportStatus = {
          celula_id: cel.id, celula_name: cel.name,
          coordenacao_name: coordName, weeks_without_report: 1,
        };
        if (!lastWeekIds.has(cel.id) && !twoWeekIds.has(cel.id)) {
          status.weeks_without_report = 3;
          celulasAlerta3Semanas.push(status);
        } else if (!lastWeekIds.has(cel.id)) {
          status.weeks_without_report = 2;
          celulasAlerta2Semanas.push(status);
        } else {
          celulasAlerta1Semana.push(status);
        }
      }

      const members = membersRes.data || [];
      const totalDiscipulados = members.filter(m => m.is_discipulado).length;
      const lideresEmTreinamento = members.filter(m => m.is_lider_em_treinamento).length;

      return {
        totalCelulas, celulasComRelatorio, percentualEngajamento, percentualSemanaAnterior,
        celulasAlerta1Semana, celulasAlerta2Semanas, celulasAlerta3Semanas,
        totalDiscipulados, lideresEmTreinamento,
      };
    },
  });
}

