import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CelulaMatch } from '@/lib/matchEngine';

export type CelulaPublica = CelulaMatch;

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesTokens(tokens: string[], text: string): boolean {
  const norm = normalize(text);
  return tokens.every(t => norm.includes(t));
}

export function useCelulasPublicas(filters?: {
  bairro?: string;
  cidade?: string;
  rede_id?: string;
}) {
  return useQuery({
    queryKey: ['celulas_publicas', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celulas')
        .select(`
          id, name, bairro, cidade, meeting_day, meeting_time, rede_id,
          tipo_celula, faixa_etaria_predominante, bairros_atendidos, perfil_ambiente,
          rede:redes(name),
          leadership_couple:leadership_couples(
            spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
          )
        `)
        .order('name');

      if (error) throw error;

      let result = (data || []).map((c: any) => {
        const spouse1 = c.leadership_couple?.spouse1?.name;
        const spouse2 = c.leadership_couple?.spouse2?.name;
        const lideres = [spouse1, spouse2].filter(Boolean).join(' & ') || '—';

        return {
          id: c.id,
          name: c.name,
          bairro: c.bairro,
          cidade: c.cidade,
          meeting_day: c.meeting_day,
          meeting_time: c.meeting_time,
          rede_id: c.rede_id,
          rede_name: c.rede?.name || null,
          lideres,
          tipo_celula: c.tipo_celula,
          faixa_etaria_predominante: c.faixa_etaria_predominante,
          bairros_atendidos: c.bairros_atendidos,
          perfil_ambiente: c.perfil_ambiente,
        } as CelulaPublica;
      });

      if (filters?.bairro) {
        const tokens = normalize(filters.bairro).split(' ').filter(Boolean);
        if (tokens.length > 0) {
          result = result.filter(c => {
            const searchable = [c.bairro, c.cidade, c.name, c.lideres]
              .filter(Boolean)
              .join(' ');
            return matchesTokens(tokens, searchable);
          });
        }
      }

      if (filters?.cidade) {
        const tokens = normalize(filters.cidade).split(' ').filter(Boolean);
        if (tokens.length > 0) {
          result = result.filter(c => {
            const searchable = [c.cidade, c.bairro, c.name]
              .filter(Boolean)
              .join(' ');
            return matchesTokens(tokens, searchable);
          });
        }
      }

      if (filters?.rede_id) {
        result = result.filter(c => c.rede_id === filters.rede_id);
      }

      return result;
    },
  });
}
