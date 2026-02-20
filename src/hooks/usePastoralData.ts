import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';

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
  return useQuery({
    queryKey: ['pastoral-stats'],
    queryFn: async () => {
      const now = new Date();
      const ninetyDaysAgo = subDays(now, 90);
      const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
      const currentSaturday = addDays(currentMonday, 5);

      const [celulasRes, membersRes, multRes] = await Promise.all([
        supabase.from('celulas').select('id', { count: 'exact', head: true }).eq('is_test_data', false),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('multiplicacoes').select('id', { count: 'exact', head: true }).gte('data_multiplicacao', format(ninetyDaysAgo, 'yyyy-MM-dd')),
      ]);

      return {
        totalCelulas: celulasRes.count || 0,
        totalMembers: membersRes.count || 0,
        // These are now derived from usePulsoEngine in the dashboard
        celulasEmRisco: 0,
        celulasEmAcompanhamento: 0,
        multiplicacoes90dias: multRes.count || 0,
      } as PastoralStats;
    },
  });
}

// Membros ausentes
export function useAbsentMembers() {
  return useQuery({
    queryKey: ['pastoral-absent-members'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);
      const ninetyDaysAgo = subDays(now, 90);

      // Get all active members with their last attendance
      const { data: members } = await supabase
        .from('members')
        .select(`
          id,
          celula_id,
          profile:profiles!members_profile_id_fkey(name, avatar_url),
          celula:celulas!members_celula_id_fkey(name)
        `)
        .eq('is_active', true);

      if (!members || members.length === 0) return { thirty: 0, sixty: 0, ninety: 0 };

      // Get recent attendances
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
  return useQuery({
    queryKey: ['pastoral-spiritual-stagnation'],
    queryFn: async () => {
      const twoYearsAgo = subDays(new Date(), 730);
      
      const { data: members } = await supabase
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

      if (!members) return { count: 0, yearsThreshold: 2, members: [] as StagnantMember[] };

      // Members with 2+ years who haven't completed basic milestones
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
  return useQuery({
    queryKey: ['pastoral-weekly-birthdays'],
    queryFn: async () => {
      const today = new Date();
      const weekEnd = addDays(today, 6);

      // Get all profiles with birth dates
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, birth_date')
        .not('birth_date', 'is', null);

      if (!profiles) return [];

      // Get members to find their cells
      const { data: members } = await supabase
        .from('members')
        .select('profile_id, celula:celulas!members_celula_id_fkey(name)')
        .eq('is_active', true);

      const memberMap = new Map((members || []).map(m => [m.profile_id, (m.celula as any)?.name || '']));

      // Get leaders
      const { data: celulas } = await supabase
        .from('celulas')
        .select('leader_id, name');
      const leaderMap = new Map((celulas || []).map(c => [c.leader_id, c.name]));

      const todayMonthDay = format(today, 'MM-dd');
      const birthdays: PastoralBirthday[] = [];

      for (const profile of profiles) {
        if (!profile.birth_date) continue;
        const birthDate = parseISO(profile.birth_date);
        const birthMonthDay = format(birthDate, 'MM-dd');

        // Check if birthday is within this week
        let isInWeek = false;
        for (let d = 0; d <= 6; d++) {
          const checkDay = addDays(today, d);
          if (format(checkDay, 'MM-dd') === birthMonthDay) {
            isInWeek = true;
            break;
          }
        }

        if (isInWeek) {
          const isLeader = leaderMap.has(profile.id);
          const celulaName = isLeader ? leaderMap.get(profile.id) || '' : memberMap.get(profile.id) || '';
          
          birthdays.push({
            id: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url,
            birth_date: profile.birth_date,
            celula_name: celulaName,
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
  return useQuery({
    queryKey: ['pastoral-alerts'],
    queryFn: async () => {
      const alerts: PastoralAlert[] = [];
      const now = new Date();
      const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
      const lastMonday = subDays(currentMonday, 7);
      const twoWeeksAgoMonday = subDays(currentMonday, 14);
      const currentSaturday = addDays(currentMonday, 5);
      const lastSaturday = addDays(lastMonday, 5);

      // 1. Células sem relatório na semana operacional (Seg→Sáb)
      const { data: allCelulas } = await supabase.from('celulas').select('id, name, coordenacao_id').eq('is_test_data', false);
      const celulaIds = (allCelulas || []).map(c => c.id);
      
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
      const missingCelulas = (allCelulas || []).filter(c => !reportedIds.has(c.id));
      
      if (missingCelulas.length > 0) {
        alerts.push({
          type: 'missing_report',
          severity: missingCelulas.length > 3 ? 'critical' : 'warning',
          title: `${missingCelulas.length} célula(s) com relatório pendente`,
          description: `As células ${missingCelulas.slice(0, 3).map(c => c.name).join(', ')}${missingCelulas.length > 3 ? ` e mais ${missingCelulas.length - 3}` : ''} ainda não enviaram relatório esta semana.`,
          entity_name: 'Relatórios',
        });
      }

      // 2. Coordenações com queda - compare last 2 weeks
      const { data: coordenacoes } = await supabase.from('coordenacoes').select('id, name');
      
      for (const coord of coordenacoes || []) {
        const coordCelulas = (allCelulas || []).filter(c => c.coordenacao_id === coord.id);
        if (coordCelulas.length === 0) continue;
        const coordCelulaIds = coordCelulas.map(c => c.id);

        const { data: thisWeek } = await supabase
          .from('weekly_reports')
          .select('members_present')
          .in('celula_id', coordCelulaIds)
          .eq('is_test_data', false)
          .or(
            `and(meeting_date.gte.${format(currentMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(currentSaturday, 'yyyy-MM-dd')}),` +
            `and(meeting_date.is.null,week_start.gte.${format(currentMonday, 'yyyy-MM-dd')},week_start.lte.${format(currentSaturday, 'yyyy-MM-dd')})`
          );

        const { data: lastWeekData } = await supabase
          .from('weekly_reports')
          .select('members_present')
          .in('celula_id', coordCelulaIds)
          .eq('is_test_data', false)
          .or(
            `and(meeting_date.gte.${format(lastMonday, 'yyyy-MM-dd')},meeting_date.lte.${format(lastSaturday, 'yyyy-MM-dd')}),` +
            `and(meeting_date.is.null,week_start.gte.${format(lastMonday, 'yyyy-MM-dd')},week_start.lte.${format(lastSaturday, 'yyyy-MM-dd')})`
          );

        const thisTotal = (thisWeek || []).reduce((s, r) => s + r.members_present, 0);
        const lastTotal = (lastWeekData || []).reduce((s, r) => s + r.members_present, 0);

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
  return useQuery({
    queryKey: ['pastoral-celebrations'],
    queryFn: async () => {
      const celebrations: CelebrationItem[] = [];
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      // Multiplicações recentes
      const { data: multiplicacoes } = await supabase
        .from('multiplicacoes')
        .select(`
          *,
          celula_origem:celulas!multiplicacoes_celula_origem_id_fkey(name),
          celula_destino:celulas!multiplicacoes_celula_destino_id_fkey(name)
        `)
        .gte('data_multiplicacao', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .order('data_multiplicacao', { ascending: false });

      for (const mult of multiplicacoes || []) {
        celebrations.push({
          type: 'multiplicacao',
          title: 'Nova Multiplicação! 🎉',
          description: `A célula ${(mult.celula_origem as any)?.name} multiplicou, dando origem à célula ${(mult.celula_destino as any)?.name}.`,
          date: mult.data_multiplicacao,
        });
      }

      // Novos líderes em treinamento (últimos 30 dias)
      const { data: newLeaders } = await supabase
        .from('members')
        .select(`
          id,
          profile:profiles!members_profile_id_fkey(name),
          celula:celulas!members_celula_id_fkey(name)
        `)
        .eq('is_active', true)
        .eq('is_lider_em_treinamento', true);

      if (newLeaders && newLeaders.length > 0) {
        celebrations.push({
          type: 'new_leader',
          title: `${newLeaders.length} líder(es) em treinamento`,
          description: `A rede conta com ${newLeaders.length} líder(es) em formação, preparando-se para multiplicar.`,
          date: format(now, 'yyyy-MM-dd'),
        });
      }

      // Células constantes (todas as semanas com relatório no último mês)
      const { data: allCelulas } = await supabase.from('celulas').select('id, name');
      const { data: monthReports } = await supabase
        .from('weekly_reports')
        .select('celula_id, week_start')
        .gte('week_start', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      const reportsByCell = new Map<string, Set<string>>();
      for (const r of monthReports || []) {
        if (!reportsByCell.has(r.celula_id)) reportsByCell.set(r.celula_id, new Set());
        reportsByCell.get(r.celula_id)!.add(r.week_start);
      }

      const consistentCells = (allCelulas || []).filter(c => {
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

      return celebrations;
    },
  });
}

// Crescimento por rede
export function useRedeGrowthData() {
  return useQuery({
    queryKey: ['pastoral-rede-growth'],
    queryFn: async () => {
      const { data: redes } = await supabase.from('redes').select('id, name');
      if (!redes) return [];

      const { data: coordenacoes } = await supabase.from('coordenacoes').select('id, rede_id');
      const { data: celulas } = await supabase.from('celulas').select('id, coordenacao_id');
      const { data: members } = await supabase.from('members').select('id, celula_id').eq('is_active', true);

      const sixMonthsAgo = subDays(new Date(), 180);
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('celula_id, members_present')
        .gte('week_start', format(sixMonthsAgo, 'yyyy-MM-dd'));

      const result: RedeGrowth[] = [];

      for (const rede of redes) {
        const redeCoords = (coordenacoes || []).filter(c => c.rede_id === rede.id);
        const coordIds = redeCoords.map(c => c.id);
        const redeCelulas = (celulas || []).filter(c => coordIds.includes(c.coordenacao_id));
        const celulaIds = redeCelulas.map(c => c.id);
        const redeMembers = (members || []).filter(m => celulaIds.includes(m.celula_id));
        const redeReports = (reports || []).filter(r => celulaIds.includes(r.celula_id));
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
