import { useDemoFilter } from './useDemoFilter';
import { useCampoFilterDetailed } from './useCampoFilter';

/**
 * useDemoScope – Camada unificada de escopo para todos os hooks de dados.
 *
 * Combina:
 * - useCampoFilterDetailed: campus ativo (real ou validação) + missing detection
 * - useDemoFilter: modo validação ativo
 *
 * REGRA MÁXIMA: fora da Visão Global, campoId NUNCA pode ser null.
 * Se for, `isMissingCampo` será true e os hooks devem bloquear queries.
 */
export function useDemoScope() {
  const { isDemoActive, demoCampusId } = useDemoFilter();
  const { campoId: realCampoId, isGlobal, isMissingCampo: realMissing } = useCampoFilterDetailed();

  // In validation mode, campus comes from demo context; otherwise from real context
  const campoId = isDemoActive ? demoCampusId : realCampoId;

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
   * Extra keys to add to react-query queryKey for proper cache isolation.
   */
  const queryKeyExtra = isDemoActive
    ? ['validacao', campoId ?? 'all']
    : ['real', campoId ?? 'all'];

  return {
    isDemoActive,
    isGlobal,
    campoId,
    isMissingCampo,
    seedRunId: null as string | null, // Always null — validation reads all data
    applyScope,
    applyCampoOnly,
    queryKeyExtra,
  };
}
