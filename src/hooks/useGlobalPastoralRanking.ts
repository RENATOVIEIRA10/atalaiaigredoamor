import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInYears } from 'date-fns';

export interface PotentialServant {
  id: string;
  name: string;
  celula_name: string;
  anos_igreja: number;
  marcos: string[];
  whatsapp?: string | null;
}

export interface StagnantMember {
  id: string;
  name: string;
  celula_name: string;
  anos_igreja: number;
  missing: string[];
}

export interface ServingMember {
  id: string;
  name: string;
  celula_name: string;
  ministerios: string[];
}

interface RankingOptions {
  campoId?: string | null;
  coordenacaoId?: string | null;
  redeId?: string | null;
}

export function useGlobalPastoralRanking(options: RankingOptions = {}) {
  const { campoId, coordenacaoId, redeId } = options;

  return useQuery({
    queryKey: ['global-pastoral-ranking', campoId, coordenacaoId, redeId],
    staleTime: 120_000,
    queryFn: async () => {
      // Get celula IDs for scope filtering
      let celulaIds: string[] | null = null;

      if (coordenacaoId) {
        let cq = supabase.from('celulas').select('id').eq('coordenacao_id', coordenacaoId);
        if (campoId) cq = cq.eq('campo_id', campoId);
        const { data: scopeCelulas } = await cq;
        celulaIds = (scopeCelulas || []).map(c => c.id);
      } else if (redeId) {
        let cq = supabase.from('celulas').select('id').eq('rede_id', redeId);
        if (campoId) cq = cq.eq('campo_id', campoId);
        const { data: scopeCelulas } = await cq;
        celulaIds = (scopeCelulas || []).map(c => c.id);
      }

      let q = supabase.from('members')
        .select('id, profile_id, celula_id, joined_at, encontro_com_deus, batismo, curso_lidere, renovo, is_discipulado, is_lider_em_treinamento, serve_ministerio, ministerios, disponivel_para_servir, whatsapp, celula:celulas!members_celula_id_fkey(name), profile:profiles!members_profile_id_fkey(name)')
        .eq('is_active', true);

      if (campoId) q = q.eq('campo_id', campoId);
      if (celulaIds !== null) q = q.in('celula_id', celulaIds.length > 0 ? celulaIds : ['__none__']);

      const { data } = await q;
      const members = data || [];

      // Check who has active leadership functions
      const { data: funcs } = await supabase.from('leadership_functions').select('profile_id').eq('active', true);
      const activeLeaderIds = new Set((funcs || []).map(f => f.profile_id));

      const now = new Date();
      const potentials: PotentialServant[] = [];
      const stagnant: StagnantMember[] = [];
      const serving: ServingMember[] = [];

      for (const m of members) {
        const joined = m.joined_at ? new Date(m.joined_at) : null;
        const anos = joined ? differenceInYears(now, joined) : 0;
        const name = (m as any).profile?.name || 'Membro';
        const celName = (m as any).celula?.name || 'Célula';

        const marcos: string[] = [];
        if (m.encontro_com_deus) marcos.push('Encontro');
        if (m.batismo) marcos.push('Batismo');
        if (m.curso_lidere) marcos.push('Lidere');
        if (m.renovo) marcos.push('Renovo');
        if (m.is_discipulado) marcos.push('Discipulado');

        const hasLeadership = activeLeaderIds.has(m.profile_id);

        // Already serving in ministry
        if (m.serve_ministerio && (m.ministerios as string[] | null)?.length) {
          serving.push({
            id: m.id,
            name,
            celula_name: celName,
            ministerios: (m.ministerios as string[]) || [],
          });
        }

        // Potentials: available, not serving, 2+ years, 3+ marcos, no active function
        if (
          m.disponivel_para_servir !== false &&
          !m.serve_ministerio &&
          anos >= 2 &&
          marcos.length >= 3 &&
          !hasLeadership &&
          !m.is_lider_em_treinamento
        ) {
          potentials.push({ id: m.id, name, celula_name: celName, anos_igreja: anos, marcos, whatsapp: m.whatsapp });
        }

        // Stagnant: 2+ years, missing key marcos
        const missing: string[] = [];
        if (!m.encontro_com_deus) missing.push('Encontro');
        if (!m.batismo) missing.push('Batismo');
        if (!m.curso_lidere) missing.push('Lidere');

        if (anos >= 2 && missing.length >= 2) {
          stagnant.push({ id: m.id, name, celula_name: celName, anos_igreja: anos, missing });
        }
      }

      return {
        potentials: potentials.sort((a, b) => b.marcos.length - a.marcos.length || b.anos_igreja - a.anos_igreja).slice(0, 20),
        stagnant: stagnant.sort((a, b) => b.anos_igreja - a.anos_igreja || b.missing.length - a.missing.length).slice(0, 20),
        serving: serving.slice(0, 20),
        potentialsCount: potentials.length,
        servingCount: serving.length,
      };
    },
  });
}
