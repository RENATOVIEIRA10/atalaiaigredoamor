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
    queryKey: ['global-kingdom-funnel', campoId],
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

      // Messages sent (boas-vindas)
      let msgQ = supabase.from('recomeco_messages').select('id', { count: 'exact', head: true });
      const { count: msgCount } = await msgQ;

      const cadastradas = vidas.length;
      const boasVindasEnviadas = msgCount || 0;
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
