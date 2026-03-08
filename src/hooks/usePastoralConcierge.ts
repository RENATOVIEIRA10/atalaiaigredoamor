import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';
import { useCampos } from '@/hooks/useCampos';

export interface RedeHealth {
  id: string;
  name: string;
  membros: number;
  novasVidas: number;
  celulas: number;
  reportsThisWeek: number;
  totalCelulas: number;
  status: 'growing' | 'stable' | 'attention';
}

export interface CampoHealth {
  id: string;
  nome: string;
  membros: number;
  novasVidas: number;
  celulas: number;
  redes: number;
  status: 'growing' | 'stable' | 'attention';
}

export interface PastoralConciergeData {
  // Spiritual movement
  novasVidasMes: number;
  conversoesMes: number;
  batismosMes: number;
  discipuladosAtivos: number;
  // Leadership
  lideresAtivos: number;
  coordSemSupervisao: number;
  lideresEmFormacao: number;
  // Health signals
  units: (RedeHealth | CampoHealth)[];
}

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

/** Concierge data for Pastor de Campo */
export function usePastorCampoConcierge() {
  const { activeCampo } = useCampo();
  const campoId = activeCampo?.id;

  return useQuery({
    queryKey: ['pastoral-concierge-campo', campoId],
    enabled: !!campoId,
    staleTime: 120_000,
    queryFn: async (): Promise<PastoralConciergeData> => {
      const start = monthStart();

      // Redes do campus
      const { data: redes } = await supabase
        .from('redes')
        .select('id, name')
        .eq('campo_id', campoId!)
        .eq('ativa', true);

      const redeList = redes || [];

      // Spiritual movement
      const [
        { count: novasVidas },
        { count: batismos },
        { count: discipulados },
      ] = await Promise.all([
        supabase.from('novas_vidas').select('id', { count: 'exact', head: true })
          .eq('campo_id', campoId!).gte('created_at', start),
        supabase.from('members').select('id', { count: 'exact', head: true })
          .eq('campo_id', campoId!).eq('batismo', true).eq('is_active', true)
          .gte('joined_at', start),
        supabase.from('members').select('id', { count: 'exact', head: true })
          .eq('campo_id', campoId!).eq('is_discipulado', true).eq('is_active', true),
      ]);

      // Conversions (novas_vidas with status indicating integration)
      const { count: conversoes } = await supabase
        .from('encaminhamentos_recomeco')
        .select('id', { count: 'exact', head: true })
        .eq('campo_id', campoId!)
        .not('promovido_membro_at', 'is', null)
        .gte('created_at', start);

      // Leaders
      const { count: lideresAtivos } = await supabase
        .from('leadership_functions')
        .select('id', { count: 'exact', head: true })
        .eq('campo_id', campoId!)
        .eq('active', true)
        .eq('function_type', 'lider_rede');

      const { count: lideresFormacao } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('campo_id', campoId!)
        .eq('is_active', true)
        .eq('is_lider_em_treinamento', true);

      // Per-rede health
      const units: RedeHealth[] = [];
      for (const rede of redeList.slice(0, 20)) {
        const [
          { count: membros },
          { count: nv },
          { count: celulas },
        ] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true })
            .eq('rede_id', rede.id).eq('is_active', true),
          supabase.from('novas_vidas').select('id', { count: 'exact', head: true })
            .eq('campo_id', campoId!).gte('created_at', start),
          supabase.from('celulas').select('id', { count: 'exact', head: true })
            .eq('rede_id', rede.id),
        ]);

        // Simple heuristic for health
        const m = membros || 0;
        const n = nv || 0;
        let status: 'growing' | 'stable' | 'attention' = 'stable';
        if (n > 2) status = 'growing';
        if (m < 5 && n === 0) status = 'attention';

        units.push({
          id: rede.id,
          name: rede.name,
          membros: m,
          novasVidas: n,
          celulas: celulas || 0,
          reportsThisWeek: 0,
          totalCelulas: celulas || 0,
          status,
        });
      }

      // Coord sem supervisão recente (30 dias)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: coords } = await supabase
        .from('coordenacoes')
        .select('id')
        .eq('campo_id', campoId!);

      let coordSemSupervisao = 0;
      if (coords?.length) {
        for (const coord of coords.slice(0, 30)) {
          const { data: celulasCoord } = await supabase
            .from('celulas')
            .select('id')
            .eq('coordenacao_id', coord.id)
            .limit(1);

          if (celulasCoord?.length) {
            const { count: sup } = await supabase
              .from('supervisoes')
              .select('id', { count: 'exact', head: true })
              .in('celula_id', celulasCoord.map(c => c.id))
              .gte('data_supervisao', thirtyDaysAgo.split('T')[0]);

            if (!sup || sup === 0) coordSemSupervisao++;
          }
        }
      }

      return {
        novasVidasMes: novasVidas || 0,
        conversoesMes: conversoes || 0,
        batismosMes: batismos || 0,
        discipuladosAtivos: discipulados || 0,
        lideresAtivos: lideresAtivos || 0,
        coordSemSupervisao,
        lideresEmFormacao: lideresFormacao || 0,
        units,
      };
    },
  });
}

/** Concierge data for Pastor Global */
export function usePastorGlobalConcierge() {
  const { data: campos } = useCampos();

  return useQuery({
    queryKey: ['pastoral-concierge-global', campos?.map(c => c.id).join(',')],
    enabled: !!campos?.length,
    staleTime: 120_000,
    queryFn: async (): Promise<PastoralConciergeData> => {
      const start = monthStart();

      const [
        { count: novasVidas },
        { count: batismos },
        { count: discipulados },
        { count: conversoes },
      ] = await Promise.all([
        supabase.from('novas_vidas').select('id', { count: 'exact', head: true })
          .gte('created_at', start),
        supabase.from('members').select('id', { count: 'exact', head: true })
          .eq('batismo', true).eq('is_active', true).gte('joined_at', start),
        supabase.from('members').select('id', { count: 'exact', head: true })
          .eq('is_discipulado', true).eq('is_active', true),
        supabase.from('encaminhamentos_recomeco').select('id', { count: 'exact', head: true })
          .not('promovido_membro_at', 'is', null).gte('created_at', start),
      ]);

      // Pastores de campo ativos
      const { count: pastoresAtivos } = await supabase
        .from('campo_pastores')
        .select('id', { count: 'exact', head: true });

      const { count: lideresFormacao } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_lider_em_treinamento', true);

      // Per-campo health
      const units: CampoHealth[] = [];
      for (const campo of (campos || []).slice(0, 15)) {
        const [
          { count: membros },
          { count: nv },
          { count: celulas },
          { count: redesCount },
        ] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true })
            .eq('campo_id', campo.id).eq('is_active', true),
          supabase.from('novas_vidas').select('id', { count: 'exact', head: true })
            .eq('campo_id', campo.id).gte('created_at', start),
          supabase.from('celulas').select('id', { count: 'exact', head: true })
            .eq('campo_id', campo.id),
          supabase.from('redes').select('id', { count: 'exact', head: true })
            .eq('campo_id', campo.id).eq('ativa', true),
        ]);

        const m = membros || 0;
        const n = nv || 0;
        let status: 'growing' | 'stable' | 'attention' = 'stable';
        if (n > 3) status = 'growing';
        if (m < 10 && n === 0) status = 'attention';

        units.push({
          id: campo.id,
          nome: campo.nome,
          membros: m,
          novasVidas: n,
          celulas: celulas || 0,
          redes: redesCount || 0,
          status,
        });
      }

      return {
        novasVidasMes: novasVidas || 0,
        conversoesMes: conversoes || 0,
        batismosMes: batismos || 0,
        discipuladosAtivos: discipulados || 0,
        lideresAtivos: pastoresAtivos || 0,
        coordSemSupervisao: 0,
        lideresEmFormacao: lideresFormacao || 0,
        units,
      };
    },
  });
}
