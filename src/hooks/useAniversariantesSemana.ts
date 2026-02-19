import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, parseISO } from 'date-fns';

export interface AniversarianteSemana {
  id: string;
  name: string;
  avatar_url: string | null;
  birth_date: string;
  celula_name: string;
  display_date: string; // DD/MM
  is_today: boolean;
  phone?: string | null; // para botão WhatsApp
}

interface UseAniversariantesOptions {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
}

export function useAniversariantesSemana({ scopeType, scopeId }: UseAniversariantesOptions) {
  return useQuery({
    queryKey: ['aniversariantes-semana', scopeType, scopeId],
    enabled: !!scopeId,
    queryFn: async (): Promise<AniversarianteSemana[]> => {
      // Get celulas in scope
      let celulaQuery = supabase.from('celulas').select('id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(rede_id)');
      if (scopeType === 'coordenacao') {
        celulaQuery = celulaQuery.eq('coordenacao_id', scopeId);
      }
      const { data: celulas } = await celulaQuery;
      let filteredCelulas = celulas || [];
      if (scopeType === 'rede') {
        filteredCelulas = filteredCelulas.filter(c => (c.coordenacao as any)?.rede_id === scopeId);
      }
      const celulaIds = filteredCelulas.map(c => c.id);
      if (celulaIds.length === 0) return [];

      const celulaMap = Object.fromEntries(filteredCelulas.map(c => [c.id, c.name]));

      // Get active members with profiles
      const { data: members } = await supabase
        .from('members')
        .select('id, celula_id, profile:profiles!members_profile_id_fkey(name, avatar_url, birth_date, email)')
        .eq('is_active', true)
        .in('celula_id', celulaIds);

      if (!members) return [];

      const today = new Date();
      const weekDays: string[] = [];
      for (let i = 0; i < 7; i++) {
        weekDays.push(format(addDays(today, i), 'MM-dd'));
      }
      const todayMD = weekDays[0];

      const result: AniversarianteSemana[] = [];
      for (const m of members) {
        const profile = m.profile as any;
        if (!profile?.birth_date) continue;
        const bd = parseISO(profile.birth_date);
        const bdMD = format(bd, 'MM-dd');
        if (weekDays.includes(bdMD)) {
          result.push({
            id: m.id,
            name: profile.name,
            avatar_url: profile.avatar_url,
            birth_date: profile.birth_date,
            celula_name: celulaMap[m.celula_id] || '',
            display_date: format(bd, 'dd/MM'),
            is_today: bdMD === todayMD,
            // email como fallback de contato (alguns perfis usam email como WhatsApp não está na tabela)
            phone: profile.email || null,
          });
        }
      }

      return result.sort((a, b) => {
        if (a.is_today && !b.is_today) return -1;
        if (!a.is_today && b.is_today) return 1;
        return a.name.localeCompare(b.name);
      });
    },
  });
}
