/**
 * useSupervisaoRedeOverview.ts
 * 
 * Provides rede-level supervision overview data for the Network Leader PWA.
 * - Supervisões this week
 * - Bimestre coverage progress
 * - Pending supervisions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BIMESTRE_START = '2026-02-24';
const BIMESTRE_DURATION_DAYS = 60;

export interface SupervisaoSemana {
  id: string;
  celula_name: string;
  coordenacao_name: string;
  supervisor_name: string;
  data_supervisao: string;
  celula_realizada: boolean;
  is_coordinator_supervision: boolean;
}

export interface CelulaPendente {
  celula_id: string;
  celula_name: string;
  coordenacao_name: string;
  leadership_couple_name: string;
  days_since_last: number | null;
}

export interface SupervisaoRedeOverview {
  supervisoes_semana: SupervisaoSemana[];
  total_celulas: number;
  celulas_supervisionadas_bimestre: number;
  cobertura_percentual: number;
  bimestre_label: string;
  pendencias: CelulaPendente[];
}

export function useSupervisaoRedeOverview(redeId: string) {
  return useQuery({
    queryKey: ['supervisao-rede-overview', redeId],
    queryFn: async (): Promise<SupervisaoRedeOverview> => {
      // 1) Get coordenações da rede
      const { data: coordenacoes } = await supabase
        .from('coordenacoes')
        .select('id, name')
        .eq('rede_id', redeId);

      const coordIds = (coordenacoes || []).map(c => c.id);
      const coordMap = new Map((coordenacoes || []).map(c => [c.id, c.name]));

      if (coordIds.length === 0) {
        return emptyResult();
      }

      // 2) Get all cells in the rede
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, name, coordenacao_id, leadership_couple_id, leadership_couple:leadership_couples(spouse1:profiles!leadership_couples_spouse1_id_fkey(name), spouse2:profiles!leadership_couples_spouse2_id_fkey(name))')
        .in('coordenacao_id', coordIds)
        .eq('is_test_data', false);

      const allCelulas = celulas || [];
      const celulaMap = new Map(allCelulas.map(c => [c.id, c]));

      // 3) Get supervisors for name resolution
      const { data: supervisores } = await supabase
        .from('supervisores')
        .select('id, coordenacao_id, leadership_couple_id, profile:profiles!supervisores_profile_id_fkey(name), leadership_couple:leadership_couples(spouse1:profiles!leadership_couples_spouse1_id_fkey(name), spouse2:profiles!leadership_couples_spouse2_id_fkey(name))')
        .in('coordenacao_id', coordIds);

      const supMap = new Map((supervisores || []).map(s => [s.id, s]));
      const supCoupleIds = new Set((supervisores || []).filter(s => s.leadership_couple_id).map(s => s.leadership_couple_id));

      // 4) Supervisões this week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const { data: supsSemana } = await supabase
        .from('supervisoes')
        .select('id, celula_id, supervisor_id, data_supervisao, celula_realizada')
        .in('celula_id', allCelulas.map(c => c.id))
        .gte('data_supervisao', weekStartStr)
        .lte('data_supervisao', weekEndStr);

      const supervisoesSemana: SupervisaoSemana[] = (supsSemana || []).map(s => {
        const cel = celulaMap.get(s.celula_id);
        const sup = supMap.get(s.supervisor_id);
        const supName = sup?.leadership_couple
          ? `${(sup.leadership_couple as any).spouse1?.name?.split(' ')[0] || ''} & ${(sup.leadership_couple as any).spouse2?.name?.split(' ')[0] || ''}`
          : (sup?.profile as any)?.name || 'Supervisor';
        const isCoordSup = cel?.leadership_couple_id ? supCoupleIds.has(cel.leadership_couple_id) : false;

        return {
          id: s.id,
          celula_name: cel?.name || 'Célula',
          coordenacao_name: coordMap.get(cel?.coordenacao_id || '') || '',
          supervisor_name: supName,
          data_supervisao: s.data_supervisao,
          celula_realizada: s.celula_realizada,
          is_coordinator_supervision: isCoordSup,
        };
      });

      // 5) Bimestre coverage
      const bimestreEnd = format(addDays(new Date(BIMESTRE_START + 'T12:00:00'), BIMESTRE_DURATION_DAYS), 'yyyy-MM-dd');

      const { data: bimestreSups } = await supabase
        .from('supervisoes')
        .select('celula_id')
        .in('celula_id', allCelulas.map(c => c.id))
        .gte('data_supervisao', BIMESTRE_START)
        .lte('data_supervisao', bimestreEnd)
        .eq('celula_realizada', true);

      const supervisionadasSet = new Set((bimestreSups || []).map(s => s.celula_id));
      const totalCelulas = allCelulas.length;
      const celulasSupervisionadas = supervisionadasSet.size;
      const cobertura = totalCelulas > 0 ? Math.round((celulasSupervisionadas / totalCelulas) * 100) : 0;

      // 6) Last supervision per cell for pendências
      const { data: allSups } = await supabase
        .from('supervisoes')
        .select('celula_id, data_supervisao')
        .in('celula_id', allCelulas.map(c => c.id))
        .eq('celula_realizada', true)
        .order('data_supervisao', { ascending: false });

      const lastSupMap = new Map<string, string>();
      for (const s of (allSups || [])) {
        if (!lastSupMap.has(s.celula_id)) {
          lastSupMap.set(s.celula_id, s.data_supervisao);
        }
      }

      const pendencias: CelulaPendente[] = allCelulas
        .filter(c => !supervisionadasSet.has(c.id))
        .map(c => {
          const lastSup = lastSupMap.get(c.id);
          const couple = c.leadership_couple as any;
          const coupleName = couple
            ? `${couple.spouse1?.name?.split(' ')[0] || ''} & ${couple.spouse2?.name?.split(' ')[0] || ''}`
            : 'Sem líderes';
          return {
            celula_id: c.id,
            celula_name: c.name,
            coordenacao_name: coordMap.get(c.coordenacao_id) || '',
            leadership_couple_name: coupleName,
            days_since_last: lastSup ? differenceInDays(now, new Date(lastSup + 'T12:00:00')) : null,
          };
        })
        .sort((a, b) => {
          // Nulls (never supervised) first, then by longest wait
          if (a.days_since_last === null && b.days_since_last === null) return 0;
          if (a.days_since_last === null) return -1;
          if (b.days_since_last === null) return 1;
          return b.days_since_last - a.days_since_last;
        });

      return {
        supervisoes_semana: supervisoesSemana,
        total_celulas: totalCelulas,
        celulas_supervisionadas_bimestre: celulasSupervisionadas,
        cobertura_percentual: cobertura,
        bimestre_label: `Bimestre ${format(new Date(BIMESTRE_START + 'T12:00:00'), "dd/MM/yyyy")}`,
        pendencias,
      };
    },
    enabled: !!redeId,
    staleTime: 5 * 60 * 1000, // 5 min stale-while-revalidate
  });
}

function emptyResult(): SupervisaoRedeOverview {
  return {
    supervisoes_semana: [],
    total_celulas: 0,
    celulas_supervisionadas_bimestre: 0,
    cobertura_percentual: 0,
    bimestre_label: '',
    pendencias: [],
  };
}
