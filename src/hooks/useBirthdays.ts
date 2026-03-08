import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, parseISO } from 'date-fns';

export interface BirthdayMember {
  id: string;
  name: string;
  avatar_url: string | null;
  birth_date: string;
  celula_name: string;
  celula_id: string;
  is_today: boolean;
  is_tomorrow: boolean;
}

export interface BirthdayLeader {
  id: string;
  name: string;
  avatar_url: string | null;
  birth_date: string;
  celula_name: string;
  celula_id: string;
  coordenacao_name: string;
  coordenacao_id: string;
  is_today: boolean;
  is_tomorrow: boolean;
}

// Hook for member birthdays (used by cell leaders)
export function useUpcomingBirthdays(celulaId?: string) {
  return useQuery({
    queryKey: ['birthdays', celulaId],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select(`
          id,
          celula_id,
          profile:profiles!members_profile_id_fkey(
            id,
            name,
            avatar_url,
            birth_date
          ),
          celula:celulas!members_celula_id_fkey(
            id,
            name
          )
        `)
        .eq('is_active', true);
      
      if (celulaId) {
        query = query.eq('celula_id', celulaId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      const todayMonthDay = format(today, 'MM-dd');
      const tomorrowMonthDay = format(tomorrow, 'MM-dd');
      
      const birthdays: BirthdayMember[] = [];
      
      for (const member of data || []) {
        const profile = member.profile as any;
        if (!profile?.birth_date) continue;
        
        const birthDate = parseISO(profile.birth_date);
        const birthMonthDay = format(birthDate, 'MM-dd');
        
        const isToday = birthMonthDay === todayMonthDay;
        const isTomorrow = birthMonthDay === tomorrowMonthDay;
        
        if (isToday || isTomorrow) {
          birthdays.push({
            id: member.id,
            name: profile.name,
            avatar_url: profile.avatar_url,
            birth_date: profile.birth_date,
            celula_name: (member.celula as any)?.name || '',
            celula_id: member.celula_id,
            is_today: isToday,
            is_tomorrow: isTomorrow,
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

// Hook for cell leader birthdays (used by coordinators and network leaders)
export function useCellLeaderBirthdays(coordenacaoId?: string, redeId?: string, campoId?: string | null) {
  return useQuery({
    queryKey: ['leader-birthdays', coordenacaoId, redeId, campoId],
    queryFn: async () => {
      // Get all celulas with their leaders
      let query = supabase
        .from('celulas')
        .select(`
          id,
          name,
          coordenacao_id,
          leader:profiles!celulas_leader_id_fkey(
            id,
            name,
            avatar_url,
            birth_date
          ),
          coordenacao:coordenacoes!celulas_coordenacao_id_fkey(
            id,
            name,
            rede_id
          )
        `)
        .not('leader_id', 'is', null);
      
      if (coordenacaoId) {
        query = query.eq('coordenacao_id', coordenacaoId);
      }
      if (campoId) {
        query = query.eq('campo_id', campoId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by rede if specified
      let celulas = data || [];
      if (redeId) {
        celulas = celulas.filter(c => (c.coordenacao as any)?.rede_id === redeId);
      }
      
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      const todayMonthDay = format(today, 'MM-dd');
      const tomorrowMonthDay = format(tomorrow, 'MM-dd');
      
      const birthdays: BirthdayLeader[] = [];
      
      for (const celula of celulas) {
        const leader = celula.leader as any;
        if (!leader?.birth_date) continue;
        
        const birthDate = parseISO(leader.birth_date);
        const birthMonthDay = format(birthDate, 'MM-dd');
        
        const isToday = birthMonthDay === todayMonthDay;
        const isTomorrow = birthMonthDay === tomorrowMonthDay;
        
        if (isToday || isTomorrow) {
          birthdays.push({
            id: leader.id,
            name: leader.name,
            avatar_url: leader.avatar_url,
            birth_date: leader.birth_date,
            celula_name: celula.name,
            celula_id: celula.id,
            coordenacao_name: (celula.coordenacao as any)?.name || '',
            coordenacao_id: celula.coordenacao_id,
            is_today: isToday,
            is_tomorrow: isTomorrow,
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
