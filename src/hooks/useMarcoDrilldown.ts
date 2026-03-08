import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { batchedInQuery } from '@/lib/supabasePagination';

export type MarcoType =
  | 'encontro_com_deus'
  | 'batismo'
  | 'is_discipulado'
  | 'curso_lidere'
  | 'renovo'
  | 'is_lider_em_treinamento';

export interface MarcoDrilldownMember {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
  coordenacao_name: string;
}

interface UseMarcoDrilldownOptions {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
  marcoType: MarcoType | null;
  campoId?: string | null;
}

export function useMarcoDrilldown({ scopeType, scopeId, marcoType, campoId }: UseMarcoDrilldownOptions) {
  return useQuery({
    queryKey: ['marco-drilldown', scopeType, scopeId, marcoType, campoId ?? 'none'],
    enabled: !!marcoType && !!scopeId,
    staleTime: 60_000,
    queryFn: async (): Promise<MarcoDrilldownMember[]> => {
      if (!marcoType) return [];

      // 1. Get all celula IDs in scope
      let celulaQuery = supabase
        .from('celulas')
        .select('id, name, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name)');

      if (campoId) celulaQuery = celulaQuery.eq('campo_id', campoId);
      if (scopeType === 'coordenacao') celulaQuery = celulaQuery.eq('coordenacao_id', scopeId);
      if (scopeType === 'rede') celulaQuery = celulaQuery.eq('rede_id', scopeId);

      const { data: celulas } = await celulaQuery;
      if (!celulas?.length) return [];

      const celulaIds = celulas.map(c => c.id);
      const celulaMap = Object.fromEntries(
        celulas.map(c => [c.id, {
          name: c.name,
          coordenacao_name: (c as any).coordenacao?.name || 'Sem coordenação',
        }])
      );

      // 2. Fetch members with this marco
      const members = await batchedInQuery(
        'members',
        'id, celula_id, profile:profiles!members_profile_id_fkey(name, avatar_url)',
        'celula_id',
        celulaIds,
        (q: any) => q.eq('is_active', true).eq(marcoType, true)
      );

      return members.map((m: any) => ({
        id: m.id,
        name: m.profile?.name || 'Sem nome',
        avatar_url: m.profile?.avatar_url || null,
        celula_name: celulaMap[m.celula_id]?.name || 'Sem célula',
        coordenacao_name: celulaMap[m.celula_id]?.coordenacao_name || 'Sem coordenação',
      })).sort((a: MarcoDrilldownMember, b: MarcoDrilldownMember) => a.name.localeCompare(b.name));
    },
  });
}
