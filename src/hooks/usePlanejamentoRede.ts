/**
 * usePlanejamentoRede.ts
 * 
 * Aggregates bimonthly planning data from ALL coordinations in a rede
 * for the Network Leader web dashboard.
 * Reuses the same logic as usePlanejamentoCoordenador but at rede level.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CelulaPlanejamento, SemanaPlano, CelulaPlanItem, SupervisorInfo } from './usePlanejamentoBimestral';
import { BIMESTRE_START } from './usePlanejamentoBimestral';
import type { CoordAlert, VisitaSemana } from './usePlanejamentoCoordenador';

// ── Types ──

export interface CoordPlanSummary {
  coordenacao_id: string;
  coordenacao_name: string;
  supervisors: SupervisorInfo[];
  plans_by_supervisor: { info: SupervisorInfo; semanas: SemanaPlano[] }[];
  celulas_coordenador: CelulaPlanejamento[];
  celulas_coordenador_semanas: SemanaPlano[];
  total_celulas: number;
  total_realizadas: number;
  pendentes: number;
  progress_pct: number;
  visitas_semana: VisitaSemana[];
}

export interface PlanejamentoRedeData {
  bimestre_start: string;
  bimestre_end: string;
  bimestre_label: string;
  coordenacoes: CoordPlanSummary[];
  // Totals across rede
  total_planejadas: number;
  total_realizadas: number;
  total_pendentes: number;
  progress_pct: number;
  total_celulas: number;
  total_semanas: number;
  visitas_semana_atual: VisitaSemana[];
}

// ── Constants ──

const BIMESTRE_DURATION_DAYS = 60;
const MAX_PER_WEEK = 2;

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

const DAY_MAP: Record<string, number> = {
  'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6,
  'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6,
  'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5,
};
const DEFAULT_DAYS = [2, 4, 6];

function getDayOffset(meetingDay: string | null): number {
  if (meetingDay && DAY_MAP[meetingDay] !== undefined) return DAY_MAP[meetingDay];
  return -1;
}

function generateBimestreWeeks(startStr: string): { start: string; end: string }[] {
  const start = new Date(startStr + 'T12:00:00');
  const endDate = addDays(start, BIMESTRE_DURATION_DAYS);
  const weeks: { start: string; end: string }[] = [];
  let current = startOfWeek(start, { weekStartsOn: 1 });
  while (current < endDate) {
    const mon = format(current, 'yyyy-MM-dd');
    const sat = format(addDays(current, 5), 'yyyy-MM-dd');
    weeks.push({ start: mon, end: sat });
    current = addDays(current, 7);
  }
  return weeks;
}

function calcPriorityWeight(daysSinceLastSup: number | null, healthScore: number | null, weeksWithoutReport: number): number {
  const daysVal = daysSinceLastSup === null ? 999 : daysSinceLastSup;
  const timeScore = Math.min(daysVal / 14, 6) * 10;
  let healthContrib = 0;
  if (healthScore !== null) {
    if (healthScore <= 3.0) healthContrib = 25;
    else if (healthScore <= 3.9) healthContrib = 12;
  }
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

function distributeIntoWeeks(
  cells: CelulaPlanejamento[],
  weeks: { start: string; end: string }[],
  supervisorId: string,
  realizadasSet: Set<string>
): SemanaPlano[] {
  const W = weeks.length;
  const N = cells.length;
  if (W === 0 || N === 0) return weeks.map((w, i) => makeEmptyWeek(w, i));

  const assignments: CelulaPlanejamento[][] = weeks.map(() => []);

  if (N <= W) {
    const step = W / N;
    for (let i = 0; i < N; i++) {
      let wIdx = Math.min(Math.round(i * step), W - 1);
      if (assignments[wIdx].length >= MAX_PER_WEEK) {
        wIdx = findNearestFreeWeek(assignments, wIdx, W);
      }
      assignments[wIdx].push(cells[i]);
    }
  } else {
    let idx = 0;
    const order: number[] = [];
    for (let w = 0; w < W; w += 2) order.push(w);
    for (let w = 1; w < W; w += 2) order.push(w);
    for (const w of order) {
      while (assignments[w].length < MAX_PER_WEEK && idx < N) {
        assignments[w].push(cells[idx++]);
      }
    }
    while (idx < N) {
      for (let w = 0; w < W && idx < N; w++) {
        if (assignments[w].length < MAX_PER_WEEK) assignments[w].push(cells[idx++]);
      }
      if (idx < N) break;
    }
  }

  const result = weeks.map((week, wIdx) => {
    const assigned = assignments[wIdx];
    const usedDays = new Set<number>();

    const items: CelulaPlanItem[] = assigned.map(cel => {
      let dayOffset = getDayOffset(cel.meeting_day);
      if (dayOffset < 0 || dayOffset > 6 || dayOffset === 0) {
        for (const d of DEFAULT_DAYS) {
          if (!usedDays.has(d)) { dayOffset = d; break; }
        }
        if (dayOffset < 0 || dayOffset === 0) dayOffset = DEFAULT_DAYS[0];
      }
      if (usedDays.has(dayOffset)) {
        for (const d of [2, 3, 4, 5, 6]) {
          if (!usedDays.has(d)) { dayOffset = d; break; }
        }
      }
      usedDays.add(dayOffset);

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
        assigned_supervisor_id: supervisorId,
        alt_weeks: [],
      };
    });

    const monDate = new Date(week.start + 'T12:00:00');
    const satDate = new Date(week.end + 'T12:00:00');

    return {
      week_number: wIdx + 1,
      week_start: week.start,
      week_end: week.end,
      week_label: `${format(monDate, 'dd/MM', { locale: ptBR })} → ${format(satDate, 'dd/MM', { locale: ptBR })}`,
      celulas: items,
      capacity_used: items.length,
      capacity_max: MAX_PER_WEEK,
    };
  });

  return result;
}

function findNearestFreeWeek(assignments: CelulaPlanejamento[][], fromIdx: number, W: number): number {
  for (let offset = 1; offset < W; offset++) {
    const fwd = fromIdx + offset;
    if (fwd < W && assignments[fwd].length < MAX_PER_WEEK) return fwd;
    const bwd = fromIdx - offset;
    if (bwd >= 0 && assignments[bwd].length < MAX_PER_WEEK) return bwd;
  }
  return fromIdx;
}

function makeEmptyWeek(week: { start: string; end: string }, idx: number): SemanaPlano {
  const monDate = new Date(week.start + 'T12:00:00');
  const satDate = new Date(week.end + 'T12:00:00');
  return {
    week_number: idx + 1,
    week_start: week.start,
    week_end: week.end,
    week_label: `${format(monDate, 'dd/MM', { locale: ptBR })} → ${format(satDate, 'dd/MM', { locale: ptBR })}`,
    celulas: [],
    capacity_used: 0,
    capacity_max: MAX_PER_WEEK,
  };
}

// ── Hook ──

export function usePlanejamentoRede(redeId: string) {
  return useQuery({
    queryKey: ['planejamento-rede', redeId],
    queryFn: async (): Promise<PlanejamentoRedeData> => {
      const weeks = generateBimestreWeeks(BIMESTRE_START);
      const bimestreEnd = weeks[weeks.length - 1]?.end || BIMESTRE_START;

      // 1) Get coordenações
      const { data: coordenacoes } = await supabase
        .from('coordenacoes')
        .select('id, name')
        .eq('rede_id', redeId);

      const coords = coordenacoes || [];
      if (coords.length === 0) return emptyRedeResult(weeks);

      const coordIds = coords.map(c => c.id);

      // 2) Get all cells
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, name, meeting_day, meeting_time, supervisor_id, coordenacao_id, leadership_couple_id')
        .in('coordenacao_id', coordIds)
        .eq('is_test_data', false);

      const allCelulas = celulas || [];
      if (allCelulas.length === 0) return emptyRedeResult(weeks);

      const allCelulaIds = allCelulas.map(c => c.id);

      // 3) Get all supervisors
      const { data: allSupervisors } = await supabase
        .from('supervisores')
        .select('id, profile_id, coordenacao_id, leadership_couple_id, leadership_couple:leadership_couples(id, spouse1_id, spouse2_id, spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name), spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name))')
        .in('coordenacao_id', coordIds);

      const supervisors = (allSupervisors || []) as any[];

      // 4) Supervisões for health
      const { data: supervisoes } = await supabase
        .from('supervisoes')
        .select('*')
        .in('celula_id', allCelulaIds)
        .eq('celula_realizada', true)
        .order('data_supervisao', { ascending: false });

      const supsByCelula: Record<string, any[]> = {};
      for (const s of (supervisoes || [])) {
        if (!supsByCelula[s.celula_id]) supsByCelula[s.celula_id] = [];
        if (supsByCelula[s.celula_id].length < 3) supsByCelula[s.celula_id].push(s);
      }

      // 5) Reports
      const twoWeeksAgo = format(addDays(new Date(), -14), 'yyyy-MM-dd');
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('celula_id, week_start')
        .in('celula_id', allCelulaIds)
        .gte('week_start', twoWeeksAgo)
        .eq('is_test_data', false);

      const currentWeekMon = startOfWeek(new Date(), { weekStartsOn: 1 });
      const currentWeekStr = format(currentWeekMon, 'yyyy-MM-dd');
      const lastWeekStr = format(addDays(currentWeekMon, -7), 'yyyy-MM-dd');
      const reportsByCelula: Record<string, Set<string>> = {};
      for (const r of (reports || [])) {
        if (!reportsByCelula[r.celula_id]) reportsByCelula[r.celula_id] = new Set();
        reportsByCelula[r.celula_id].add(r.week_start);
      }

      const today = new Date();

      function buildPriority(cel: any): CelulaPlanejamento {
        const sups = supsByCelula[cel.id] || [];
        const lastSup = sups[0]?.data_supervisao;
        const daysSinceLast = lastSup ? differenceInDays(today, new Date(lastSup + 'T12:00:00')) : null;
        let healthScore: number | null = null;
        if (sups.length > 0) {
          const scores = sups.map(calcHealthScore);
          healthScore = Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10;
        }
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
          leadership_couple_id: cel.leadership_couple_id,
        };
      }

      // 6) Swaps
      const { data: acceptedSwaps } = await supabase
        .from('supervision_swaps')
        .select('*')
        .eq('bimestre_start', BIMESTRE_START)
        .eq('status', 'accepted');

      const swapOverrides = new Map<string, string>();
      for (const swap of (acceptedSwaps || [])) {
        swapOverrides.set(swap.proposer_celula_id, swap.target_supervisor_id);
        swapOverrides.set(swap.target_celula_id, swap.proposer_supervisor_id);
      }

      // 7) Realizadas in bimestre
      const { data: bimestreSups } = await supabase
        .from('supervisoes')
        .select('celula_id')
        .in('celula_id', allCelulaIds)
        .gte('data_supervisao', BIMESTRE_START)
        .lte('data_supervisao', bimestreEnd)
        .eq('celula_realizada', true);

      const realizadasSet = new Set((bimestreSups || []).map(s => s.celula_id));

      // Current week range
      const currentWeekStart = format(currentWeekMon, 'yyyy-MM-dd');
      const currentWeekEnd = format(addDays(currentWeekMon, 6), 'yyyy-MM-dd');

      // 8) Process each coordination
      let totalPlanejadas = 0;
      let totalRealizadas = 0;
      const allVisitasSemana: VisitaSemana[] = [];
      const coordSummaries: CoordPlanSummary[] = [];

      for (const coord of coords) {
        const coordCelulas = allCelulas.filter(c => c.coordenacao_id === coord.id);
        const coordSups = supervisors.filter(s => s.coordenacao_id === coord.id);

        if (coordCelulas.length === 0) continue;

        // Anti-self-supervision
        const supCoupleIds = new Set(coordSups.filter((s: any) => s.leadership_couple_id).map((s: any) => s.leadership_couple_id));
        const excludedCells: typeof coordCelulas = [];
        const eligibleCells: typeof coordCelulas = [];
        for (const cel of coordCelulas) {
          if (cel.leadership_couple_id && supCoupleIds.has(cel.leadership_couple_id)) {
            excludedCells.push(cel);
          } else {
            eligibleCells.push(cel);
          }
        }

        const eligibleWithPriority = eligibleCells.map(buildPriority).sort((a, b) => b.priority_weight - a.priority_weight);
        const excludedWithPriority = excludedCells.map(buildPriority).sort((a, b) => b.priority_weight - a.priority_weight);

        // Build supervisor infos
        const supInfos: SupervisorInfo[] = coordSups.map((s: any) => {
          const couple = s.leadership_couple;
          const name = couple
            ? `${couple.spouse1?.name || ''} & ${couple.spouse2?.name || ''}`
            : 'Supervisor';
          return { id: s.id, name, leadership_couple_id: s.leadership_couple_id, load: 0, celulas_count: 0 };
        });

        // Load-balanced distribution
        const assignmentMap: Record<string, CelulaPlanejamento[]> = {};
        for (const s of supInfos) assignmentMap[s.id] = [];

        if (supInfos.length === 1) {
          assignmentMap[supInfos[0].id] = [...eligibleWithPriority];
          supInfos[0].load = eligibleWithPriority.reduce((s, c) => s + c.priority_weight, 0);
          supInfos[0].celulas_count = eligibleWithPriority.length;
        } else if (supInfos.length >= 2) {
          for (const cel of eligibleWithPriority) {
            const overrideSup = swapOverrides.get(cel.celula_id);
            if (overrideSup && assignmentMap[overrideSup]) {
              assignmentMap[overrideSup].push(cel);
              const si = supInfos.find(s => s.id === overrideSup)!;
              si.load += cel.priority_weight;
              si.celulas_count++;
              continue;
            }
            let minSup = supInfos[0];
            for (const s of supInfos) {
              if (s.load < minSup.load) minSup = s;
            }
            assignmentMap[minSup.id].push(cel);
            minSup.load += cel.priority_weight;
            minSup.celulas_count++;
          }
        }

        // Build plans per supervisor
        const plansBySupervisor = supInfos.map(si => ({
          info: si,
          semanas: distributeIntoWeeks(assignmentMap[si.id] || [], weeks, si.id, realizadasSet),
        }));

        // Coordinator plan
        const coordSemanas = distributeIntoWeeks(excludedWithPriority, weeks, 'coordenador', realizadasSet);

        // Count
        const allSupCelulas = plansBySupervisor.flatMap(p => p.semanas.flatMap(s => s.celulas));
        const allCoordCelulas = coordSemanas.flatMap(s => s.celulas);
        const coordPlanejadas = allSupCelulas.length + allCoordCelulas.length;
        const coordRealizadas = allSupCelulas.filter(c => c.realizada).length + allCoordCelulas.filter(c => c.realizada).length;

        totalPlanejadas += coordPlanejadas;
        totalRealizadas += coordRealizadas;

        // Current week visits
        const visitasSemana: VisitaSemana[] = [];
        for (const plan of plansBySupervisor) {
          const weekPlan = plan.semanas.find(s => s.week_start <= currentWeekEnd && s.week_end >= currentWeekStart);
          if (weekPlan) {
            for (const cel of weekPlan.celulas) {
              visitasSemana.push({
                celula_id: cel.celula_id,
                celula_name: cel.celula_name,
                responsavel: plan.info.name,
                responsavel_tipo: 'supervisor',
                suggested_date: cel.suggested_date,
                suggested_day_label: cel.suggested_day_label,
                priority_label: cel.priority_label,
                realizada: cel.realizada,
              });
            }
          }
        }
        const cw = coordSemanas.find(s => s.week_start <= currentWeekEnd && s.week_end >= currentWeekStart);
        if (cw) {
          for (const cel of cw.celulas) {
            visitasSemana.push({
              celula_id: cel.celula_id,
              celula_name: cel.celula_name,
              responsavel: 'Coordenador',
              responsavel_tipo: 'coordenador',
              suggested_date: cel.suggested_date,
              suggested_day_label: cel.suggested_day_label,
              priority_label: cel.priority_label,
              realizada: cel.realizada,
            });
          }
        }

        allVisitasSemana.push(...visitasSemana);

        coordSummaries.push({
          coordenacao_id: coord.id,
          coordenacao_name: coord.name,
          supervisors: supInfos,
          plans_by_supervisor: plansBySupervisor,
          celulas_coordenador: excludedWithPriority,
          celulas_coordenador_semanas: coordSemanas,
          total_celulas: coordCelulas.length,
          total_realizadas: coordRealizadas,
          pendentes: coordPlanejadas - coordRealizadas,
          progress_pct: coordPlanejadas > 0 ? Math.round((coordRealizadas / coordPlanejadas) * 100) : 0,
          visitas_semana: visitasSemana,
        });
      }

      return {
        bimestre_start: BIMESTRE_START,
        bimestre_end: bimestreEnd,
        bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
        coordenacoes: coordSummaries,
        total_planejadas: totalPlanejadas,
        total_realizadas: totalRealizadas,
        total_pendentes: totalPlanejadas - totalRealizadas,
        progress_pct: totalPlanejadas > 0 ? Math.round((totalRealizadas / totalPlanejadas) * 100) : 0,
        total_celulas: allCelulas.length,
        total_semanas: weeks.length,
        visitas_semana_atual: allVisitasSemana,
      };
    },
    enabled: !!redeId,
    staleTime: 5 * 60 * 1000,
  });
}

function emptyRedeResult(weeks: { start: string; end: string }[]): PlanejamentoRedeData {
  return {
    bimestre_start: BIMESTRE_START,
    bimestre_end: weeks[weeks.length - 1]?.end || BIMESTRE_START,
    bimestre_label: '',
    coordenacoes: [],
    total_planejadas: 0,
    total_realizadas: 0,
    total_pendentes: 0,
    progress_pct: 0,
    total_celulas: 0,
    total_semanas: weeks.length,
    visitas_semana_atual: [],
  };
}
