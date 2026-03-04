import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KingdomFunnelData {
  cadastradas: number;
  boasVindasEnviadas: number;
  encaminhadas: number;
  contatadas: number;
  agendadas: number;
  integradas: number;
  membros: number;
  semResposta: number;
}

export function useGlobalKingdomFunnel(campoId?: string | null) {
  return useQuery({
    queryKey: ['global-kingdom-funnel', campoId ?? 'global'],
    staleTime: 60_000,
    queryFn: async (): Promise<KingdomFunnelData> => {
      // Novas vidas by status
      let nvQ = supabase.from('novas_vidas').select('id, status');
      if (campoId) nvQ = nvQ.eq('campo_id', campoId);
      const { data: nv } = await nvQ;
      const vidas = nv || [];

      // Encaminhamentos by status
      let encQ = supabase.from('encaminhamentos_recomeco').select('id, status, contatado_at, integrado_at, promovido_membro_at');
      if (campoId) encQ = encQ.eq('campo_id', campoId);
      const { data: enc } = await encQ;
      const encs = enc || [];

      // Messages sent (boas-vindas) — recomeco_messages has no campo_id,
      // so we must filter through the vida_ids that belong to this campus
      let boasVindasCount = 0;
      if (vidas.length > 0) {
        const vidaIds = vidas.map(v => v.id);
        // Batch in chunks of 100 to avoid URL length limits
        for (let i = 0; i < vidaIds.length; i += 100) {
          const chunk = vidaIds.slice(i, i + 100);
          const { count } = await supabase
            .from('recomeco_messages')
            .select('id', { count: 'exact', head: true })
            .in('vida_id', chunk);
          boasVindasCount += count || 0;
        }
      } else if (!campoId) {
        // Global view without any campus filter — count all messages
        const { count: msgCount } = await supabase
          .from('recomeco_messages')
          .select('id', { count: 'exact', head: true });
        boasVindasCount = msgCount || 0;
      }

      const cadastradas = vidas.length;
      const boasVindasEnviadas = boasVindasCount;
      const encaminhadas = encs.length;
      const contatadas = encs.filter(e => e.contatado_at || ['contatado', 'integrado'].includes(e.status)).length;
      const agendadas = vidas.filter(v => v.status === 'agendado').length;
      const integradas = encs.filter(e => e.integrado_at || e.status === 'integrado').length;
      const membros = encs.filter(e => e.promovido_membro_at).length;
      const semResposta = encs.filter(e => e.status === 'sem_resposta').length;

      return { cadastradas, boasVindasEnviadas, encaminhadas, contatadas, agendadas, integradas, membros, semResposta };
    },
  });
}
