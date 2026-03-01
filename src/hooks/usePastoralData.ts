import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, parseISO, addDays, startOfWeek } from 'date-fns';
import { useDemoScope } from './useDemoScope';
import { fetchAllRows, batchedInQuery } from '@/lib/supabasePagination';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PastoralStats {
  totalCelulas: number;
  totalMembers: number;
  celulasEmRisco: number;
  celulasEmAcompanhamento: number;
  multiplicacoes90dias: number;
}

export interface AbsentMember {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
  days_absent: number;
}

export interface PastoralBirthday {
  id: string;
  name: string;
  avatar_url: string | null;
  birth_date: string;
  celula_name: string;
  role: string;
  is_today: boolean;
}

export interface PastoralAlert {
  type: 'missing_report' | 'declining_attendance' | 'stagnant_growth' | 'supervisor_overload';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  entity_name: string;
}

export interface CelebrationItem {
  type: 'multiplicacao' | 'new_leader' | 'consistent_cell';
  title: string;
  description: string;
  date: string;
}

export interface RedeGrowth {
  rede_name: string;
  celulas_count: number;
  members_count: number;
  reports_count: number;
  avg_attendance: number;
}

export interface StagnantMember {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
  joined_at: string;
}

// ─── Stats gerais (uses count queries - no pagination needed) ────────────────

export function usePastoralStats() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-stats', campoId ?? 'global'],
    queryFn: async () => {
      const now = new Date();
      const ninetyDaysAgo = subDays(now, 90);

      let celQ = supabase.from('celulas').select('id', { count: 'exact', head: true }).eq('is_test_data', false);
      let memQ = supabase.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true);
      let mulQ = supabase.from('multiplicacoes').select('id', { count: 'exact', head: true }).gte('data_multiplicacao', format(ninetyDaysAgo, 'yyyy-MM-dd'));

      if (campoId) {
        celQ = celQ.eq('campo_id', campoId);
        memQ = memQ.eq('campo_id', campoId);
        mulQ = mulQ.eq('campo_id', campoId);
      }

      const [celulasRes, membersRes, multRes] = await Promise.all([celQ, memQ, mulQ]);

      return {
        totalCelulas: celulasRes.count || 0,
        totalMembers: membersRes.count || 0,
        celulasEmRisco: 0,
        celulasEmAcompanhamento: 0,
        multiplicacoes90dias: multRes.count || 0,
      } as PastoralStats;
    },
  });
}

// ─── Membros ausentes (paginated) ────────────────────────────────────────────

export function useAbsentMembers() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-absent-members', campoId ?? 'global'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);
      const ninetyDaysAgo = subDays(now, 90);

      const members = await fetchAllRows(
        'members',
        'id, celula_id, profile:profiles!members_profile_id_fkey(name, avatar_url), celula:celulas!members_celula_id_fkey(name)',
        (q: any) => {
          q = q.eq('is_active', true);
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );

      if (members.length === 0) return { thirty: 0, sixty: 0, ninety: 0 };

      // Get meetings for last 90 days — paginated
      const meetings = await fetchAllRows(
        'meetings',
        'id, date',
        (q: any) => q.gte('date', format(ninetyDaysAgo, 'yyyy-MM-dd'))
      );

      if (meetings.length === 0) return { thirty: 0, sixty: 0, ninety: 0 };

      const meetingIds = meetings.map((m: any) => m.id);

      const attendances = await batchedInQuery(
        'attendances',
        'member_id, meeting_id, present',
        'meeting_id',
        meetingIds,
        (q: any) => q.eq('present', true)
      );

      const memberLastAttendance = new Map<string, string>();
      for (const att of attendances) {
        const meeting = meetings.find((m: any) => m.id === (att as any).meeting_id);
        if (meeting) {
          const current = memberLastAttendance.get((att as any).member_id);
          if (!current || (meeting as any).date > current) {
            memberLastAttendance.set((att as any).member_id, (meeting as any).date);
          }
        }
      }

      let thirty = 0, sixty = 0, ninety = 0;
      const thirtyStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
      const sixtyStr = format(sixtyDaysAgo, 'yyyy-MM-dd');
      const ninetyStr = format(ninetyDaysAgo, 'yyyy-MM-dd');

      for (const member of members) {
        const lastDate = memberLastAttendance.get((member as any).id);
        if (!lastDate || lastDate < ninetyStr) ninety++;
        else if (lastDate < sixtyStr) sixty++;
        else if (lastDate < thirtyStr) thirty++;
      }

      return { thirty, sixty, ninety };
    },
  });
}

// ─── Estagnação espiritual (paginated) ───────────────────────────────────────

export function useSpiritualStagnation() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-spiritual-stagnation', campoId ?? 'global'],
    queryFn: async () => {
      const twoYearsAgo = subDays(new Date(), 730);
      
      const members = await fetchAllRows(
        'members',
        'id, joined_at, encontro_com_deus, batismo, curso_lidere, is_lider_em_treinamento, profile:profiles!members_profile_id_fkey(name, avatar_url), celula:celulas!members_celula_id_fkey(name)',
        (q: any) => {
          q = q.eq('is_active', true).lt('joined_at', twoYearsAgo.toISOString());
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );

      const stagnant = members.filter((m: any) => 
        !m.encontro_com_deus && !m.batismo && !m.curso_lidere
      );

      const stagnantMembers: StagnantMember[] = stagnant.map((m: any) => ({
        id: m.id,
        name: m.profile?.name || 'Sem nome',
        avatar_url: m.profile?.avatar_url || null,
        celula_name: m.celula?.name || 'Sem célula',
        joined_at: m.joined_at,
      }));

      return { count: stagnant.length, yearsThreshold: 2, members: stagnantMembers };
    },
  });
}

// ─── Aniversários da semana (paginated) ──────────────────────────────────────

export function useWeeklyBirthdays() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-weekly-birthdays', campoId ?? 'global'],
    queryFn: async () => {
      const today = new Date();

      const members = await fetchAllRows(
        'members',
        'profile_id, celula:celulas!members_celula_id_fkey(name), profile:profiles!members_profile_id_fkey(id, name, avatar_url, birth_date)',
        (q: any) => {
          q = q.eq('is_active', true);
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );

      // Get leaders scoped by campo (paginated)
      const celulas = await fetchAllRows(
        'celulas',
        'leader_id, name',
        (q: any) => {
          q = q.eq('is_test_data', false);
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );
      const leaderSet = new Set(celulas.map((c: any) => c.leader_id).filter(Boolean));

      const todayMonthDay = format(today, 'MM-dd');
      const birthdays: PastoralBirthday[] = [];

      for (const m of members) {
        const p = (m as any).profile;
        if (!p?.birth_date) continue;
        const birthMonthDay = format(parseISO(p.birth_date), 'MM-dd');

        let isInWeek = false;
        for (let d = 0; d <= 6; d++) {
          if (format(addDays(today, d), 'MM-dd') === birthMonthDay) {
            isInWeek = true;
            break;
          }
        }

        if (isInWeek) {
          const isLeader = leaderSet.has(p.id);
          birthdays.push({
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url,
            birth_date: p.birth_date,
            celula_name: (m as any).celula?.name || '',
            role: isLeader ? 'Líder' : 'Membro',
            is_today: birthMonthDay === todayMonthDay,
          });
        }
      }

      return birthdays.sort((a, b) => {
        if (a.is_today && !b.is_today) return -1;
        if (!a.is_today && b.is_today) return 1;
        return a.name.localeCompare(b.name);
      });
    },
  });
}

// ─── Radar Pastoral - Alertas (paginated) ────────────────────────────────────

export function usePastoralAlerts() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-alerts', campoId ?? 'global'],
    queryFn: async () => {
      const alerts: PastoralAlert[] = [];
      const now = new Date();
      const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
      const lastMonday = subDays(currentMonday, 7);
      const currentSaturday = addDays(currentMonday, 5);
      const lastSaturday = addDays(lastMonday, 5);

      // 1. Células sem relatório na semana operacional (paginated)
      const allCelulas = await fetchAllRows(
        'celulas',
        'id, name, coordenacao_id',
        (q: any) => {
          q = q.eq('is_test_data', false);
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );

      if (allCelulas.length === 0) return alerts;

      const celulaIds = allCelulas.map((c: any) => c.id);
      
      const weekReports = await batchedInQuery(
        'weekly_reports',
        'celula_id',
        'celula_id',
        celulaIds,
        (q: any) => q.eq('is_test_data', false).or(
          `and(meeting_date.gte.${format(currentMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(currentSaturday, 'yyyy-MM-dd')}),` +
          `and(meeting_date.is.null,week_start.gte.${format(currentMonday, 'yyyy-MM-dd')},week_start.lte.${format(currentSaturday, 'yyyy-MM-dd')})`
        )
      );

      const reportedIds = new Set(weekReports.map((r: any) => r.celula_id));
      const missingCelulas = allCelulas.filter((c: any) => !reportedIds.has(c.id));
      
      if (missingCelulas.length > 0) {
        alerts.push({
          type: 'missing_report',
          severity: missingCelulas.length > 3 ? 'critical' : 'warning',
          title: `${missingCelulas.length} célula(s) com relatório pendente`,
          description: `As células ${missingCelulas.slice(0, 3).map((c: any) => c.name).join(', ')}${missingCelulas.length > 3 ? ` e mais ${missingCelulas.length - 3}` : ''} ainda não enviaram relatório esta semana.`,
          entity_name: 'Relatórios',
        });
      }

      // 2. Coordenações com queda (paginated)
      const coordenacoes = await fetchAllRows(
        'coordenacoes',
        'id, name',
        (q: any) => campoId ? q.eq('campo_id', campoId) : q
      );
      
      for (const coord of coordenacoes) {
        const coordCelulas = allCelulas.filter((c: any) => c.coordenacao_id === (coord as any).id);
        if (coordCelulas.length === 0) continue;
        const coordCelulaIds = coordCelulas.map((c: any) => c.id);

        const [thisWeekRes, lastWeekRes] = await Promise.all([
          batchedInQuery(
            'weekly_reports',
            'members_present',
            'celula_id',
            coordCelulaIds,
            (q: any) => q.eq('is_test_data', false).or(
              `and(meeting_date.gte.${format(currentMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(currentSaturday, 'yyyy-MM-dd')}),` +
              `and(meeting_date.is.null,week_start.gte.${format(currentMonday, 'yyyy-MM-dd')},week_start.lte.${format(currentSaturday, 'yyyy-MM-dd')})`
            )
          ),
          batchedInQuery(
            'weekly_reports',
            'members_present',
            'celula_id',
            coordCelulaIds,
            (q: any) => q.eq('is_test_data', false).or(
              `and(meeting_date.gte.${format(lastMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(lastSaturday, 'yyyy-MM-dd')}),` +
              `and(meeting_date.is.null,week_start.gte.${format(lastMonday, 'yyyy-MM-dd')},week_start.lte.${format(lastSaturday, 'yyyy-MM-dd')})`
            )
          ),
        ]);

        const thisTotal = thisWeekRes.reduce((s: number, r: any) => s + r.members_present, 0);
        const lastTotal = lastWeekRes.reduce((s: number, r: any) => s + r.members_present, 0);

        if (lastTotal > 0 && thisTotal < lastTotal * 0.7) {
          alerts.push({
            type: 'declining_attendance',
            severity: 'warning',
            title: `Queda na coordenação ${(coord as any).name}`,
            description: `A coordenação ${(coord as any).name} apresenta queda de constância nas últimas semanas (de ${lastTotal} para ${thisTotal} membros).`,
            entity_name: (coord as any).name,
          });
        }
      }

      return alerts;
    },
  });
}

// ─── Celebrações (paginated) ─────────────────────────────────────────────────

export function usePastoralCelebrations() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-celebrations', campoId ?? 'global'],
    queryFn: async () => {
      const celebrations: CelebrationItem[] = [];
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      // Multiplicações recentes (paginated)
      const multiplicacoes = await fetchAllRows(
        'multiplicacoes',
        '*, celula_origem:celulas!multiplicacoes_celula_origem_id_fkey(name), celula_destino:celulas!multiplicacoes_celula_destino_id_fkey(name)',
        (q: any) => {
          q = q.gte('data_multiplicacao', format(thirtyDaysAgo, 'yyyy-MM-dd')).order('data_multiplicacao', { ascending: false });
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );

      for (const mult of multiplicacoes) {
        celebrations.push({
          type: 'multiplicacao',
          title: 'Nova Multiplicação! 🎉',
          description: `A célula ${(mult as any).celula_origem?.name} multiplicou, dando origem à célula ${(mult as any).celula_destino?.name}.`,
          date: (mult as any).data_multiplicacao,
        });
      }

      // Novos líderes em treinamento (count query)
      let leadersQ = supabase.from('members').select('id', { count: 'exact', head: true })
        .eq('is_active', true).eq('is_lider_em_treinamento', true);
      if (campoId) leadersQ = leadersQ.eq('campo_id', campoId);
      const { count: newLeadersCount } = await leadersQ;

      if (newLeadersCount && newLeadersCount > 0) {
        celebrations.push({
          type: 'new_leader',
          title: `${newLeadersCount} líder(es) em treinamento`,
          description: `A rede conta com ${newLeadersCount} líder(es) em formação, preparando-se para multiplicar.`,
          date: format(now, 'yyyy-MM-dd'),
        });
      }

      // Células constantes (paginated)
      const allCelulas = await fetchAllRows(
        'celulas',
        'id, name',
        (q: any) => {
          q = q.eq('is_test_data', false);
          if (campoId) q = q.eq('campo_id', campoId);
          return q;
        }
      );

      if (allCelulas.length > 0) {
        const celulaIds = allCelulas.map((c: any) => c.id);
        const monthReports = await batchedInQuery(
          'weekly_reports',
          'celula_id, week_start',
          'celula_id',
          celulaIds,
          (q: any) => q.gte('week_start', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        );

        const reportsByCell = new Map<string, Set<string>>();
        for (const r of monthReports) {
          const rid = (r as any).celula_id;
          if (!reportsByCell.has(rid)) reportsByCell.set(rid, new Set());
          reportsByCell.get(rid)!.add((r as any).week_start);
        }

        const consistentCells = allCelulas.filter((c: any) => {
          const weeks = reportsByCell.get(c.id);
          return weeks && weeks.size >= 4;
        });

        if (consistentCells.length > 0) {
          celebrations.push({
            type: 'consistent_cell',
            title: `${consistentCells.length} célula(s) exemplares`,
            description: `As células ${consistentCells.slice(0, 3).map((c: any) => c.name).join(', ')}${consistentCells.length > 3 ? ` e mais ${consistentCells.length - 3}` : ''} mantêm constância exemplar nos relatórios.`,
            date: format(now, 'yyyy-MM-dd'),
          });
        }
      }

      return celebrations;
    },
  });
}

// ─── Crescimento por rede (paginated) ────────────────────────────────────────

export function useRedeGrowthData() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['pastoral-rede-growth', campoId ?? 'global'],
    queryFn: async () => {
      const redes = await fetchAllRows(
        'redes',
        'id, name',
        (q: any) => campoId ? q.eq('campo_id', campoId) : q
      );
      if (redes.length === 0) return [];

      const redeIds = redes.map((r: any) => r.id);

      const sixMonthsAgo = subDays(new Date(), 180);

      const [coordenacoes, celulas, members] = await Promise.all([
        batchedInQuery('coordenacoes', 'id, rede_id', 'rede_id', redeIds,
          (q: any) => campoId ? q.eq('campo_id', campoId) : q),
        fetchAllRows('celulas', 'id, coordenacao_id',
          (q: any) => { q = q.eq('is_test_data', false); if (campoId) q = q.eq('campo_id', campoId); return q; }),
        fetchAllRows('members', 'id, celula_id',
          (q: any) => { q = q.eq('is_active', true); if (campoId) q = q.eq('campo_id', campoId); return q; }),
      ]);

      const allCelulaIds = celulas.map((c: any) => c.id);
      const reportsData = allCelulaIds.length > 0
        ? await batchedInQuery(
            'weekly_reports',
            'celula_id, members_present',
            'celula_id',
            allCelulaIds,
            (q: any) => q.gte('week_start', format(sixMonthsAgo, 'yyyy-MM-dd'))
          )
        : [];

      const result: RedeGrowth[] = [];

      for (const rede of redes) {
        const redeCoords = coordenacoes.filter((c: any) => c.rede_id === (rede as any).id);
        const coordIds = redeCoords.map((c: any) => c.id);
        const redeCelulas = celulas.filter((c: any) => coordIds.includes(c.coordenacao_id));
        const celulaIds = redeCelulas.map((c: any) => c.id);
        const redeMembers = members.filter((m: any) => celulaIds.includes(m.celula_id));
        const redeReports = reportsData.filter((r: any) => celulaIds.includes(r.celula_id));
        const avgAttendance = redeReports.length > 0
          ? Math.round(redeReports.reduce((s: number, r: any) => s + r.members_present, 0) / redeReports.length)
          : 0;

        result.push({
          rede_name: (rede as any).name,
          celulas_count: redeCelulas.length,
          members_count: redeMembers.length,
          reports_count: redeReports.length,
          avg_attendance: avgAttendance,
        });
      }

      return result;
    },
  });
}
