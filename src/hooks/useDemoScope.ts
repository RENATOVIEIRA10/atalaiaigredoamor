import { useDemoFilter } from './useDemoFilter';
import { useCampoFilter } from './useCampoFilter';

/**
 * useDemoScope – Camada unificada de escopo para todos os hooks de dados.
 *
 * Combina:
 * - useCampoFilter: campus ativo (real ou demo)
 * - useDemoFilter: demo_run_id quando demo ativo
 *
 * Retorna helpers para aplicar filtros de forma consistente em queries Supabase.
 *
 * Quando demo ATIVO:
 *   - is_test_data = true
 *   - seed_run_id = demoRunId
 *   - campo_id = demoCampusId (overrides campus filter)
 *
 * Quando demo INATIVO:
 *   - is_test_data = false (exclui dados de demo/teste)
 *   - campo_id = campus real do contexto
 */
export function useDemoScope() {
  const { isDemoActive, demoRunId, demoCampusId } = useDemoFilter();
  const realCampoId = useCampoFilter();

  // In demo mode, campus comes from demo context; otherwise from real context
  const campoId = isDemoActive ? demoCampusId : realCampoId;
  const seedRunId = isDemoActive ? demoRunId : null;

  /**
   * Apply demo/scope filters to a Supabase query builder.
   * Works with any table that has is_test_data and seed_run_id columns.
   *
   * Usage:
   *   let query = supabase.from('celulas').select('*');
   *   query = applyScope(query);
   */
  function applyScope<T extends { eq: (col: string, val: any) => T }>(query: T): T {
    if (isDemoActive && seedRunId) {
      query = query.eq('is_test_data', true);
      query = query.eq('seed_run_id', seedRunId);
    } else {
      query = query.eq('is_test_data', false);
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
    if (campoId) {
      query = query.eq('campo_id', campoId);
    }
    return query;
  }

  /**
   * Extra keys to add to react-query queryKey for proper cache isolation.
   */
  const queryKeyExtra = isDemoActive
    ? ['demo', seedRunId ?? 'none', campoId ?? 'all']
    : ['real', campoId ?? 'all'];

  return {
    isDemoActive,
    campoId,
    seedRunId,
    applyScope,
    applyCampoOnly,
    queryKeyExtra,
  };
}
