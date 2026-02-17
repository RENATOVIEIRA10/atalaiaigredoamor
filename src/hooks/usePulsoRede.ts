import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfWeek } from 'date-fns';
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

export function usePulsoRede({ scopeType, scopeId }: UsePulsoRedeOptions) {
  return useQuery({
    queryKey: ['pulso-rede', scopeType, scopeId],
    enabled: !!scopeId,
    queryFn: async (): Promise<PulsoRedeData> => {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
      const lastWeekStart = subDays(thisWeekStart, 7);
      const twoWeeksAgo = subDays(thisWeekStart, 14);
      const threeWeeksAgo = subDays(thisWeekStart, 21);

      // 1. Get celulas in scope
      let celulaQuery = supabase.from('celulas').select('id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name, rede_id)');

      if (scopeType === 'coordenacao') {
        celulaQuery = celulaQuery.eq('coordenacao_id', scopeId);
      }

      const celulasRes = await celulaQuery;
      let allCelulas = celulasRes.data || [];

      // Filter by rede if needed
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

      // 2. Fetch reports and members in parallel
      const [thisWeekReports, lastWeekReports, twoWeekReports, membersRes] = await Promise.all([
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(thisWeekStart, 'yyyy-MM-dd')).in('celula_id', celulaIds),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(lastWeekStart, 'yyyy-MM-dd')).lt('week_start', format(thisWeekStart, 'yyyy-MM-dd')).in('celula_id', celulaIds),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(twoWeeksAgo, 'yyyy-MM-dd')).lt('week_start', format(lastWeekStart, 'yyyy-MM-dd')).in('celula_id', celulaIds),
        supabase.from('members').select('id, is_discipulado, is_lider_em_treinamento').eq('is_active', true).in('celula_id', celulaIds),
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
