import { useDemoFilter } from './useDemoFilter';
import { useCampoFilterDetailed } from './useCampoFilter';
import { useRede } from '@/contexts/RedeContext';

/**
 * useDemoScope – Camada unificada de escopo para todos os hooks de dados.
 *
 * Combina:
 * - useCampoFilterDetailed: campus ativo (real ou validação) + missing detection
 * - useDemoFilter: modo Torre/validação ativo (campus, rede, coordenação, célula)
 * - useRede: rede ativa do contexto real
 *
 * REGRA MÁXIMA: fora da Visão Global, campoId NUNCA pode ser null.
 * Se for, `isMissingCampo` será true e os hooks devem bloquear queries.
 */
export function useDemoScope() {
  const { isDemoActive, demoCampusId, demoRedeId, demoCoordenacaoId, demoCelulaId } = useDemoFilter();
  const { campoId: realCampoId, isGlobal, isMissingCampo: realMissing } = useCampoFilterDetailed();
  const { activeRedeId } = useRede();

  // In Torre/validation mode, campus comes from demo context; otherwise from real context
  const campoId = isDemoActive ? demoCampusId : realCampoId;

  // Rede: Torre overrides real context
  const redeId = isDemoActive ? demoRedeId : activeRedeId;

  // Coordenação & Célula: only from Torre (not used in normal mode)
  const coordenacaoId = isDemoActive ? demoCoordenacaoId : null;
  const celulaId = isDemoActive ? demoCelulaId : null;

  // Missing campus: not global, not demo, and no campus set
  const isMissingCampo = !isDemoActive && !isGlobal && !campoId;

  /**
   * Apply scope filters to a Supabase query builder.
   * BLOCKS query if campus is required but missing (returns filtered-to-nothing).
   */
  function applyScope<T extends { eq: (col: string, val: any) => T }>(query: T): T {
    if (isMissingCampo) {
      // Force empty result by filtering impossible value
      console.warn('[useDemoScope] Query blocked: campoId is null outside global view');
      query = query.eq('campo_id', '00000000-0000-0000-0000-000000000000');
      return query;
    }
    if (campoId) {
      query = query.eq('campo_id', campoId);
    }
    return query;
  }

  /**
   * Apply only campus filter (for tables without is_test_data/seed_run_id).
   */
  function applyCampoOnly<T extends { eq: (col: string, val: any) => T }>(query: T): T {
    if (isMissingCampo) {
      console.warn('[useDemoScope] Query blocked: campoId is null outside global view');
      query = query.eq('campo_id', '00000000-0000-0000-0000-000000000000');
      return query;
    }
    if (campoId) {
      query = query.eq('campo_id', campoId);
    }
    return query;
  }

  /**
   * Apply rede filter in addition to campus filter.
   */
  function applyRedeScope<T extends { eq: (col: string, val: any) => T }>(query: T): T {
    query = applyCampoOnly(query);
    if (redeId) {
      query = query.eq('rede_id', redeId);
    }
    return query;
  }

  /**
   * Extra keys to add to react-query queryKey for proper cache isolation.
   * Includes rede for rede-level isolation.
   */
  const queryKeyExtra = isDemoActive
    ? ['torre', campoId ?? 'all', redeId ?? 'all-rede']
    : ['real', campoId ?? 'all', redeId ?? 'all-rede'];

  return {
    isDemoActive,
    isGlobal,
    campoId,
    redeId,
    coordenacaoId,
    celulaId,
    isMissingCampo,
    seedRunId: null as string | null, // Always null — validation reads all data
    applyScope,
    applyCampoOnly,
    applyRedeScope,
    queryKeyExtra,
  };
}
