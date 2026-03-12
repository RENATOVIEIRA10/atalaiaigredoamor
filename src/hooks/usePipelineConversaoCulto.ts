/**
 * usePipelineConversaoCulto
 *
 * Funil de conversão completo: Culto → Novas Vidas → Recomeço → Células → Membros
 *
 * Conecta dados de:
 *   - culto_contagens   (Guardiões): público total e novas vidas declaradas
 *   - novas_vidas       (Recomeço):  registros cadastrados no sistema
 *   - encaminhamentos_recomeco:      roteamento para células
 *   - encaminhamentos.integrado_at:  inserção em célula
 *   - encaminhamentos.promovido_membro_at: membro efetivo
 *
 * Suporta escopo de campo (campo_id) e visão global (campo_id = null).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';

export type PipelinePeriod = 7 | 30 | 90;

/** Data LOCAL em YYYY-MM-DD — evita bug de fuso do toISOString(). */
function localDateIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sinceDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateIso(d);
}

export interface PipelineStep {
  key: string;
  label: string;
  icon: string;
  value: number;
  /** % em relação ao primeiro passo (público no culto) */
  pctBase: number;
  /** % em relação ao passo anterior (taxa de conversão entre etapas) */
  convRate: number;
}

export interface HistoricoCulto {
  data: string;
  horario: string | null;
  presentes: number;
  novas_vidas: number;
}

export interface PipelineCultoData {
  period: PipelinePeriod;

  // ── Guardiões ──
  totalCultos: number;
  totalPresentes: number;
  novasVidasDeclaradas: number;

  // ── Recomeço ──
  cadastradasRecomeco: number;
  encaminhadas: number;
  integradas: number;
  membros: number;

  // ── Taxas globais ──
  taxaDeclaracao: number;     // novasVidasDeclaradas / totalPresentes (%)
  taxaRegistro: number;       // cadastradas / novasVidasDeclaradas (%)
  taxaEncaminhamento: number; // encaminhadas / cadastradas (%)
  taxaIntegracao: number;     // integradas / encaminhadas (%)
  taxaMembro: number;         // membros / integradas (%)
  taxaConversaoFinal: number; // membros / novasVidasDeclaradas (%)

  // ── Funil visual ──
  steps: PipelineStep[];

  // ── Histórico recente de cultos ──
  historicoCultos: HistoricoCulto[];
}

function pct(n: number, base: number): number {
  return base > 0 ? Math.round((n / base) * 100) : 0;
}

export function usePipelineConversaoCulto(
  period: PipelinePeriod = 30,
  overrideCampoId?: string | null,
) {
  const { campoId: scopeCampoId } = useDemoScope();
  const campoId = overrideCampoId !== undefined ? overrideCampoId : scopeCampoId;

  return useQuery({
    queryKey: ['pipeline-conversao-culto', campoId ?? 'global', period],
    staleTime: 60_000,
    queryFn: async (): Promise<PipelineCultoData> => {
      const since = sinceDate(period);

      // ── 1. Culto data (Guardiões) ──────────────────────────────────────────
      let cultoQ = (supabase as any)
        .from('culto_contagens')
        .select('data, horario, total_presentes, novas_vidas_count')
        .eq('status', 'encerrado')
        .gte('data', since)
        .order('data', { ascending: false });
      if (campoId) cultoQ = cultoQ.eq('campo_id', campoId);
      const { data: cultos } = await cultoQ;
      const cultosData: any[] = cultos ?? [];

      const totalCultos = cultosData.length;
      const totalPresentes = cultosData.reduce((s, c) => s + (c.total_presentes ?? 0), 0);
      const novasVidasDeclaradas = cultosData.reduce((s, c) => s + (c.novas_vidas_count ?? 0), 0);

      const historicoCultos: HistoricoCulto[] = cultosData.slice(0, 12).map(c => ({
        data: c.data,
        horario: c.horario ?? null,
        presentes: c.total_presentes ?? 0,
        novas_vidas: c.novas_vidas_count ?? 0,
      }));

      // ── 2. Novas vidas cadastradas no Recomeço no período ──────────────────
      let nvQ = (supabase as any)
        .from('novas_vidas')
        .select('id')
        .gte('created_at', since + 'T00:00:00');
      if (campoId) nvQ = nvQ.eq('campo_id', campoId);
      const { data: nvData } = await nvQ;
      const vidas: any[] = nvData ?? [];
      const cadastradasRecomeco = vidas.length;

      // ── 3. Encaminhamentos (routing e progresso) ───────────────────────────
      let encaminhadas = 0;
      let integradas = 0;
      let membros = 0;

      if (vidas.length > 0) {
        const vidaIds = vidas.map(v => v.id);
        // Batch in chunks of 100 to avoid URL length limits
        const allEncs: any[] = [];
        for (let i = 0; i < vidaIds.length; i += 100) {
          const chunk = vidaIds.slice(i, i + 100);
          let encQ = (supabase as any)
            .from('encaminhamentos_recomeco')
            .select('id, integrado_at, promovido_membro_at, status')
            .in('nova_vida_id', chunk);
          if (campoId) encQ = encQ.eq('campo_id', campoId);
          const { data: encData } = await encQ;
          allEncs.push(...(encData ?? []));
        }

        encaminhadas = allEncs.length;
        integradas = allEncs.filter(
          e => e.integrado_at || e.status === 'integrado'
        ).length;
        membros = allEncs.filter(e => !!e.promovido_membro_at).length;
      }

      // ── 4. Taxas globais ───────────────────────────────────────────────────
      const taxaDeclaracao = pct(novasVidasDeclaradas, totalPresentes);
      const taxaRegistro = pct(cadastradasRecomeco, novasVidasDeclaradas);
      const taxaEncaminhamento = pct(encaminhadas, cadastradasRecomeco);
      const taxaIntegracao = pct(integradas, encaminhadas);
      const taxaMembro = pct(membros, integradas);
      const taxaConversaoFinal = pct(membros, novasVidasDeclaradas);

      // ── 5. Funil visual ────────────────────────────────────────────────────
      const steps: PipelineStep[] = [
        {
          key: 'presentes',
          label: 'Público no culto',
          icon: '👥',
          value: totalPresentes,
          pctBase: 100,
          convRate: 100,
        },
        {
          key: 'novas_vidas',
          label: 'Novas vidas',
          icon: '✝️',
          value: novasVidasDeclaradas,
          pctBase: pct(novasVidasDeclaradas, totalPresentes),
          convRate: pct(novasVidasDeclaradas, totalPresentes),
        },
        {
          key: 'cadastradas',
          label: 'Cadastradas no Recomeço',
          icon: '📝',
          value: cadastradasRecomeco,
          pctBase: pct(cadastradasRecomeco, totalPresentes),
          convRate: pct(cadastradasRecomeco, novasVidasDeclaradas),
        },
        {
          key: 'encaminhadas',
          label: 'Encaminhadas à Central',
          icon: '📍',
          value: encaminhadas,
          pctBase: pct(encaminhadas, totalPresentes),
          convRate: pct(encaminhadas, cadastradasRecomeco),
        },
        {
          key: 'integradas',
          label: 'Inseridas em células',
          icon: '🌱',
          value: integradas,
          pctBase: pct(integradas, totalPresentes),
          convRate: pct(integradas, encaminhadas),
        },
        {
          key: 'membros',
          label: 'Tornaram-se membros',
          icon: '🙌',
          value: membros,
          pctBase: pct(membros, totalPresentes),
          convRate: pct(membros, integradas),
        },
      ];

      return {
        period,
        totalCultos,
        totalPresentes,
        novasVidasDeclaradas,
        cadastradasRecomeco,
        encaminhadas,
        integradas,
        membros,
        taxaDeclaracao,
        taxaRegistro,
        taxaEncaminhamento,
        taxaIntegracao,
        taxaMembro,
        taxaConversaoFinal,
        steps,
        historicoCultos,
      };
    },
  });
}
