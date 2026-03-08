import { useDemoMode } from '@/contexts/DemoModeContext';

/**
 * Returns demo/validation mode state.
 * In validation mode, demoCampusId overrides the real campus filter.
 * Also exposes redeId, coordenacaoId, celulaId from Torre selection.
 */
export function useDemoFilter(): {
  isDemoActive: boolean;
  demoRunId: string | null;
  demoCampusId: string | null;
  demoRedeId: string | null;
  demoCoordenacaoId: string | null;
  demoCelulaId: string | null;
} {
  const { isDemoActive, demoCampusId, demoRedeId, demoCoordenacaoId, demoCelulaId } = useDemoMode();
  
  return {
    isDemoActive,
    demoRunId: null, // Validation mode never uses demo_run_id
    demoCampusId: isDemoActive ? demoCampusId : null,
    demoRedeId: isDemoActive ? demoRedeId : null,
    demoCoordenacaoId: isDemoActive ? demoCoordenacaoId : null,
    demoCelulaId: isDemoActive ? demoCelulaId : null,
  };
}
