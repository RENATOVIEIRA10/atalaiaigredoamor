import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyDataPoint {
  month: string; // "Jan", "Fev", etc.
  monthKey: string; // "2025-07"
}

export interface RedeMonthlyData extends MonthlyDataPoint {
  [redeName: string]: number | string;
}

export interface CoordMonthlyData extends MonthlyDataPoint {
  [coordName: string]: number | string;
}

export function usePastoralGrowthCharts() {
  return useQuery({
    queryKey: ['pastoral-growth-charts'],
    queryFn: async () => {
      const now = new Date();
      const months: { start: string; end: string; label: string; key: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        months.push({
          start: format(startOfMonth(d), 'yyyy-MM-dd'),
          end: format(endOfMonth(d), 'yyyy-MM-dd'),
          label: format(d, 'MMM', { locale: ptBR }).replace(/^./, c => c.toUpperCase()),
          key: format(d, 'yyyy-MM'),
        });
      }

      const [redesRes, coordsRes, celulasRes, reportsRes] = await Promise.all([
        supabase.from('redes').select('id, name'),
        supabase.from('coordenacoes').select('id, name, rede_id'),
        supabase.from('celulas').select('id, coordenacao_id'),
        supabase.from('weekly_reports')
          .select('celula_id, members_present, visitors, week_start')
          .gte('week_start', months[0].start)
          .lte('week_start', months[5].end),
      ]);

      const redes = redesRes.data || [];
      const coords = coordsRes.data || [];
      const celulas = celulasRes.data || [];
      const reports = reportsRes.data || [];

      // Build lookup: celula -> coordenacao -> rede
      const celulaToCoord = new Map(celulas.map(c => [c.id, c.coordenacao_id]));
      const coordToRede = new Map(coords.map(c => [c.id, c.rede_id]));
      const coordNameMap = new Map(coords.map(c => [c.id, c.name]));
      const redeNameMap = new Map(redes.map(r => [r.id, r.name]));

      // Presença por rede por mês
      const redePresenceData: RedeMonthlyData[] = months.map(m => {
        const row: RedeMonthlyData = { month: m.label, monthKey: m.key };
        const monthReports = reports.filter(r => r.week_start >= m.start && r.week_start <= m.end);

        for (const rede of redes) {
          const redeCoordIds = coords.filter(c => c.rede_id === rede.id).map(c => c.id);
          const redeCelulaIds = celulas.filter(c => redeCoordIds.includes(c.coordenacao_id)).map(c => c.id);
          const total = monthReports
            .filter(r => redeCelulaIds.includes(r.celula_id))
            .reduce((s, r) => s + r.members_present, 0);
          row[rede.name] = total;
        }
        return row;
      });

      // Visitantes por rede por mês
      const redeVisitorsData: RedeMonthlyData[] = months.map(m => {
        const row: RedeMonthlyData = { month: m.label, monthKey: m.key };
        const monthReports = reports.filter(r => r.week_start >= m.start && r.week_start <= m.end);

        for (const rede of redes) {
          const redeCoordIds = coords.filter(c => c.rede_id === rede.id).map(c => c.id);
          const redeCelulaIds = celulas.filter(c => redeCoordIds.includes(c.coordenacao_id)).map(c => c.id);
          const total = monthReports
            .filter(r => redeCelulaIds.includes(r.celula_id))
            .reduce((s, r) => s + r.visitors, 0);
          row[rede.name] = total;
        }
        return row;
      });

      // Presença por coordenação por mês
      const coordPresenceData: CoordMonthlyData[] = months.map(m => {
        const row: CoordMonthlyData = { month: m.label, monthKey: m.key };
        const monthReports = reports.filter(r => r.week_start >= m.start && r.week_start <= m.end);

        for (const coord of coords) {
          const coordCelulaIds = celulas.filter(c => c.coordenacao_id === coord.id).map(c => c.id);
          const total = monthReports
            .filter(r => coordCelulaIds.includes(r.celula_id))
            .reduce((s, r) => s + r.members_present, 0);
          row[coord.name] = total;
        }
        return row;
      });

      const redeNames = redes.map(r => r.name);
      const coordNames = coords.map(c => c.name);

      return {
        redePresenceData,
        redeVisitorsData,
        coordPresenceData,
        redeNames,
        coordNames,
      };
    },
  });
}
