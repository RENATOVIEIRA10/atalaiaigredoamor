import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';
import { differenceInDays } from 'date-fns';

export type AlertType = 'precisa_cuidado' | 'risco_estagnacao' | 'risco_isolamento';

export interface CuidadoAlert {
  id: string;
  type: AlertType;
  memberName: string;
  celulaName: string;
  celulaId: string;
  coordenacaoId: string;
  redeId: string;
  yearsInChurch: number;
  isDiscipulado: boolean;
  serveMinisterio: boolean;
  marcosCount: number;
  marcos: {
    batismo: boolean;
    encontro: boolean;
    cursoLidere: boolean;
    renovo: boolean;
  };
}

export interface CuidadoSummary {
  alerts: CuidadoAlert[];
  totalMembers: number;
  precisaCuidado: CuidadoAlert[];
  riscoEstagnacao: CuidadoAlert[];
  riscoIsolamento: CuidadoAlert[];
  byCelula: Record<string, CuidadoAlert[]>;
  byCoordenacao: Record<string, CuidadoAlert[]>;
  byRede: Record<string, CuidadoAlert[]>;
}

interface UseCuidadoEspiritualOptions {
  celulaId?: string;
  coordenacaoId?: string;
  redeId?: string;
}

export function useCuidadoEspiritual(options: UseCuidadoEspiritualOptions = {}) {
  const { campoId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['cuidado-espiritual', campoId, options.celulaId, options.coordenacaoId, options.redeId, ...queryKeyExtra],
    queryFn: async (): Promise<CuidadoSummary> => {
      const today = new Date();

      let query = supabase
        .from('members')
        .select(`
          id,
          joined_at,
          is_discipulado,
          serve_ministerio,
          batismo,
          encontro_com_deus,
          curso_lidere,
          renovo,
          is_active,
          celula_id,
          rede_id,
          profile:profiles(name),
          celula:celulas(name, coordenacao_id)
        `)
        .eq('is_active', true);

      if (campoId) query = query.eq('campo_id', campoId);
      if (options.celulaId) query = query.eq('celula_id', options.celulaId);
      if (options.redeId) query = query.eq('rede_id', options.redeId);

      const { data: members } = await query;
      if (!members) return { alerts: [], totalMembers: 0, precisaCuidado: [], riscoEstagnacao: [], riscoIsolamento: [], byCelula: {}, byCoordenacao: {}, byRede: {} };

      // Filter by coordenacao if needed
      let filtered = members as any[];
      if (options.coordenacaoId) {
        filtered = filtered.filter(m => m.celula?.coordenacao_id === options.coordenacaoId);
      }

      const alerts: CuidadoAlert[] = [];

      filtered.forEach((member: any) => {
        const yearsInChurch = differenceInDays(today, new Date(member.joined_at)) / 365;
        const isDiscipulado = !!member.is_discipulado;
        const serveMinisterio = !!member.serve_ministerio;
        const marcos = {
          batismo: !!member.batismo,
          encontro: !!member.encontro_com_deus,
          cursoLidere: !!member.curso_lidere,
          renovo: !!member.renovo,
        };
        const marcosCount = Object.values(marcos).filter(Boolean).length;

        const base: Omit<CuidadoAlert, 'id' | 'type'> = {
          memberName: member.profile?.name || 'Membro',
          celulaName: member.celula?.name || '',
          celulaId: member.celula_id,
          coordenacaoId: member.celula?.coordenacao_id || '',
          redeId: member.rede_id,
          yearsInChurch: Math.floor(yearsInChurch * 10) / 10,
          isDiscipulado,
          serveMinisterio,
          marcosCount,
          marcos,
        };

        // C) Risco de isolamento: sem discipulado + não serve + sem marcos
        if (!isDiscipulado && !serveMinisterio && marcosCount === 0) {
          alerts.push({ ...base, id: `iso_${member.id}`, type: 'risco_isolamento' });
          return; // Most severe — skip other checks
        }

        // B) Risco de estagnação: +2 anos, não serve
        if (yearsInChurch >= 2 && !serveMinisterio) {
          alerts.push({ ...base, id: `stag_${member.id}`, type: 'risco_estagnacao' });
          return;
        }

        // A) Precisa de cuidado: +1 ano, sem discipulado
        if (yearsInChurch >= 1 && !isDiscipulado) {
          alerts.push({ ...base, id: `cuid_${member.id}`, type: 'precisa_cuidado' });
        }
      });

      // Group by entity
      const byCelula: Record<string, CuidadoAlert[]> = {};
      const byCoordenacao: Record<string, CuidadoAlert[]> = {};
      const byRede: Record<string, CuidadoAlert[]> = {};

      alerts.forEach(a => {
        (byCelula[a.celulaId] ??= []).push(a);
        (byCoordenacao[a.coordenacaoId] ??= []).push(a);
        (byRede[a.redeId] ??= []).push(a);
      });

      return {
        alerts,
        totalMembers: filtered.length,
        precisaCuidado: alerts.filter(a => a.type === 'precisa_cuidado'),
        riscoEstagnacao: alerts.filter(a => a.type === 'risco_estagnacao'),
        riscoIsolamento: alerts.filter(a => a.type === 'risco_isolamento'),
        byCelula,
        byCoordenacao,
        byRede,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!campoId,
  });
}
