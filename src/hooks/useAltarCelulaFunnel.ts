import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import { useDemoScope } from './useDemoScope';

export type PeriodDays = 7 | 30 | 90;

export interface FunnelStep {
  key: string;
  label: string;
  value: number;
  pct: number; // % over conversões
}

export interface FunnelBottleneck {
  from: string;
  to: string;
  dropPct: number;
  recommendation: string;
}

export interface StalledLife {
  id: string;
  nome: string;
  whatsapp: string | null;
  etapa: string;
  dias_parado: number;
  celula_name: string | null;
  celula_id: string | null;
  rede_id: string | null;
}

export interface AltarCelulaData {
  steps: FunnelStep[];
  bottleneck: FunnelBottleneck | null;
  stalledLives: StalledLife[];
}

const BOTTLENECK_TIPS: Record<string, string> = {
  'Boas-vindas→Encaminhadas': 'Agilizar triagem e encaminhamento para célula em até 48h.',
  'Encaminhadas→Contatadas': 'Reforçar contato em até 24h após encaminhamento.',
  'Contatadas→Agendadas': 'Confirmar visita com mensagem padrão e lembrete.',
  'Agendadas→Integradas': 'Acompanhar no dia da célula e garantir acolhimento.',
  'Integradas→Membros': 'Plano de integração com acompanhamento de 2 a 4 semanas.',
  'Conversões→Boas-vindas': 'Garantir envio de boas-vindas no mesmo dia da conversão.',
};

export function useAltarCelulaFunnel(periodDays: PeriodDays = 30, overrideCampoId?: string | null) {
  const { campoId: scopeCampoId } = useDemoScope();
  const campoId = overrideCampoId !== undefined ? overrideCampoId : scopeCampoId;

  return useQuery({
    queryKey: ['altar-celula-funnel', campoId ?? 'global', periodDays],
    staleTime: 60_000,
    queryFn: async (): Promise<AltarCelulaData> => {
      const since = format(subDays(new Date(), periodDays), 'yyyy-MM-dd');

      // 1. Conversões (novas_vidas created in period)
      let nvQ = supabase.from('novas_vidas').select('id, nome, whatsapp, status, created_at, updated_at');
      if (campoId) nvQ = nvQ.eq('campo_id', campoId);
      nvQ = nvQ.gte('created_at', since);
      const { data: nvData } = await nvQ;
      const vidas = nvData || [];
      const conversoes = vidas.length;

      // 2. Messages (boas-vindas) for these vidas
      const vidaIds = vidas.map(v => v.id);
      let boasVindas = 0;
      if (vidaIds.length > 0) {
        // batch in chunks of 100
        for (let i = 0; i < vidaIds.length; i += 100) {
          const chunk = vidaIds.slice(i, i + 100);
          const { count } = await supabase
            .from('recomeco_messages')
            .select('id', { count: 'exact', head: true })
            .in('vida_id', chunk);
          boasVindas += count || 0;
        }
      }

      // 3. Encaminhamentos for these vidas
      let encQ = supabase.from('encaminhamentos_recomeco')
        .select('id, nova_vida_id, celula_id, rede_id, status, contatado_at, integrado_at, promovido_membro_at, data_encaminhamento, updated_at');
      if (campoId) encQ = encQ.eq('campo_id', campoId);
      if (vidaIds.length > 0) {
        // We want encaminhamentos for vidas created in period
        encQ = encQ.in('nova_vida_id', vidaIds);
      } else {
        encQ = encQ.eq('id', '00000000-0000-0000-0000-000000000000'); // no results
      }
      const { data: encData } = await encQ;
      const encs = encData || [];

      const encaminhadas = encs.length;
      const contatadas = encs.filter(e => e.contatado_at || ['contatado', 'integrado'].includes(e.status)).length;
      const agendadas = vidas.filter(v => v.status === 'agendado').length + encs.filter(e => e.status === 'agendado').length;
      const integradas = encs.filter(e => e.integrado_at || e.status === 'integrado').length;
      const membros = encs.filter(e => e.promovido_membro_at).length;

      const steps: FunnelStep[] = [
        { key: 'conversoes', label: 'Conversões', value: conversoes, pct: 100 },
        { key: 'boas_vindas', label: 'Boas-vindas', value: boasVindas, pct: conversoes > 0 ? Math.round((boasVindas / conversoes) * 100) : 0 },
        { key: 'encaminhadas', label: 'Encaminhadas', value: encaminhadas, pct: conversoes > 0 ? Math.round((encaminhadas / conversoes) * 100) : 0 },
        { key: 'contatadas', label: 'Contatadas', value: contatadas, pct: conversoes > 0 ? Math.round((contatadas / conversoes) * 100) : 0 },
        { key: 'agendadas', label: 'Agendadas', value: agendadas, pct: conversoes > 0 ? Math.round((agendadas / conversoes) * 100) : 0 },
        { key: 'integradas', label: 'Integradas', value: integradas, pct: conversoes > 0 ? Math.round((integradas / conversoes) * 100) : 0 },
        { key: 'membros', label: 'Membros', value: membros, pct: conversoes > 0 ? Math.round((membros / conversoes) * 100) : 0 },
      ];

      // Bottleneck: biggest % drop between consecutive steps
      let bottleneck: FunnelBottleneck | null = null;
      let maxDrop = 0;
      for (let i = 0; i < steps.length - 1; i++) {
        if (steps[i].value === 0) continue;
        const dropPct = Math.round(((steps[i].value - steps[i + 1].value) / steps[i].value) * 100);
        if (dropPct > maxDrop) {
          maxDrop = dropPct;
          const key = `${steps[i].label}→${steps[i + 1].label}`;
          bottleneck = {
            from: steps[i].label,
            to: steps[i + 1].label,
            dropPct,
            recommendation: BOTTLENECK_TIPS[key] || 'Avaliar processo de acompanhamento nesta etapa.',
          };
        }
      }

      // Stalled lives: encaminhamentos not progressing
      // Get celula names for context
      const celulaIds = [...new Set(encs.map(e => e.celula_id))];
      let celulaMap = new Map<string, string>();
      if (celulaIds.length > 0) {
        const { data: cels } = await supabase.from('celulas').select('id, name').in('id', celulaIds);
        (cels || []).forEach(c => celulaMap.set(c.id, c.name));
      }

      // Build vida name map
      const vidaMap = new Map<string, { nome: string; whatsapp: string | null }>();
      vidas.forEach(v => vidaMap.set(v.id, { nome: v.nome, whatsapp: v.whatsapp }));

      const now = Date.now();
      const stalledLives: StalledLife[] = encs
        .filter(e => !e.promovido_membro_at && e.status !== 'devolvido')
        .map(e => {
          const vida = vidaMap.get(e.nova_vida_id);
          const lastUpdate = e.updated_at || e.data_encaminhamento;
          const diasParado = Math.floor((now - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
          let etapa = 'encaminhada';
          if (e.integrado_at || e.status === 'integrado') etapa = 'integrado';
          else if (e.contatado_at || e.status === 'contatado') etapa = 'contatado';
          else if (e.status === 'agendado') etapa = 'agendado';
          else if (e.status === 'sem_resposta') etapa = 'sem_resposta';

          return {
            id: e.id,
            nome: vida?.nome || 'Desconhecido',
            whatsapp: vida?.whatsapp || null,
            etapa,
            dias_parado: diasParado,
            celula_name: celulaMap.get(e.celula_id) || null,
            celula_id: e.celula_id,
            rede_id: e.rede_id,
          };
        })
        .sort((a, b) => b.dias_parado - a.dias_parado);

      return { steps, bottleneck, stalledLives };
    },
  });
}
