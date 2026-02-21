/**
 * usePlanejamentoBimestral.ts
 * 
 * Algoritmo de planejamento inteligente de supervisão bimestral.
 * Gera sugestões equilibradas e pastorais, sem obrigatoriedade.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Types ──

export interface CelulaPlanejamento {
  celula_id: string;
  celula_name: string;
  meeting_day: string | null;
  meeting_time: string | null;
  priority_weight: number;
  priority_label: 'Prioridade de cuidado' | 'Atenção' | 'Rotina';
  days_since_last_supervision: number | null;
  health_score: number | null;
  weeks_without_report: number;
}

export interface SemanaPlano {
  week_number: number;
  week_start: string; // YYYY-MM-DD (Monday)
  week_end: string;   // YYYY-MM-DD (Saturday)
  week_label: string; // "24/02 → 01/03"
  celulas: CelulaPlanItem[];
}

export interface CelulaPlanItem {
  celula_id: string;
  celula_name: string;
  suggested_date: string; // YYYY-MM-DD
  suggested_day_label: string; // "Terça, 25/02"
  priority_label: 'Prioridade de cuidado' | 'Atenção' | 'Rotina';
  priority_weight: number;
  meeting_day: string | null;
  realizada: boolean;
}

export interface PlanejamentoBimestralData {
  bimestre_start: string;
  bimestre_end: string;
  bimestre_label: string;
  semanas: SemanaPlano[];
  celulas_no_escopo: CelulaPlanejamento[];
  total_celulas: number;
  total_semanas: number;
}

// ── Constants ──

const BIMESTRE_START = '2026-02-23'; // Monday, fixed as per spec
const BIMESTRE_DURATION_DAYS = 63;   // ~9 weeks (2 months)
const MAX_PER_WEEK = 3;

// Checklist & quality fields for health score (same as useRadarSaude)
const CHECKLIST_FIELDS = [
  'oracao_inicial', 'louvor', 'apresentacao_visitantes', 'momento_visao_triade',
  'avisos', 'quebra_gelo', 'licao', 'cadeira_amor', 'oracao_final', 'selfie',
] as const;
const QUALITY_FIELDS = [
  'comunhao', 'pontualidade', 'dinamica', 'organizacao', 'interatividade',
] as const;

function calcHealthScore(sup: Record<string, any>): number {
  const checklistScore = CHECKLIST_FIELDS.reduce((sum, f) => sum + (sup[f] ? 1 : 0), 0) / CHECKLIST_FIELDS.length;
  const qualityScore = QUALITY_FIELDS.reduce((sum, f) => sum + (sup[f] ? 1 : 0), 0) / QUALITY_FIELDS.length;
  return (checklistScore * 0.6 + qualityScore * 0.4) * 5;
}

// ── Day mapping ──

const DAY_MAP: Record<string, number> = {
  'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6,
  'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6,
  'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5,
};

const DEFAULT_DAYS = [2, 4, 6]; // Terça, Quinta, Sábado

function getDayOffset(meetingDay: string | null): number {
  if (meetingDay && DAY_MAP[meetingDay] !== undefined) {
    return DAY_MAP[meetingDay]; // offset from Monday (1=Mon ... 6=Sat)
  }
  return -1; // unknown
}

// ── Generate weeks ──

function generateBimestreWeeks(startStr: string): { start: string; end: string }[] {
  const start = new Date(startStr + 'T12:00:00');
  const endDate = addDays(start, BIMESTRE_DURATION_DAYS);
  const weeks: { start: string; end: string }[] = [];
  
  let current = start;
  while (current < endDate) {
    const mon = format(current, 'yyyy-MM-dd');
    const sat = format(addDays(current, 5), 'yyyy-MM-dd');
    weeks.push({ start: mon, end: sat });
    current = addDays(current, 7);
  }
  return weeks;
}

// ── Priority calculation ──

function calcPriorityWeight(
  daysSinceLastSup: number | null,
  healthScore: number | null,
  weeksWithoutReport: number
): number {
  // Time score: max 60
  const daysVal = daysSinceLastSup === null ? 999 : daysSinceLastSup;
  const timeScore = Math.min(daysVal / 14, 6) * 10;

  // Health score contribution
  let healthContrib = 0;
  if (healthScore !== null) {
    if (healthScore <= 3.0) healthContrib = 25;
    else if (healthScore <= 3.9) healthContrib = 12;
  }

  // Report pendency
  let reportContrib = 0;
  if (weeksWithoutReport >= 2) reportContrib = 15;
  else if (weeksWithoutReport >= 1) reportContrib = 5;

  return Math.round(timeScore + healthContrib + reportContrib);
}

function getPriorityLabel(weight: number): CelulaPlanejamento['priority_label'] {
  if (weight >= 60) return 'Prioridade de cuidado';
  if (weight >= 40) return 'Atenção';
  return 'Rotina';
}

// ── Hook ──

interface UsePlanejamentoBimestralOptions {
  supervisorId: string;
  coordenacaoId: string;
}

export function usePlanejamentoBimestral({ supervisorId, coordenacaoId }: UsePlanejamentoBimestralOptions) {
  return useQuery({
    queryKey: ['planejamento-bimestral', supervisorId, coordenacaoId],
    queryFn: async (): Promise<PlanejamentoBimestralData> => {
      // 1) Fetch cells assigned to this supervisor
      let { data: celulas, error: celErr } = await supabase
        .from('celulas')
        .select('id, name, meeting_day, meeting_time, supervisor_id, coordenacao_id')
        .eq('coordenacao_id', coordenacaoId)
        .eq('is_test_data', false);
      
      if (celErr) throw celErr;
      
      // Filter to supervisor's cells (if supervisor_id is set)
      let myCelulas = (celulas || []).filter(c => c.supervisor_id === supervisorId);
      
      // If no cells directly assigned, take all coordination cells
      // (This handles cases where supervisor_id is not yet set on cells)
      if (myCelulas.length === 0) {
        myCelulas = celulas || [];
      }

      if (myCelulas.length === 0) {
        const weeks = generateBimestreWeeks(BIMESTRE_START);
        return {
          bimestre_start: BIMESTRE_START,
          bimestre_end: weeks[weeks.length - 1]?.end || BIMESTRE_START,
          bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
          semanas: [],
          celulas_no_escopo: [],
          total_celulas: 0,
          total_semanas: weeks.length,
        };
      }

      const celulaIds = myCelulas.map(c => c.id);

      // 2) Fetch last supervisões for each cell (last 3)
      const { data: supervisoes } = await supabase
        .from('supervisoes')
        .select('*')
        .in('celula_id', celulaIds)
        .eq('celula_realizada', true)
        .order('data_supervisao', { ascending: false });

      // Group by celula, take last 3
      const supsByCelula: Record<string, any[]> = {};
      for (const s of (supervisoes || [])) {
        if (!supsByCelula[s.celula_id]) supsByCelula[s.celula_id] = [];
        if (supsByCelula[s.celula_id].length < 3) {
          supsByCelula[s.celula_id].push(s);
        }
      }

      // 3) Fetch latest weekly reports to detect pendencies
      const twoWeeksAgo = format(addDays(new Date(), -14), 'yyyy-MM-dd');
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('celula_id, week_start')
        .in('celula_id', celulaIds)
        .gte('week_start', twoWeeksAgo)
        .eq('is_test_data', false);

      const currentWeekMon = startOfWeek(new Date(), { weekStartsOn: 1 });
      const currentWeekStr = format(currentWeekMon, 'yyyy-MM-dd');
      const lastWeekStr = format(addDays(currentWeekMon, -7), 'yyyy-MM-dd');

      // Count weeks without report per cell
      const reportsByCelula: Record<string, Set<string>> = {};
      for (const r of (reports || [])) {
        if (!reportsByCelula[r.celula_id]) reportsByCelula[r.celula_id] = new Set();
        reportsByCelula[r.celula_id].add(r.week_start);
      }

      // 4) Calculate priority for each cell
      const today = new Date();
      const celulasComPrioridade: CelulaPlanejamento[] = myCelulas.map(cel => {
        const sups = supsByCelula[cel.id] || [];
        const lastSup = sups[0]?.data_supervisao;
        const daysSinceLast = lastSup
          ? differenceInDays(today, new Date(lastSup + 'T12:00:00'))
          : null;

        // Health score from last 3 supervisões
        let healthScore: number | null = null;
        if (sups.length > 0) {
          const scores = sups.map(calcHealthScore);
          healthScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          healthScore = Math.round(healthScore * 10) / 10;
        }

        // Weeks without report
        const celReports = reportsByCelula[cel.id] || new Set();
        let weeksWithout = 0;
        if (!celReports.has(currentWeekStr)) weeksWithout++;
        if (!celReports.has(lastWeekStr)) weeksWithout++;

        const weight = calcPriorityWeight(daysSinceLast, healthScore, weeksWithout);

        return {
          celula_id: cel.id,
          celula_name: cel.name,
          meeting_day: cel.meeting_day,
          meeting_time: cel.meeting_time,
          priority_weight: weight,
          priority_label: getPriorityLabel(weight),
          days_since_last_supervision: daysSinceLast,
          health_score: healthScore,
          weeks_without_report: weeksWithout,
        };
      });

      // Sort by priority descending
      celulasComPrioridade.sort((a, b) => b.priority_weight - a.priority_weight);

      // 5) Generate weeks
      const weeks = generateBimestreWeeks(BIMESTRE_START);
      const W = weeks.length;
      const N = celulasComPrioridade.length;

      // 6) Distribute cells across weeks
      const base = Math.floor(N / W);
      const extra = N % W;

      const weekAssignments: CelulaPlanejamento[][] = weeks.map((_, i) => []);
      let idx = 0;
      for (let w = 0; w < W; w++) {
        const count = Math.min(w < extra ? base + 1 : base, MAX_PER_WEEK);
        for (let j = 0; j < count && idx < N; j++) {
          weekAssignments[w].push(celulasComPrioridade[idx]);
          idx++;
        }
      }
      // Handle overflow if MAX_PER_WEEK kicks in
      while (idx < N) {
        for (let w = 0; w < W && idx < N; w++) {
          if (weekAssignments[w].length < MAX_PER_WEEK) {
            weekAssignments[w].push(celulasComPrioridade[idx]);
            idx++;
          }
        }
      }

      // 7) Check existing supervisões in bimestre to mark as "realizada"
      const bimestreEnd = weeks[weeks.length - 1]?.end || BIMESTRE_START;
      const { data: bimestreSups } = await supabase
        .from('supervisoes')
        .select('celula_id, data_supervisao')
        .in('celula_id', celulaIds)
        .gte('data_supervisao', BIMESTRE_START)
        .lte('data_supervisao', bimestreEnd)
        .eq('celula_realizada', true);
      
      const realizadasSet = new Set((bimestreSups || []).map(s => s.celula_id));

      // 8) Build plan with suggested dates
      const semanas: SemanaPlano[] = weeks.map((week, wIdx) => {
        const assigned = weekAssignments[wIdx];
        const usedDays = new Set<number>();

        const celulaPlanItems: CelulaPlanItem[] = assigned.map(cel => {
          // Suggest day
          let dayOffset = getDayOffset(cel.meeting_day);
          if (dayOffset < 0 || dayOffset > 6 || dayOffset === 0) {
            // Pick from defaults, avoiding used days
            for (const d of DEFAULT_DAYS) {
              if (!usedDays.has(d)) {
                dayOffset = d;
                break;
              }
            }
            if (dayOffset < 0 || dayOffset === 0) dayOffset = DEFAULT_DAYS[0];
          }

          // Avoid duplicate days when possible
          if (usedDays.has(dayOffset)) {
            for (const d of [2, 3, 4, 5, 6]) {
              if (!usedDays.has(d)) {
                dayOffset = d;
                break;
              }
            }
          }
          usedDays.add(dayOffset);

          // dayOffset: 1=Mon, 2=Tue... 6=Sat. Offset from Monday = dayOffset - 1
          const suggestedDate = addDays(new Date(week.start + 'T12:00:00'), dayOffset - 1);
          const suggestedDateStr = format(suggestedDate, 'yyyy-MM-dd');
          const dayLabel = format(suggestedDate, "EEEE, dd/MM", { locale: ptBR });

          return {
            celula_id: cel.celula_id,
            celula_name: cel.celula_name,
            suggested_date: suggestedDateStr,
            suggested_day_label: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
            priority_label: cel.priority_label,
            priority_weight: cel.priority_weight,
            meeting_day: cel.meeting_day,
            realizada: realizadasSet.has(cel.celula_id),
          };
        });

        const monDate = new Date(week.start + 'T12:00:00');
        const satDate = new Date(week.end + 'T12:00:00');

        return {
          week_number: wIdx + 1,
          week_start: week.start,
          week_end: week.end,
          week_label: `${format(monDate, 'dd/MM', { locale: ptBR })} → ${format(satDate, 'dd/MM', { locale: ptBR })}`,
          celulas: celulaPlanItems,
        };
      });

      return {
        bimestre_start: BIMESTRE_START,
        bimestre_end: bimestreEnd,
        bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
        semanas,
        celulas_no_escopo: celulasComPrioridade,
        total_celulas: N,
        total_semanas: W,
      };
    },
    enabled: !!supervisorId && !!coordenacaoId,
  });
}
