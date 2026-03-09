import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';
import { differenceInDays, subDays } from 'date-fns';
import { getCurrentWeekStart } from './useWeeklyReports';

// ─── Types ────────────────────────────────────
export type VitalidadeLevel = 'conectado' | 'atencao_leve' | 'risco_relacional' | 'isolamento';

export interface VitalidadeScore {
  id: string;
  name: string;
  entityName: string; // celula name, rede name, etc.
  entityId: string;
  score: number;
  maxScore: number;
  level: VitalidadeLevel;
  details: string[];
  role: 'membro' | 'lider_celula' | 'supervisor' | 'coordenador' | 'lider_rede' | 'pastor_campo';
  parentEntityId?: string; // for cascading grouping
}

export interface VitalidadeSummary {
  items: VitalidadeScore[];
  total: number;
  conectados: number;
  atencaoLeve: number;
  riscoRelacional: number;
  isolamento: number;
  percentualSaudavel: number;
  byGroup: Record<string, VitalidadeScore[]>;
}

function classify(score: number, max: number): VitalidadeLevel {
  const pct = max > 0 ? (score / max) * 7 : 0;
  if (pct >= 6) return 'conectado';
  if (pct >= 4) return 'atencao_leve';
  if (pct >= 2) return 'risco_relacional';
  return 'isolamento';
}

function classifyRaw(score: number): VitalidadeLevel {
  if (score >= 6) return 'conectado';
  if (score >= 4) return 'atencao_leve';
  if (score >= 2) return 'risco_relacional';
  return 'isolamento';
}

// ─── Member Vitality ──────────────────────────
interface UseVitalidadeMembrosOptions {
  celulaId?: string;
  coordenacaoId?: string;
  redeId?: string;
}

export function useVitalidadeMembros(options: UseVitalidadeMembrosOptions = {}) {
  const { campoId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['vitalidade-membros', campoId, options.celulaId, options.coordenacaoId, options.redeId, ...queryKeyExtra],
    enabled: !!campoId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<VitalidadeSummary> => {
      const today = new Date();
      const oneYearAgo = subDays(today, 365).toISOString();

      let query = supabase
        .from('members')
        .select(`
          id, joined_at, is_discipulado, serve_ministerio,
          batismo, encontro_com_deus, curso_lidere, renovo, encontro_de_casais,
          celula_id, rede_id,
          profile:profiles!members_profile_id_fkey(name),
          celula:celulas!members_celula_id_fkey(name, coordenacao_id)
        `)
        .eq('is_active', true);

      if (campoId) query = query.eq('campo_id', campoId);
      if (options.celulaId) query = query.eq('celula_id', options.celulaId);
      if (options.redeId) query = query.eq('rede_id', options.redeId);

      const { data: members } = await query;
      if (!members) return emptySummary();

      let filtered = members as any[];
      if (options.coordenacaoId) {
        filtered = filtered.filter(m => m.celula?.coordenacao_id === options.coordenacaoId);
      }

      // Check event registrations in the past year
      const memberIds = filtered.map(m => m.id);
      const { data: recentRegs } = memberIds.length > 0
        ? await supabase
            .from('event_registrations')
            .select('membro_id')
            .in('membro_id', memberIds.slice(0, 500))
            .gte('created_at', oneYearAgo)
        : { data: [] };

      const membersWithEvents = new Set((recentRegs || []).map(r => r.membro_id));

      // Check attendance in last 4 weeks
      const fourWeeksAgo = subDays(today, 28).toISOString().split('T')[0];
      const { data: recentAttendances } = memberIds.length > 0
        ? await supabase
            .from('attendances')
            .select('member_id, present')
            .in('member_id', memberIds.slice(0, 500))
            .eq('present', true)
        : { data: [] };

      const membersWithAttendance = new Set((recentAttendances || []).map(a => a.member_id));

      const items: VitalidadeScore[] = filtered.map((m: any) => {
        let score = 0;
        const details: string[] = [];

        // +2 discipulado
        if (m.is_discipulado) { score += 2; details.push('Em discipulado'); }
        // +2 serve
        if (m.serve_ministerio) { score += 2; details.push('Serve em ministério'); }
        // +1 evento recente
        if (membersWithEvents.has(m.id)) { score += 1; details.push('Participou de evento'); }
        // +1 marco espiritual no último ano
        const marcos = [m.batismo, m.encontro_com_deus, m.curso_lidere, m.renovo, m.encontro_de_casais].filter(Boolean).length;
        if (marcos > 0) { score += 1; details.push(`${marcos} marco(s) espiritual(is)`); }
        // +1 presença consistente
        if (membersWithAttendance.has(m.id)) { score += 1; details.push('Presença ativa'); }

        const level = classifyRaw(score);

        return {
          id: m.id,
          name: (m.profile as any)?.name || 'Membro',
          entityName: (m.celula as any)?.name || '',
          entityId: m.celula_id,
          parentEntityId: m.rede_id,
          score,
          maxScore: 7,
          level,
          details,
          role: 'membro' as const,
        };
      });

      return buildSummary(items);
    },
  });
}

// ─── Leader Vitality (Cell Leaders seen by Supervisors/Coordinators) ─────
interface UseVitalidadeLideresOptions {
  coordenacaoId?: string;
  redeId?: string;
}

export function useVitalidadeLideres(options: UseVitalidadeLideresOptions = {}) {
  const { campoId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['vitalidade-lideres', campoId, options.coordenacaoId, options.redeId, ...queryKeyExtra],
    enabled: !!campoId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<VitalidadeSummary> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
      const weekStart = getCurrentWeekStart();

      // Get cells to evaluate their leaders
      let cellQuery = supabase
        .from('celulas')
        .select('id, name, leader_id, coordenacao_id, rede_id, leadership_couple_id')
        .eq('campo_id', campoId!);

      if (options.coordenacaoId) cellQuery = cellQuery.eq('coordenacao_id', options.coordenacaoId);
      if (options.redeId) cellQuery = cellQuery.eq('rede_id', options.redeId);

      const { data: celulas } = await cellQuery;
      if (!celulas?.length) return emptySummary();

      const celulaIds = celulas.map(c => c.id);

      // Get recent reports (last 4 weeks)
      const fourWeeksAgo = subDays(new Date(), 28).toISOString().split('T')[0];
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('celula_id')
        .in('celula_id', celulaIds.slice(0, 200))
        .gte('week_start', fourWeeksAgo);

      const reportCounts = new Map<string, number>();
      (reports || []).forEach(r => reportCounts.set(r.celula_id, (reportCounts.get(r.celula_id) || 0) + 1));

      // Get recent supervisions
      const { data: supervisoes } = await supabase
        .from('supervisoes')
        .select('celula_id')
        .in('celula_id', celulaIds.slice(0, 200))
        .gte('data_supervisao', fourWeeksAgo);

      const supCounts = new Map<string, number>();
      (supervisoes || []).forEach(s => supCounts.set(s.celula_id, (supCounts.get(s.celula_id) || 0) + 1));

      // Members in training per cell
      const { data: trainees } = await supabase
        .from('members')
        .select('celula_id')
        .in('celula_id', celulaIds.slice(0, 200))
        .eq('is_active', true)
        .eq('is_lider_em_treinamento', true);

      const traineeCounts = new Map<string, number>();
      (trainees || []).forEach(t => traineeCounts.set(t.celula_id, (traineeCounts.get(t.celula_id) || 0) + 1));

      // Discipulado members per cell
      const { data: discMembers } = await supabase
        .from('members')
        .select('celula_id')
        .in('celula_id', celulaIds.slice(0, 200))
        .eq('is_active', true)
        .eq('is_discipulado', true);

      const discCounts = new Map<string, number>();
      (discMembers || []).forEach(d => discCounts.set(d.celula_id, (discCounts.get(d.celula_id) || 0) + 1));

      // Event registrations by leaders (approximate via leader_id)
      const leaderIds = celulas.map(c => c.leader_id).filter(Boolean) as string[];
      // We'll use a simple heuristic: if leader has event_registrations
      const { data: leaderEvents } = leaderIds.length > 0
        ? await supabase
            .from('event_registrations')
            .select('created_by_user_id')
            .in('created_by_user_id', leaderIds.slice(0, 200))
            .gte('created_at', subDays(new Date(), 90).toISOString())
        : { data: [] };

      const leadersWithEvents = new Set((leaderEvents || []).map(e => e.created_by_user_id));

      // Get leader names
      const profileIds = leaderIds.filter(Boolean);
      const { data: profiles } = profileIds.length > 0
        ? await supabase.from('profiles').select('id, name').in('id', profileIds.slice(0, 200))
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

      const items: VitalidadeScore[] = celulas.map(cel => {
        let score = 0;
        const details: string[] = [];

        // +2 envia relatórios regularmente (>=3 in 4 weeks)
        const reps = reportCounts.get(cel.id) || 0;
        if (reps >= 3) { score += 2; details.push('Relatórios regulares'); }
        else if (reps >= 1) { score += 1; details.push('Relatórios parciais'); }

        // +2 participa de supervisões (>= 1 in 4 weeks)
        const sups = supCounts.get(cel.id) || 0;
        if (sups >= 1) { score += 2; details.push('Supervisão ativa'); }

        // +1 forma novos líderes
        const trs = traineeCounts.get(cel.id) || 0;
        if (trs > 0) { score += 1; details.push(`${trs} líder(es) em formação`); }

        // +1 acompanha discipulado dos membros
        const discs = discCounts.get(cel.id) || 0;
        if (discs > 0) { score += 1; details.push('Discipulado ativo'); }

        // +1 participa de eventos
        if (cel.leader_id && leadersWithEvents.has(cel.leader_id)) {
          score += 1; details.push('Participação em eventos');
        }

        return {
          id: cel.id,
          name: cel.leader_id ? (profileMap.get(cel.leader_id) || `Líder ${cel.name}`) : `Líder ${cel.name}`,
          entityName: cel.name,
          entityId: cel.coordenacao_id,
          parentEntityId: cel.rede_id,
          score,
          maxScore: 7,
          level: classifyRaw(score),
          details,
          role: 'lider_celula' as const,
        };
      });

      return buildSummary(items);
    },
  });
}

// ─── Helpers ──────────────────────────────────
function emptySummary(): VitalidadeSummary {
  return {
    items: [],
    total: 0,
    conectados: 0,
    atencaoLeve: 0,
    riscoRelacional: 0,
    isolamento: 0,
    percentualSaudavel: 100,
    byGroup: {},
  };
}

function buildSummary(items: VitalidadeScore[]): VitalidadeSummary {
  const conectados = items.filter(i => i.level === 'conectado').length;
  const atencaoLeve = items.filter(i => i.level === 'atencao_leve').length;
  const riscoRelacional = items.filter(i => i.level === 'risco_relacional').length;
  const isolamento = items.filter(i => i.level === 'isolamento').length;

  const byGroup: Record<string, VitalidadeScore[]> = {};
  items.forEach(i => {
    (byGroup[i.entityId] ??= []).push(i);
  });

  return {
    items,
    total: items.length,
    conectados,
    atencaoLeve,
    riscoRelacional,
    isolamento,
    percentualSaudavel: items.length > 0 ? Math.round(((conectados + atencaoLeve) / items.length) * 100) : 100,
    byGroup,
  };
}

export const VITALIDADE_CONFIG: Record<VitalidadeLevel, { label: string; color: string; bgColor: string }> = {
  conectado: { label: 'Conectado', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  atencao_leve: { label: 'Atenção leve', color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  risco_relacional: { label: 'Risco relacional', color: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/30' },
  isolamento: { label: 'Isolamento', color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/30' },
};
