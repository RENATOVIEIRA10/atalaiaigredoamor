import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, parseISO, addDays, startOfWeek } from 'date-fns';
import { useCampoFilter } from './useCampoFilter';

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

// Stats gerais
export function usePastoralStats() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-stats', campoId],
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

// Membros ausentes
export function useAbsentMembers() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-absent-members', campoId],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);
      const ninetyDaysAgo = subDays(now, 90);

      let membersQuery = supabase
        .from('members')
        .select(`
          id,
          celula_id,
          profile:profiles!members_profile_id_fkey(name, avatar_url),
          celula:celulas!members_celula_id_fkey(name)
        `)
        .eq('is_active', true);
      if (campoId) membersQuery = membersQuery.eq('campo_id', campoId);

      const { data: members } = await membersQuery;
      if (!members || members.length === 0) return { thirty: 0, sixty: 0, ninety: 0 };

      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, date')
        .gte('date', format(ninetyDaysAgo, 'yyyy-MM-dd'));

      if (!meetings || meetings.length === 0) return { thirty: 0, sixty: 0, ninety: 0 };

      const meetingIds = meetings.map(m => m.id);
      const { data: attendances } = await supabase
        .from('attendances')
        .select('member_id, meeting_id, present')
        .in('meeting_id', meetingIds)
        .eq('present', true);

      const memberLastAttendance = new Map<string, string>();
      for (const att of attendances || []) {
        const meeting = meetings.find(m => m.id === att.meeting_id);
        if (meeting) {
          const current = memberLastAttendance.get(att.member_id);
          if (!current || meeting.date > current) {
            memberLastAttendance.set(att.member_id, meeting.date);
          }
        }
      }

      let thirty = 0, sixty = 0, ninety = 0;
      const thirtyStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
      const sixtyStr = format(sixtyDaysAgo, 'yyyy-MM-dd');
      const ninetyStr = format(ninetyDaysAgo, 'yyyy-MM-dd');

      for (const member of members) {
        const lastDate = memberLastAttendance.get(member.id);
        if (!lastDate || lastDate < ninetyStr) ninety++;
        else if (lastDate < sixtyStr) sixty++;
        else if (lastDate < thirtyStr) thirty++;
      }

      return { thirty, sixty, ninety };
    },
  });
}

// Membros sem avanço espiritual
export interface StagnantMember {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
  joined_at: string;
}

export function useSpiritualStagnation() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-spiritual-stagnation', campoId],
    queryFn: async () => {
      const twoYearsAgo = subDays(new Date(), 730);
      
      let query = supabase
        .from('members')
        .select(`
          id,
          joined_at,
          encontro_com_deus,
          batismo,
          curso_lidere,
          is_lider_em_treinamento,
          profile:profiles!members_profile_id_fkey(name, avatar_url),
          celula:celulas!members_celula_id_fkey(name)
        `)
        .eq('is_active', true)
        .lt('joined_at', twoYearsAgo.toISOString());
      
      if (campoId) query = query.eq('campo_id', campoId);

      const { data: members } = await query;
      if (!members) return { count: 0, yearsThreshold: 2, members: [] as StagnantMember[] };

      const stagnant = members.filter(m => 
        !m.encontro_com_deus && !m.batismo && !m.curso_lidere
      );

      const stagnantMembers: StagnantMember[] = stagnant.map(m => ({
        id: m.id,
        name: (m.profile as any)?.name || 'Sem nome',
        avatar_url: (m.profile as any)?.avatar_url || null,
        celula_name: (m.celula as any)?.name || 'Sem célula',
        joined_at: m.joined_at,
      }));

      return { count: stagnant.length, yearsThreshold: 2, members: stagnantMembers };
    },
  });
}

// Aniversários da semana
export function useWeeklyBirthdays() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-weekly-birthdays', campoId],
    queryFn: async () => {
      const today = new Date();

      // Get members scoped by campo, with profile birth_date
      let membersQuery = supabase
        .from('members')
        .select(`
          profile_id,
          celula:celulas!members_celula_id_fkey(name),
          profile:profiles!members_profile_id_fkey(id, name, avatar_url, birth_date)
        `)
        .eq('is_active', true);
      if (campoId) membersQuery = membersQuery.eq('campo_id', campoId);

      const { data: members } = await membersQuery;
      if (!members) return [];

      // Get leaders scoped by campo
      let celulasQuery = supabase.from('celulas').select('leader_id, name').eq('is_test_data', false);
      if (campoId) celulasQuery = celulasQuery.eq('campo_id', campoId);
      const { data: celulas } = await celulasQuery;
      const leaderSet = new Set((celulas || []).map(c => c.leader_id).filter(Boolean));

      const todayMonthDay = format(today, 'MM-dd');
      const birthdays: PastoralBirthday[] = [];

      for (const m of members) {
        const p = m.profile as any;
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
            celula_name: (m.celula as any)?.name || '',
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

// Radar Pastoral - Alertas
export function usePastoralAlerts() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-alerts', campoId],
    queryFn: async () => {
      const alerts: PastoralAlert[] = [];
      const now = new Date();
      const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
      const lastMonday = subDays(currentMonday, 7);
      const currentSaturday = addDays(currentMonday, 5);
      const lastSaturday = addDays(lastMonday, 5);

      // 1. Células sem relatório na semana operacional (Seg→Sáb)
      let celulasQ = supabase.from('celulas').select('id, name, coordenacao_id').eq('is_test_data', false);
      if (campoId) celulasQ = celulasQ.eq('campo_id', campoId);
      const { data: allCelulas } = await celulasQ;

      if (!allCelulas || allCelulas.length === 0) return alerts;

      const celulaIds = allCelulas.map(c => c.id);
      
      const { data: weekReports } = await supabase
        .from('weekly_reports')
        .select('celula_id')
        .in('celula_id', celulaIds)
        .eq('is_test_data', false)
        .or(
          `and(meeting_date.gte.${format(currentMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(currentSaturday, 'yyyy-MM-dd')}),` +
          `and(meeting_date.is.null,week_start.gte.${format(currentMonday, 'yyyy-MM-dd')},week_start.lte.${format(currentSaturday, 'yyyy-MM-dd')})`
        );

      const reportedIds = new Set((weekReports || []).map(r => r.celula_id));
      const missingCelulas = allCelulas.filter(c => !reportedIds.has(c.id));
      
      if (missingCelulas.length > 0) {
        alerts.push({
          type: 'missing_report',
          severity: missingCelulas.length > 3 ? 'critical' : 'warning',
          title: `${missingCelulas.length} célula(s) com relatório pendente`,
          description: `As células ${missingCelulas.slice(0, 3).map(c => c.name).join(', ')}${missingCelulas.length > 3 ? ` e mais ${missingCelulas.length - 3}` : ''} ainda não enviaram relatório esta semana.`,
          entity_name: 'Relatórios',
        });
      }

      // 2. Coordenações com queda - compare last 2 weeks (scoped)
      let coordQ = supabase.from('coordenacoes').select('id, name');
      if (campoId) coordQ = coordQ.eq('campo_id', campoId);
      const { data: coordenacoes } = await coordQ;
      
      for (const coord of coordenacoes || []) {
        const coordCelulas = allCelulas.filter(c => c.coordenacao_id === coord.id);
        if (coordCelulas.length === 0) continue;
        const coordCelulaIds = coordCelulas.map(c => c.id);

        const [thisWeekRes, lastWeekRes] = await Promise.all([
          supabase
            .from('weekly_reports')
            .select('members_present')
            .in('celula_id', coordCelulaIds)
            .eq('is_test_data', false)
            .or(
              `and(meeting_date.gte.${format(currentMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(currentSaturday, 'yyyy-MM-dd')}),` +
              `and(meeting_date.is.null,week_start.gte.${format(currentMonday, 'yyyy-MM-dd')},week_start.lte.${format(currentSaturday, 'yyyy-MM-dd')})`
            ),
          supabase
            .from('weekly_reports')
            .select('members_present')
            .in('celula_id', coordCelulaIds)
            .eq('is_test_data', false)
            .or(
              `and(meeting_date.gte.${format(lastMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(lastSaturday, 'yyyy-MM-dd')}),` +
              `and(meeting_date.is.null,week_start.gte.${format(lastMonday, 'yyyy-MM-dd')},week_start.lte.${format(lastSaturday, 'yyyy-MM-dd')})`
            ),
        ]);

        const thisTotal = (thisWeekRes.data || []).reduce((s, r) => s + r.members_present, 0);
        const lastTotal = (lastWeekRes.data || []).reduce((s, r) => s + r.members_present, 0);

        if (lastTotal > 0 && thisTotal < lastTotal * 0.7) {
          alerts.push({
            type: 'declining_attendance',
            severity: 'warning',
            title: `Queda na coordenação ${coord.name}`,
            description: `A coordenação ${coord.name} apresenta queda de constância nas últimas semanas (de ${lastTotal} para ${thisTotal} membros).`,
            entity_name: coord.name,
          });
        }
      }

      return alerts;
    },
  });
}

// Celebrações
export function usePastoralCelebrations() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-celebrations', campoId],
    queryFn: async () => {
      const celebrations: CelebrationItem[] = [];
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      // Multiplicações recentes (scoped)
      let multQ = supabase
        .from('multiplicacoes')
        .select(`
          *,
          celula_origem:celulas!multiplicacoes_celula_origem_id_fkey(name),
          celula_destino:celulas!multiplicacoes_celula_destino_id_fkey(name)
        `)
        .gte('data_multiplicacao', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('data_multiplicacao', { ascending: false });
      if (campoId) multQ = multQ.eq('campo_id', campoId);

      const { data: multiplicacoes } = await multQ;

      for (const mult of multiplicacoes || []) {
        celebrations.push({
          type: 'multiplicacao',
          title: 'Nova Multiplicação! 🎉',
          description: `A célula ${(mult.celula_origem as any)?.name} multiplicou, dando origem à célula ${(mult.celula_destino as any)?.name}.`,
          date: mult.data_multiplicacao,
        });
      }

      // Novos líderes em treinamento (scoped)
      let leadersQ = supabase
        .from('members')
        .select(`
          id,
          profile:profiles!members_profile_id_fkey(name),
          celula:celulas!members_celula_id_fkey(name)
        `)
        .eq('is_active', true)
        .eq('is_lider_em_treinamento', true);
      if (campoId) leadersQ = leadersQ.eq('campo_id', campoId);

      const { data: newLeaders } = await leadersQ;

      if (newLeaders && newLeaders.length > 0) {
        celebrations.push({
          type: 'new_leader',
          title: `${newLeaders.length} líder(es) em treinamento`,
          description: `A rede conta com ${newLeaders.length} líder(es) em formação, preparando-se para multiplicar.`,
          date: format(now, 'yyyy-MM-dd'),
        });
      }

      // Células constantes (scoped)
      let celQ = supabase.from('celulas').select('id, name').eq('is_test_data', false);
      if (campoId) celQ = celQ.eq('campo_id', campoId);
      const { data: allCelulas } = await celQ;

      if (allCelulas && allCelulas.length > 0) {
        const celulaIds = allCelulas.map(c => c.id);
        const { data: monthReports } = await supabase
          .from('weekly_reports')
          .select('celula_id, week_start')
          .in('celula_id', celulaIds)
          .gte('week_start', format(thirtyDaysAgo, 'yyyy-MM-dd'));

        const reportsByCell = new Map<string, Set<string>>();
        for (const r of monthReports || []) {
          if (!reportsByCell.has(r.celula_id)) reportsByCell.set(r.celula_id, new Set());
          reportsByCell.get(r.celula_id)!.add(r.week_start);
        }

        const consistentCells = allCelulas.filter(c => {
          const weeks = reportsByCell.get(c.id);
          return weeks && weeks.size >= 4;
        });

        if (consistentCells.length > 0) {
          celebrations.push({
            type: 'consistent_cell',
            title: `${consistentCells.length} célula(s) exemplares`,
            description: `As células ${consistentCells.slice(0, 3).map(c => c.name).join(', ')}${consistentCells.length > 3 ? ` e mais ${consistentCells.length - 3}` : ''} mantêm constância exemplar nos relatórios.`,
            date: format(now, 'yyyy-MM-dd'),
          });
        }
      }

      return celebrations;
    },
  });
}

// Crescimento por rede (scoped by campo)
export function useRedeGrowthData() {
  const campoId = useCampoFilter();
  return useQuery({
    queryKey: ['pastoral-rede-growth', campoId],
    queryFn: async () => {
      let redesQ = supabase.from('redes').select('id, name');
      if (campoId) redesQ = redesQ.eq('campo_id', campoId);
      const { data: redes } = await redesQ;
      if (!redes || redes.length === 0) return [];

      const redeIds = redes.map(r => r.id);

      let coordQ = supabase.from('coordenacoes').select('id, rede_id').in('rede_id', redeIds);
      let celQ = supabase.from('celulas').select('id, coordenacao_id').eq('is_test_data', false);
      let memQ = supabase.from('members').select('id, celula_id').eq('is_active', true);

      if (campoId) {
        coordQ = coordQ.eq('campo_id', campoId);
        celQ = celQ.eq('campo_id', campoId);
        memQ = memQ.eq('campo_id', campoId);
      }

      const sixMonthsAgo = subDays(new Date(), 180);

      const [coordRes, celRes, memRes] = await Promise.all([coordQ, celQ, memQ]);
      const coordenacoes = coordRes.data || [];
      const celulas = celRes.data || [];
      const members = memRes.data || [];

      // Only fetch reports for cells in scope
      const allCelulaIds = celulas.map(c => c.id);
      let reportsData: any[] = [];
      if (allCelulaIds.length > 0) {
        const { data } = await supabase
          .from('weekly_reports')
          .select('celula_id, members_present')
          .in('celula_id', allCelulaIds)
          .gte('week_start', format(sixMonthsAgo, 'yyyy-MM-dd'));
        reportsData = data || [];
      }

      const result: RedeGrowth[] = [];

      for (const rede of redes) {
        const redeCoords = coordenacoes.filter(c => c.rede_id === rede.id);
        const coordIds = redeCoords.map(c => c.id);
        const redeCelulas = celulas.filter(c => coordIds.includes(c.coordenacao_id));
        const celulaIds = redeCelulas.map(c => c.id);
        const redeMembers = members.filter(m => celulaIds.includes(m.celula_id));
        const redeReports = reportsData.filter(r => celulaIds.includes(r.celula_id));
        const avgAttendance = redeReports.length > 0
          ? Math.round(redeReports.reduce((s, r) => s + r.members_present, 0) / redeReports.length)
          : 0;

        result.push({
          rede_name: rede.name,
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
