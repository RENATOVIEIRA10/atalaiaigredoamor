import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';

export interface CelulaSaude {
  celula_id: string;
  celula_name: string;
  coordenacao_id: string;
  coordenacao_name: string;
  status: 'saudavel' | 'acompanhamento' | 'critica' | 'sem_avaliacao';
  media: number | null;
  ultima_supervisao: string | null;
  total_supervisoes: number;
  tendencia: 'subindo' | 'estavel' | 'descendo' | null;
}

export interface RadarSaudeData {
  celulas: CelulaSaude[];
  totalCelulas: number;
  saudaveis: number;
  emAcompanhamento: number;
  criticas: number;
  semAvaliacao: number;
}

// Boolean fields from supervisões that form the health score
const CHECKLIST_FIELDS = [
  'oracao_inicial', 'louvor', 'apresentacao_visitantes', 'momento_visao_triade',
  'avisos', 'quebra_gelo', 'licao', 'cadeira_amor', 'oracao_final', 'selfie',
] as const;

const QUALITY_FIELDS = [
  'comunhao', 'pontualidade', 'dinamica', 'organizacao', 'interatividade',
] as const;

function calcScore(sup: Record<string, any>): number {
  // Checklist items: each true = 1, false = 0. Weighted 60%
  const checklistScore = CHECKLIST_FIELDS.reduce((sum, f) => sum + (sup[f] ? 1 : 0), 0) / CHECKLIST_FIELDS.length;
  // Quality items: each true = 1, false = 0. Weighted 40%
  const qualityScore = QUALITY_FIELDS.reduce((sum, f) => sum + (sup[f] ? 1 : 0), 0) / QUALITY_FIELDS.length;
  // Scale to 0-5
  return (checklistScore * 0.6 + qualityScore * 0.4) * 5;
}

function getStatus(media: number | null): CelulaSaude['status'] {
  if (media === null) return 'sem_avaliacao';
  if (media >= 4.0) return 'saudavel';
  if (media >= 3.0) return 'acompanhamento';
  return 'critica';
}

function getTendencia(scores: number[]): CelulaSaude['tendencia'] {
  if (scores.length < 2) return null;
  const recent = scores[0];
  const previous = scores.slice(1).reduce((a, b) => a + b, 0) / (scores.length - 1);
  const diff = recent - previous;
  if (diff > 0.3) return 'subindo';
  if (diff < -0.3) return 'descendo';
  return 'estavel';
}

interface UseRadarSaudeOptions {
  scopeType: 'rede' | 'coordenacao' | 'all';
  scopeId?: string;
  campoId?: string | null;
}

export function useRadarSaude({ scopeType, scopeId, campoId }: UseRadarSaudeOptions) {
  const { isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['radar-saude', scopeType, scopeId, campoId, ...queryKeyExtra],
    queryFn: async (): Promise<RadarSaudeData> => {
      // 1) Fetch all cells in scope
      let celulasQuery = supabase
        .from('celulas')
        .select('id, name, coordenacao_id, coordenacao:coordenacoes(id, name, rede_id)');

      // No is_test_data filter — reads all data

      if (campoId) celulasQuery = celulasQuery.eq('campo_id', campoId);

      if (scopeType === 'coordenacao' && scopeId) {
        celulasQuery = celulasQuery.eq('coordenacao_id', scopeId);
      }

      const { data: celulas, error: celErr } = await celulasQuery;
      if (celErr) throw celErr;

      // Filter by rede if needed
      let filteredCelulas = celulas || [];
      if (scopeType === 'rede' && scopeId) {
        filteredCelulas = filteredCelulas.filter((c: any) => c.coordenacao?.rede_id === scopeId);
      }

      if (filteredCelulas.length === 0) {
        return { celulas: [], totalCelulas: 0, saudaveis: 0, emAcompanhamento: 0, criticas: 0, semAvaliacao: 0 };
      }

      const celulaIds = filteredCelulas.map(c => c.id);

      // 2) Fetch last 3 supervisões per cell (ordered by date desc)
      const { data: supervisoes, error: supErr } = await supabase
        .from('supervisoes')
        .select('*')
        .in('celula_id', celulaIds)
        .eq('celula_realizada', true)
        .order('data_supervisao', { ascending: false });

      if (supErr) throw supErr;

      // Group by celula_id, take last 3
      const supsByCelula: Record<string, any[]> = {};
      for (const s of (supervisoes || [])) {
        if (!supsByCelula[s.celula_id]) supsByCelula[s.celula_id] = [];
        if (supsByCelula[s.celula_id].length < 3) {
          supsByCelula[s.celula_id].push(s);
        }
      }

      // 3) Calculate health for each cell
      const result: CelulaSaude[] = filteredCelulas.map((cel: any) => {
        const sups = supsByCelula[cel.id] || [];
        if (sups.length === 0) {
          return {
            celula_id: cel.id,
            celula_name: cel.name,
            coordenacao_id: cel.coordenacao_id,
            coordenacao_name: cel.coordenacao?.name || '',
            status: 'sem_avaliacao' as const,
            media: null,
            ultima_supervisao: null,
            total_supervisoes: 0,
            tendencia: null,
          };
        }

        const scores = sups.map(calcScore);
        const media = scores.reduce((a, b) => a + b, 0) / scores.length;

        return {
          celula_id: cel.id,
          celula_name: cel.name,
          coordenacao_id: cel.coordenacao_id,
          coordenacao_name: cel.coordenacao?.name || '',
          status: getStatus(media),
          media: Math.round(media * 10) / 10,
          ultima_supervisao: sups[0].data_supervisao,
          total_supervisoes: sups.length,
          tendencia: getTendencia(scores),
        };
      });

      // Sort: criticas first, then acompanhamento, then sem_avaliacao, then saudavel
      const statusOrder = { critica: 0, acompanhamento: 1, sem_avaliacao: 2, saudavel: 3 };
      result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

      return {
        celulas: result,
        totalCelulas: result.length,
        saudaveis: result.filter(c => c.status === 'saudavel').length,
        emAcompanhamento: result.filter(c => c.status === 'acompanhamento').length,
        criticas: result.filter(c => c.status === 'critica').length,
        semAvaliacao: result.filter(c => c.status === 'sem_avaliacao').length,
      };
    },
    enabled: scopeType === 'all' || !!scopeId,
  });
}
