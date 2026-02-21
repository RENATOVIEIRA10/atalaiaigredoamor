/**
 * usePlanejamentoCoordenador.ts
 * 
 * Hook para o coordenador visualizar o planejamento bimestral completo
 * de todos os supervisores + supervisões do coordenador.
 * Reutiliza a lógica do usePlanejamentoBimestral sem alterá-la.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays, format, startOfWeek, isWithinInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CelulaPlanejamento, SemanaPlano, CelulaPlanItem, SupervisorInfo } from './usePlanejamentoBimestral';
import { BIMESTRE_START } from './usePlanejamentoBimestral';

// ── Types ──

export interface CoordPlanejamentoData {
  bimestre_start: string;
  bimestre_end: string;
  bimestre_label: string;
  supervisors: SupervisorInfo[];
  // Plans per supervisor
  plans_by_supervisor: { info: SupervisorInfo; semanas: SemanaPlano[] }[];
  // Cells the coordinator must supervise (anti-self-supervision)
  celulas_coordenador: CelulaPlanejamento[];
  celulas_coordenador_semanas: SemanaPlano[];
  // Coverage
  total_celulas: number;
  total_realizadas: number;
  realizadas_supervisores: number;
  realizadas_coordenador: number;
  pendentes_supervisores: number;
  pendentes_coordenador: number;
  total_semanas: number;
  // Alerts
  alerts: CoordAlert[];
  // Current week items
  visitas_semana_atual: VisitaSemana[];
}

export interface VisitaSemana {
  celula_id: string;
  celula_name: string;
  responsavel: string;
  responsavel_tipo: 'supervisor' | 'coordenador';
  suggested_date: string;
  suggested_day_label: string;
  priority_label: CelulaPlanejamento['priority_label'];
  realizada: boolean;
}

export interface CoordAlert {
  type: 'current_week' | 'coord_week' | 'next_week' | 'bimestre_pending';
  icon: string;
  message: string;
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

  const base = Math.floor(N / W);
  const extra = N % W;
  const assignments: CelulaPlanejamento[][] = weeks.map(() => []);
  let idx = 0;

  for (let w = 0; w < W; w++) {
    const count = Math.min(w < extra ? base + 1 : base, MAX_PER_WEEK);
    for (let j = 0; j < count && idx < N; j++) {
      assignments[w].push(cells[idx++]);
    }
  }
  while (idx < N) {
    for (let w = 0; w < W && idx < N; w++) {
      if (assignments[w].length < MAX_PER_WEEK) {
        assignments[w].push(cells[idx++]);
      }
    }
  }

  return weeks.map((week, wIdx) => {
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
    };
  });
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
  };
}

// ── Hook ──

export function usePlanejamentoCoordenador(coordenacaoId: string) {
  return useQuery({
    queryKey: ['planejamento-coordenador', coordenacaoId],
    queryFn: async (): Promise<CoordPlanejamentoData> => {
      // 1) Fetch supervisors
      const { data: allSupervisors } = await supabase
        .from('supervisores')
        .select('id, profile_id, coordenacao_id, leadership_couple_id, leadership_couple:leadership_couples(id, spouse1_id, spouse2_id, spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name), spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name))')
        .eq('coordenacao_id', coordenacaoId);

      const supervisors = (allSupervisors || []) as any[];

      // 2) Fetch cells
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, name, meeting_day, meeting_time, supervisor_id, coordenacao_id, leadership_couple_id')
        .eq('coordenacao_id', coordenacaoId)
        .eq('is_test_data', false);

      const allCelulas = celulas || [];
      const weeks = generateBimestreWeeks(BIMESTRE_START);
      const bimestreEnd = weeks[weeks.length - 1]?.end || BIMESTRE_START;

      if (allCelulas.length === 0) {
        return emptyCoordResult(weeks);
      }

      // 3) Anti-self-supervision
      const supervisorCoupleIds = new Set(
        supervisors.filter(s => s.leadership_couple_id).map(s => s.leadership_couple_id)
      );
      const excludedCells: typeof allCelulas = [];
      const eligibleCells: typeof allCelulas = [];
      for (const cel of allCelulas) {
        if (cel.leadership_couple_id && supervisorCoupleIds.has(cel.leadership_couple_id)) {
          excludedCells.push(cel);
        } else {
          eligibleCells.push(cel);
        }
      }

      const allCelulaIds = allCelulas.map(c => c.id);

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

      const eligibleWithPriority = eligibleCells.map(buildPriority);
      eligibleWithPriority.sort((a, b) => b.priority_weight - a.priority_weight);
      const excludedWithPriority = excludedCells.map(buildPriority);
      excludedWithPriority.sort((a, b) => b.priority_weight - a.priority_weight);

      // 6) Accepted swaps
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

      // 7) Load-balanced distribution
      const supInfos: SupervisorInfo[] = supervisors.map(s => {
        const couple = s.leadership_couple;
        const name = couple
          ? `${couple.spouse1?.name || ''} & ${couple.spouse2?.name || ''}`
          : 'Supervisor';
        return { id: s.id, name, leadership_couple_id: s.leadership_couple_id, load: 0, celulas_count: 0 };
      });

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

      // 8) Realizadas
      const { data: bimestreSups } = await supabase
        .from('supervisoes')
        .select('celula_id')
        .in('celula_id', allCelulaIds)
        .gte('data_supervisao', BIMESTRE_START)
        .lte('data_supervisao', bimestreEnd)
        .eq('celula_realizada', true);

      const realizadasSet = new Set((bimestreSups || []).map(s => s.celula_id));

      // 9) Build plans per supervisor
      const plansBySupervisor = supInfos.map(si => ({
        info: si,
        semanas: distributeIntoWeeks(assignmentMap[si.id] || [], weeks, si.id, realizadasSet),
      }));

      // 10) Coordinator plan
      const coordSemanas = distributeIntoWeeks(excludedWithPriority, weeks, 'coordenador', realizadasSet);

      // 11) Current week visits
      const currentWeekStart = format(currentWeekMon, 'yyyy-MM-dd');
      const currentWeekEnd = format(addDays(currentWeekMon, 6), 'yyyy-MM-dd');

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
      const coordWeek = coordSemanas.find(s => s.week_start <= currentWeekEnd && s.week_end >= currentWeekStart);
      if (coordWeek) {
        for (const cel of coordWeek.celulas) {
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

      // 12) Coverage
      const allSupCelulas = plansBySupervisor.flatMap(p => p.semanas.flatMap(s => s.celulas));
      const allCoordCelulas = coordSemanas.flatMap(s => s.celulas);
      const realizadasSup = allSupCelulas.filter(c => c.realizada).length;
      const realizadasCoord = allCoordCelulas.filter(c => c.realizada).length;

      // 13) Alerts
      const alerts: CoordAlert[] = [];
      const pendentesThisWeek = visitasSemana.filter(v => !v.realizada);
      if (pendentesThisWeek.length > 0) {
        alerts.push({
          type: 'current_week',
          icon: '📌',
          message: `Você tem ${pendentesThisWeek.length} supervisão(ões) planejada(s) para esta semana`,
        });
      }
      const coordThisWeek = visitasSemana.filter(v => v.responsavel_tipo === 'coordenador' && !v.realizada);
      if (coordThisWeek.length > 0) {
        alerts.push({
          type: 'coord_week',
          icon: '📌',
          message: `Supervisões do coordenador esta semana: ${coordThisWeek.length}`,
        });
      }
      // Next week
      const nextWeekStart = format(addDays(currentWeekMon, 7), 'yyyy-MM-dd');
      const nextWeekEnd = format(addDays(currentWeekMon, 13), 'yyyy-MM-dd');
      let nextWeekCount = 0;
      for (const plan of plansBySupervisor) {
        const nw = plan.semanas.find(s => s.week_start <= nextWeekEnd && s.week_end >= nextWeekStart);
        if (nw) nextWeekCount += nw.celulas.length;
      }
      const coordNext = coordSemanas.find(s => s.week_start <= nextWeekEnd && s.week_end >= nextWeekStart);
      if (coordNext) nextWeekCount += coordNext.celulas.length;
      if (nextWeekCount > 0) {
        alerts.push({
          type: 'next_week',
          icon: '🔔',
          message: `Próxima semana: ${nextWeekCount} supervisão(ões) programada(s)`,
        });
      }
      // Bimestre pending
      const totalAll = allSupCelulas.length + allCoordCelulas.length;
      const totalRealizadas = realizadasSup + realizadasCoord;
      const bimestreProgress = totalAll > 0 ? totalRealizadas / totalAll : 1;
      const weeksElapsed = weeks.findIndex(w => w.start > currentWeekStart);
      const progressExpected = weeksElapsed > 0 ? weeksElapsed / weeks.length : 0;
      if (bimestreProgress < progressExpected * 0.5 && totalAll > 0) {
        alerts.push({
          type: 'bimestre_pending',
          icon: '⚠',
          message: 'Algumas supervisões ainda precisam ser realizadas para fechar o bimestre',
        });
      }

      return {
        bimestre_start: BIMESTRE_START,
        bimestre_end: bimestreEnd,
        bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
        supervisors: supInfos,
        plans_by_supervisor: plansBySupervisor,
        celulas_coordenador: excludedWithPriority,
        celulas_coordenador_semanas: coordSemanas,
        total_celulas: allCelulas.length,
        total_realizadas: totalRealizadas,
        realizadas_supervisores: realizadasSup,
        realizadas_coordenador: realizadasCoord,
        pendentes_supervisores: allSupCelulas.length - realizadasSup,
        pendentes_coordenador: allCoordCelulas.length - realizadasCoord,
        total_semanas: weeks.length,
        alerts,
        visitas_semana_atual: visitasSemana,
      };
    },
    enabled: !!coordenacaoId,
  });
}

function emptyCoordResult(weeks: { start: string; end: string }[]): CoordPlanejamentoData {
  return {
    bimestre_start: BIMESTRE_START,
    bimestre_end: weeks[weeks.length - 1]?.end || BIMESTRE_START,
    bimestre_label: `Bimestre a partir de ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
    supervisors: [],
    plans_by_supervisor: [],
    celulas_coordenador: [],
    celulas_coordenador_semanas: [],
    total_celulas: 0,
    total_realizadas: 0,
    realizadas_supervisores: 0,
    realizadas_coordenador: 0,
    pendentes_supervisores: 0,
    pendentes_coordenador: 0,
    total_semanas: weeks.length,
    alerts: [],
    visitas_semana_atual: [],
  };
}
