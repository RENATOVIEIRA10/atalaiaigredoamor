/**
 * usePlanejamentoBimestral.ts
 * 
 * Planejamento inteligente de supervisão bimestral com suporte a 2 supervisores,
 * anti auto-supervisão e bate-bola (trocas).
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
  leadership_couple_id: string | null;
}

export interface SemanaPlano {
  week_number: number;
  week_start: string;
  week_end: string;
  week_label: string;
  celulas: CelulaPlanItem[];
  /** Capacidade: slots livres / max por semana */
  capacity_used: number;
  capacity_max: number;
}

export interface CelulaPlanItem {
  celula_id: string;
  celula_name: string;
  suggested_date: string;
  suggested_day_label: string;
  priority_label: 'Prioridade de cuidado' | 'Atenção' | 'Rotina';
  priority_weight: number;
  meeting_day: string | null;
  realizada: boolean;
  assigned_supervisor_id: string;
  /** Semanas alternativas (flexíveis) para encaixe */
  alt_weeks?: { week_number: number; week_label: string; week_start: string }[];
}

export interface SupervisorInfo {
  id: string;
  name: string;
  leadership_couple_id: string | null;
  load: number;
  celulas_count: number;
}

export interface PlanejamentoBimestralData {
  bimestre_start: string;
  bimestre_end: string;
  bimestre_label: string;
  supervisors: SupervisorInfo[];
  current_supervisor_id: string;
  // Plan for current supervisor
  minhas_semanas: SemanaPlano[];
  // Plan for the other supervisor (read-only)
  outro_supervisor: { info: SupervisorInfo; semanas: SemanaPlano[] } | null;
  // Cells excluded (led by supervisors → coordinator must supervise)
  celulas_coordenador: CelulaPlanejamento[];
  // All eligible cells with priority
  celulas_no_escopo: CelulaPlanejamento[];
  total_celulas: number;
  total_semanas: number;
}

// ── Constants ──

const BIMESTRE_START = '2026-02-24'; // Tuesday, as per spec
const BIMESTRE_DURATION_DAYS = 60;   // ~2 months
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

// ── Day mapping ──

const DAY_MAP: Record<string, number> = {
  'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6,
  'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6,
  'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5,
};

const DEFAULT_DAYS = [2, 4, 6]; // Terça, Quinta, Sábado

function getDayOffset(meetingDay: string | null): number {
  if (meetingDay && DAY_MAP[meetingDay] !== undefined) return DAY_MAP[meetingDay];
  return -1;
}

// ── Generate weeks (Mon-Sat) ──

function generateBimestreWeeks(startStr: string): { start: string; end: string }[] {
  const start = new Date(startStr + 'T12:00:00');
  const endDate = addDays(start, BIMESTRE_DURATION_DAYS);
  const weeks: { start: string; end: string }[] = [];

  // Find the Monday of the start week (or start itself if Monday)
  let current = startOfWeek(start, { weekStartsOn: 1 });
  // If start is after Monday, use next Monday? No — use the Monday of the week containing start
  if (current < start) {
    // start is mid-week; use this Monday still (the week contains the start)
  }

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

// ── Distribute cells into weeks ──

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
    // ── Espalhamento: step-based distribution ──
    const step = W / N;
    for (let i = 0; i < N; i++) {
      let wIdx = Math.min(Math.round(i * step), W - 1);
      // Se já atingiu capacidade, procurar semana livre mais próxima
      if (assignments[wIdx].length >= MAX_PER_WEEK) {
        wIdx = findNearestFreeWeek(assignments, wIdx, W);
      }
      assignments[wIdx].push(cells[i]);
    }
  } else {
    // ── N > W: distribuição uniforme alternada ──
    let idx = 0;
    // First pass: fill evenly up to MAX_PER_WEEK using alternating (even then odd weeks)
    const order: number[] = [];
    for (let w = 0; w < W; w += 2) order.push(w);
    for (let w = 1; w < W; w += 2) order.push(w);

    for (const w of order) {
      while (assignments[w].length < MAX_PER_WEEK && idx < N) {
        assignments[w].push(cells[idx++]);
      }
    }
    // Overflow (shouldn't happen with MAX_PER_WEEK=2 and typical loads)
    while (idx < N) {
      for (let w = 0; w < W && idx < N; w++) {
        if (assignments[w].length < MAX_PER_WEEK) {
          assignments[w].push(cells[idx++]);
        }
      }
      if (idx < N) break; // all full, stop
    }
  }

  // Build SemanaPlano with capacity and alt_weeks
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
        alt_weeks: [], // filled below
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

  // ── Generate alt_weeks (2 flexible alternatives per cell) ──
  for (const semana of result) {
    for (const cel of semana.celulas) {
      const alts: CelulaPlanItem['alt_weeks'] = [];
      const currentIdx = semana.week_number - 1;
      // Forward search
      for (let w = currentIdx + 1; w < W && alts.length < 1; w++) {
        if (result[w].capacity_used < result[w].capacity_max) {
          alts.push({ week_number: result[w].week_number, week_label: result[w].week_label, week_start: result[w].week_start });
        }
      }
      // Backward search
      for (let w = currentIdx - 1; w >= 0 && alts.length < 2; w--) {
        if (result[w].capacity_used < result[w].capacity_max) {
          alts.push({ week_number: result[w].week_number, week_label: result[w].week_label, week_start: result[w].week_start });
        }
      }
      cel.alt_weeks = alts;
    }
  }

  return result;
}

function findNearestFreeWeek(assignments: CelulaPlanejamento[][], fromIdx: number, W: number): number {
  for (let offset = 1; offset < W; offset++) {
    const fwd = fromIdx + offset;
    if (fwd < W && assignments[fwd].length < MAX_PER_WEEK) return fwd;
    const bwd = fromIdx - offset;
    if (bwd >= 0 && assignments[bwd].length < MAX_PER_WEEK) return bwd;
  }
  return fromIdx; // fallback
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

interface UsePlanejamentoBimestralOptions {
  supervisorId: string;
  coordenacaoId: string;
}

export function usePlanejamentoBimestral({ supervisorId, coordenacaoId }: UsePlanejamentoBimestralOptions) {
  return useQuery({
    queryKey: ['planejamento-bimestral', supervisorId, coordenacaoId],
    queryFn: async (): Promise<PlanejamentoBimestralData> => {
      // 1) Fetch all supervisors in this coordenação
      const { data: allSupervisors } = await supabase
        .from('supervisores')
        .select('id, profile_id, coordenacao_id, leadership_couple_id, leadership_couple:leadership_couples(id, spouse1_id, spouse2_id, spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name), spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name))')
        .eq('coordenacao_id', coordenacaoId);

      const supervisors = (allSupervisors || []) as any[];

      // 2) Fetch all active cells in coordenação
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, name, meeting_day, meeting_time, supervisor_id, coordenacao_id, leadership_couple_id')
        .eq('coordenacao_id', coordenacaoId)
        .eq('is_test_data', false);

      const allCelulas = celulas || [];
      if (allCelulas.length === 0) {
        const weeks = generateBimestreWeeks(BIMESTRE_START);
        return emptyResult(weeks, supervisorId, supervisors);
      }

      // 3) Identify supervisor couple IDs for anti-self-supervision
      const supervisorCoupleIds = new Set(
        supervisors.filter(s => s.leadership_couple_id).map(s => s.leadership_couple_id)
      );

      // Separate: cells led by a supervisor couple → coordinator must supervise
      const excludedCells: typeof allCelulas = [];
      const eligibleCells: typeof allCelulas = [];

      for (const cel of allCelulas) {
        if (cel.leadership_couple_id && supervisorCoupleIds.has(cel.leadership_couple_id)) {
          excludedCells.push(cel);
        } else {
          eligibleCells.push(cel);
        }
      }

      const celulaIds = eligibleCells.map(c => c.id);
      const allCelulaIds = allCelulas.map(c => c.id);

      // 4) Fetch supervisões for health & priority
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

      // 5) Reports for pendency
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

      // Build priority for eligible cells
      const eligibleWithPriority = eligibleCells.map(buildPriority);
      eligibleWithPriority.sort((a, b) => b.priority_weight - a.priority_weight);

      // Build priority for excluded cells (coordinator)
      const excludedWithPriority = excludedCells.map(buildPriority);
      excludedWithPriority.sort((a, b) => b.priority_weight - a.priority_weight);

      // 6) Accepted swaps → override assignments
      const weeks = generateBimestreWeeks(BIMESTRE_START);
      const bimestreEnd = weeks[weeks.length - 1]?.end || BIMESTRE_START;

      const { data: acceptedSwaps } = await supabase
        .from('supervision_swaps')
        .select('*')
        .eq('bimestre_start', BIMESTRE_START)
        .eq('status', 'accepted');

      // Build swap overrides: celula_id → supervisor_id
      const swapOverrides = new Map<string, string>();
      for (const swap of (acceptedSwaps || [])) {
        swapOverrides.set(swap.proposer_celula_id, swap.target_supervisor_id);
        swapOverrides.set(swap.target_celula_id, swap.proposer_supervisor_id);
      }

      // 7) Load-balanced distribution between supervisors
      const supInfos: SupervisorInfo[] = supervisors.map(s => {
        const couple = s.leadership_couple;
        const name = couple
          ? `${couple.spouse1?.name || ''} & ${couple.spouse2?.name || ''}`
          : 'Supervisor';
        return {
          id: s.id,
          name,
          leadership_couple_id: s.leadership_couple_id,
          load: 0,
          celulas_count: 0,
        };
      });

      // Assignments per supervisor
      const assignmentMap: Record<string, CelulaPlanejamento[]> = {};
      for (const s of supInfos) assignmentMap[s.id] = [];

      if (supInfos.length === 1) {
        // Only 1 supervisor, all eligible go to them
        assignmentMap[supInfos[0].id] = [...eligibleWithPriority];
        supInfos[0].load = eligibleWithPriority.reduce((s, c) => s + c.priority_weight, 0);
        supInfos[0].celulas_count = eligibleWithPriority.length;
      } else if (supInfos.length >= 2) {
        // Load-balanced: assign each cell (sorted by priority desc) to supervisor with lowest load
        for (const cel of eligibleWithPriority) {
          // Check swap override
          const overrideSup = swapOverrides.get(cel.celula_id);
          if (overrideSup && assignmentMap[overrideSup]) {
            assignmentMap[overrideSup].push(cel);
            const si = supInfos.find(s => s.id === overrideSup)!;
            si.load += cel.priority_weight;
            si.celulas_count++;
            continue;
          }

          // Find supervisor with least load
          let minSup = supInfos[0];
          for (const s of supInfos) {
            if (s.load < minSup.load) minSup = s;
          }
          assignmentMap[minSup.id].push(cel);
          minSup.load += cel.priority_weight;
          minSup.celulas_count++;
        }
      }

      // 8) Check realizadas
      const { data: bimestreSups } = await supabase
        .from('supervisoes')
        .select('celula_id')
        .in('celula_id', allCelulaIds)
        .gte('data_supervisao', BIMESTRE_START)
        .lte('data_supervisao', bimestreEnd)
        .eq('celula_realizada', true);

      const realizadasSet = new Set((bimestreSups || []).map(s => s.celula_id));

      // 9) Build weekly plans for each supervisor
      const myCells = assignmentMap[supervisorId] || [];
      const minhasSemanas = distributeIntoWeeks(myCells, weeks, supervisorId, realizadasSet);

      // Other supervisor
      let outroSupervisor: PlanejamentoBimestralData['outro_supervisor'] = null;
      const otherSup = supInfos.find(s => s.id !== supervisorId);
      if (otherSup) {
        const otherCells = assignmentMap[otherSup.id] || [];
        const otherSemanas = distributeIntoWeeks(otherCells, weeks, otherSup.id, realizadasSet);
        outroSupervisor = { info: otherSup, semanas: otherSemanas };
      }

      return {
        bimestre_start: BIMESTRE_START,
        bimestre_end: bimestreEnd,
        bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
        supervisors: supInfos,
        current_supervisor_id: supervisorId,
        minhas_semanas: minhasSemanas,
        outro_supervisor: outroSupervisor,
        celulas_coordenador: excludedWithPriority,
        celulas_no_escopo: eligibleWithPriority,
        total_celulas: eligibleWithPriority.length,
        total_semanas: weeks.length,
      };
    },
    enabled: !!supervisorId && !!coordenacaoId,
  });
}

function emptyResult(weeks: { start: string; end: string }[], supervisorId: string, supervisors: any[]): PlanejamentoBimestralData {
  return {
    bimestre_start: BIMESTRE_START,
    bimestre_end: weeks[weeks.length - 1]?.end || BIMESTRE_START,
    bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
    supervisors: [],
    current_supervisor_id: supervisorId,
    minhas_semanas: [],
    outro_supervisor: null,
    celulas_coordenador: [],
    celulas_no_escopo: [],
    total_celulas: 0,
    total_semanas: weeks.length,
  };
}

export { BIMESTRE_START };
