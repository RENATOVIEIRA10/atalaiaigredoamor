/**
 * useCultoContagensRelatorio
 * Fetches culto_contagens for the Pastor de Campo dashboard.
 * Provides aggregated stats: total cultos, average attendance,
 * peak attendance, total novas_vidas, conversions trend.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';
import { CultoContagem } from './useGuardioesCulto';

/** Data LOCAL no formato YYYY-MM-DD — evita deslocamento de fuso do toISOString(). */
function localDateIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface CultoStats {
  totalCultos: number;
  mediaPresentes: number;
  picoPresentesCulto: number;
  picoData: string | null;
  totalNovasVidas: number;
  totalDecisoesEspirituais: number;
  totalBatismosAgendados: number;
  ultimoCulto: CultoContagem | null;
  ultimas4Semanas: CultoContagem[];
  tendencia: 'crescendo' | 'estavel' | 'caindo';
}

export function useCultoContagensRelatorio(days = 90) {
  const { activeCampoId } = useCampo();

  return useQuery({
    queryKey: ['culto-contagens-relatorio', activeCampoId, days],
    enabled: !!activeCampoId,
    staleTime: 60_000,
    queryFn: async (): Promise<CultoStats> => {
      const from = new Date();
      from.setDate(from.getDate() - days);
      const fromStr = localDateIso(from);

      const { data } = await (supabase as any)
        .from('culto_contagens')
        .select('*')
        .eq('campo_id', activeCampoId!)
        .eq('status', 'encerrado')
        .gte('data', fromStr)
        .order('data', { ascending: false });

      const rows: CultoContagem[] = data ?? [];

      if (rows.length === 0) {
        return {
          totalCultos: 0,
          mediaPresentes: 0,
          picoPresentesCulto: 0,
          picoData: null,
          totalNovasVidas: 0,
          totalDecisoesEspirituais: 0,
          totalBatismosAgendados: 0,
          ultimoCulto: null,
          ultimas4Semanas: [],
          tendencia: 'estavel',
        };
      }

      const totalPresentes = rows.reduce((s, r) => s + r.total_presentes, 0);
      const media = Math.round(totalPresentes / rows.length);
      const pico = rows.reduce((a, b) => (a.total_presentes > b.total_presentes ? a : b));
      const totalNovasVidas = rows.reduce((s, r) => s + r.novas_vidas_count, 0);
      const totalDecisoes = rows.reduce((s, r) => s + r.decisoes_espirituais, 0);
      const totalBatismos = rows.reduce((s, r) => s + r.batismos_agendados, 0);

      // Last 4 weeks (up to 8 cultos)
      const ultimas4Semanas = rows.slice(0, 8);

      // Trend: compare first half vs second half of period
      let tendencia: 'crescendo' | 'estavel' | 'caindo' = 'estavel';
      if (rows.length >= 4) {
        const half = Math.floor(rows.length / 2);
        const recent = rows.slice(0, half);
        const older = rows.slice(half);
        const avgRecent = recent.reduce((s, r) => s + r.total_presentes, 0) / recent.length;
        const avgOlder = older.reduce((s, r) => s + r.total_presentes, 0) / older.length;
        const delta = ((avgRecent - avgOlder) / avgOlder) * 100;
        if (delta > 5) tendencia = 'crescendo';
        else if (delta < -5) tendencia = 'caindo';
      }

      return {
        totalCultos: rows.length,
        mediaPresentes: media,
        picoPresentesCulto: pico.total_presentes,
        picoData: pico.data,
        totalNovasVidas,
        totalDecisoesEspirituais: totalDecisoes,
        totalBatismosAgendados: totalBatismos,
        ultimoCulto: rows[0] || null,
        ultimas4Semanas,
        tendencia,
      };
    },
  });
}
