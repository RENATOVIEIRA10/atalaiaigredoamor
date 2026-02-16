import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfWeek } from 'date-fns';

export interface CelulaReportStatus {
  celula_id: string;
  celula_name: string;
  coordenacao_name: string;
  weeks_without_report: number;
}

export interface PulsoPastoralData {
  // Engajamento
  totalCelulas: number;
  celulasComRelatorio: number;
  percentualEngajamento: number;
  percentualSemanaAnterior: number;
  // Alertas
  celulasAlerta1Semana: CelulaReportStatus[];
  celulasAlerta2Semanas: CelulaReportStatus[];
  celulasAlerta3Semanas: CelulaReportStatus[];
  // Discipulado
  totalDiscipulados: number;
  discipuladosSemanaAnterior: number;
  // Liderança
  lideresEmTreinamento: number;
  // Marcos espirituais
  marcosEncontro: number;
  marcosBatismo: number;
  marcosDiscipulado: number;
  marcosCursoLidere: number;
  marcosRenovo: number;
}

export function usePulsoPastoral() {
  return useQuery({
    queryKey: ['pulso-pastoral'],
    queryFn: async (): Promise<PulsoPastoralData> => {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
      const lastWeekStart = subDays(thisWeekStart, 7);
      const twoWeeksAgo = subDays(thisWeekStart, 14);
      const threeWeeksAgo = subDays(thisWeekStart, 21);

      // Fetch all data in parallel
      const [
        celulasRes,
        thisWeekReports,
        lastWeekReports,
        twoWeekReports,
        threeWeekReports,
        membersRes,
      ] = await Promise.all([
        supabase.from('celulas').select('id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name)'),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(thisWeekStart, 'yyyy-MM-dd')),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(lastWeekStart, 'yyyy-MM-dd')).lt('week_start', format(thisWeekStart, 'yyyy-MM-dd')),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(twoWeeksAgo, 'yyyy-MM-dd')).lt('week_start', format(lastWeekStart, 'yyyy-MM-dd')),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(threeWeeksAgo, 'yyyy-MM-dd')).lt('week_start', format(twoWeeksAgo, 'yyyy-MM-dd')),
        supabase.from('members').select('id, is_discipulado, is_lider_em_treinamento, encontro_com_deus, batismo, curso_lidere, renovo').eq('is_active', true),
      ]);

      const allCelulas = celulasRes.data || [];
      const totalCelulas = allCelulas.length;

      const thisWeekIds = new Set((thisWeekReports.data || []).map(r => r.celula_id));
      const lastWeekIds = new Set((lastWeekReports.data || []).map(r => r.celula_id));
      const twoWeekIds = new Set((twoWeekReports.data || []).map(r => r.celula_id));
      const threeWeekIds = new Set((threeWeekReports.data || []).map(r => r.celula_id));

      const celulasComRelatorio = thisWeekIds.size;
      const percentualEngajamento = totalCelulas > 0 ? Math.round((celulasComRelatorio / totalCelulas) * 100) : 0;
      const percentualSemanaAnterior = totalCelulas > 0 ? Math.round((lastWeekIds.size / totalCelulas) * 100) : 0;

      // Classify cells by weeks without report
      const celulasAlerta1Semana: CelulaReportStatus[] = [];
      const celulasAlerta2Semanas: CelulaReportStatus[] = [];
      const celulasAlerta3Semanas: CelulaReportStatus[] = [];

      for (const cel of allCelulas) {
        if (thisWeekIds.has(cel.id)) continue; // has report this week
        const coordName = (cel.coordenacao as any)?.name || '';
        const status: CelulaReportStatus = {
          celula_id: cel.id,
          celula_name: cel.name,
          coordenacao_name: coordName,
          weeks_without_report: 1,
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

      // Member data
      const members = membersRes.data || [];
      const totalDiscipulados = members.filter(m => m.is_discipulado).length;
      const lideresEmTreinamento = members.filter(m => m.is_lider_em_treinamento).length;
      const marcosEncontro = members.filter(m => m.encontro_com_deus).length;
      const marcosBatismo = members.filter(m => m.batismo).length;
      const marcosDiscipulado = members.filter(m => m.is_discipulado).length;
      const marcosCursoLidere = members.filter(m => m.curso_lidere).length;
      const marcosRenovo = members.filter(m => m.renovo).length;

      return {
        totalCelulas,
        celulasComRelatorio,
        percentualEngajamento,
        percentualSemanaAnterior,
        celulasAlerta1Semana,
        celulasAlerta2Semanas,
        celulasAlerta3Semanas,
        totalDiscipulados,
        discipuladosSemanaAnterior: 0, // simplified
        lideresEmTreinamento,
        marcosEncontro,
        marcosBatismo,
        marcosDiscipulado,
        marcosCursoLidere,
        marcosRenovo,
      };
    },
  });
}
