import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CelulaPublica {
  id: string;
  name: string;
  bairro: string | null;
  cidade: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  rede_id: string | null;
  rede_name: string | null;
  lideres: string;
}

/**
 * Remove accents and lowercase for fuzzy matching.
 */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenized search: all tokens must appear in the combined text.
 * "casa caiada" matches "Casa Caiada" in bairro.
 */
function matchesTokens(tokens: string[], text: string): boolean {
  const norm = normalize(text);
  return tokens.every(t => norm.includes(t));
}

export function useCelulasPublicas(filters?: {
  bairro?: string;
  cidade?: string;
  rede_id?: string;
  vidaPerfil?: { estado_civil?: string | null; faixa_etaria?: string | null };
}) {
  return useQuery({
    queryKey: ['celulas_publicas', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('celulas')
        .select(`
          id, name, bairro, cidade, meeting_day, meeting_time, rede_id,
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
        } as CelulaPublica;
      });

      // Tokenized, accent-insensitive filtering for bairro
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

      // Tokenized, accent-insensitive filtering for cidade
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

      // Sort by matching priority if vida profile is available
      if (filters?.vidaPerfil) {
        const perfil = filters.vidaPerfil;
        result.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          // Priority: bairro match
          if (filters.bairro) {
            const bairroNorm = normalize(filters.bairro);
            if (a.bairro && normalize(a.bairro).includes(bairroNorm)) scoreA += 10;
            if (b.bairro && normalize(b.bairro).includes(bairroNorm)) scoreB += 10;
          }

          // Priority: married → Rede Amor a 2
          if (perfil.estado_civil && normalize(perfil.estado_civil).includes('casado')) {
            if (a.rede_name && normalize(a.rede_name).includes('amor')) scoreA += 5;
            if (b.rede_name && normalize(b.rede_name).includes('amor')) scoreB += 5;
          }

          return scoreB - scoreA; // Higher score first
        });
      }

      return result;
    },
  });
}
