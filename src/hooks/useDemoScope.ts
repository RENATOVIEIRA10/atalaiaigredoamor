import { useDemoFilter } from './useDemoFilter';
import { useCampoFilter } from './useCampoFilter';

/**
 * useDemoScope – Camada unificada de escopo para todos os hooks de dados.
 *
 * Combina:
 * - useCampoFilter: campus ativo (real ou validação)
 * - useDemoFilter: modo validação ativo
 *
 * MODO VALIDAÇÃO (read-only):
 *   - Lê TODOS os dados reais do sistema (não filtra is_test_data)
 *   - campus = demoCampusId (override do contexto demo)
 *   - Sem filtro de seed_run_id
 *
 * MODO NORMAL:
 *   - campus = campus real do contexto
 *   - Sem filtro especial
 */
export function useDemoScope() {
  const { isDemoActive, demoCampusId } = useDemoFilter();
  const realCampoId = useCampoFilter();

  // In validation mode, campus comes from demo context; otherwise from real context
  const campoId = isDemoActive ? demoCampusId : realCampoId;

  /**
   * Apply scope filters to a Supabase query builder.
   * In validation mode: no is_test_data filter (reads ALL data).
   * In normal mode: no special filter either.
   * Campus filter always applied when set.
   */
  function applyScope<T extends { eq: (col: string, val: any) => T }>(query: T): T {
    // Validation mode reads all data — no is_test_data filtering
    if (campoId) {
      query = query.eq('campo_id', campoId);
    }
    return query;
  }

  /**
   * Apply only campus filter (for tables without is_test_data/seed_run_id).
   */
  function applyCampoOnly<T extends { eq: (col: string, val: any) => T }>(query: T): T {
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
    campoId,
    seedRunId: null as string | null, // Always null — validation reads all data
    applyScope,
    applyCampoOnly,
    queryKeyExtra,
  };
}
