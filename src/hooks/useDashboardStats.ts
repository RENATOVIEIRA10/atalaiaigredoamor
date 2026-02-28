import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from '@/hooks/useDemoScope';

export interface DashboardStats {
  totalMembers: number;
  totalCelulas: number;
  attendanceRate: number;
  growth: number;
}

export function useDashboardStats() {
  const { campoId, isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['dashboard-stats', ...queryKeyExtra],
    queryFn: async () => {
      // Get total active members
      let membersQuery = supabase.from('members').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (campoId) membersQuery = membersQuery.eq('campo_id', campoId);
      const { count: totalMembers } = await membersQuery;
      
      // Get total celulas
      let celulasQuery = supabase.from('celulas').select('*', { count: 'exact', head: true });
      if (campoId) celulasQuery = celulasQuery.eq('campo_id', campoId);
      const { count: totalCelulas } = await celulasQuery;
      
      // Calculate attendance rate from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentMeetings } = await supabase
        .from('meetings')
        .select('id')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      let attendanceRate = 0;
      if (recentMeetings && recentMeetings.length > 0) {
        const meetingIds = recentMeetings.map(m => m.id);
        
        const { count: totalAttendances } = await supabase
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .in('meeting_id', meetingIds);
        
        const { count: presentAttendances } = await supabase
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .in('meeting_id', meetingIds)
          .eq('present', true);
        
        if (totalAttendances && totalAttendances > 0) {
          attendanceRate = Math.round(((presentAttendances || 0) / totalAttendances) * 100);
        }
      }
      
      // Calculate growth
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      let recentQuery = supabase.from('members').select('*', { count: 'exact', head: true }).gte('joined_at', thirtyDaysAgo.toISOString());
      if (campoId) recentQuery = recentQuery.eq('campo_id', campoId);
      const { count: recentMembers } = await recentQuery;
      
      let prevQuery = supabase.from('members').select('*', { count: 'exact', head: true }).gte('joined_at', sixtyDaysAgo.toISOString()).lt('joined_at', thirtyDaysAgo.toISOString());
      if (campoId) prevQuery = prevQuery.eq('campo_id', campoId);
      const { count: previousMembers } = await prevQuery;
      
      let growth = 0;
      if (previousMembers && previousMembers > 0) {
        growth = Math.round((((recentMembers || 0) - previousMembers) / previousMembers) * 100);
      } else if (recentMembers && recentMembers > 0) {
        growth = 100;
      }
      
      return {
        totalMembers: totalMembers || 0,
        totalCelulas: totalCelulas || 0,
        attendanceRate,
        growth,
      } as DashboardStats;
    },
  });
}

export function useAttendanceByCell() {
  return useQuery({
    queryKey: ['attendance-by-cell'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, celula_id, celulas(name)')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (!meetings || meetings.length === 0) return [];
      
      const meetingIds = meetings.map(m => m.id);
      
      const { data: attendances } = await supabase
        .from('attendances')
        .select('meeting_id, present')
        .in('meeting_id', meetingIds);
      
      const celulaMap = new Map<string, { name: string; total: number; present: number }>();
      
      for (const meeting of meetings) {
        const celula = meeting.celulas as any;
        const celulaId = meeting.celula_id;
        if (!celulaMap.has(celulaId)) {
          celulaMap.set(celulaId, { name: celula?.name || 'Sem nome', total: 0, present: 0 });
        }
      }
      
      if (attendances) {
        const meetingToCelula = new Map(meetings.map(m => [m.id, m.celula_id]));
        
        for (const att of attendances) {
          const celulaId = meetingToCelula.get(att.meeting_id);
          if (celulaId) {
            const entry = celulaMap.get(celulaId)!;
            entry.total++;
            if (att.present) entry.present++;
          }
        }
      }
      
      return Array.from(celulaMap.values()).map(({ name, total, present }) => ({
        name,
        presenca: total > 0 ? Math.round((present / total) * 100) : 0,
      }));
    },
  });
}

export function useMemberGrowth() {
  return useQuery({
    queryKey: ['member-growth'],
    queryFn: async () => {
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .lt('joined_at', nextMonth.toISOString());
        
        months.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          membros: count || 0,
        });
      }
      
      return months;
    },
  });
}
