import { useDemoMode } from '@/contexts/DemoModeContext';

/**
 * Returns demo/validation mode state.
 * In validation mode, demoCampusId overrides the real campus filter.
 * No demo_run_id is used — validation reads ALL real data.
 */
export function useDemoFilter(): {
  isDemoActive: boolean;
  demoRunId: string | null;
  demoCampusId: string | null;
} {
  const { isDemoActive, demoCampusId } = useDemoMode();
  
  return {
    isDemoActive,
    demoRunId: null, // Validation mode never uses demo_run_id
    demoCampusId: isDemoActive ? demoCampusId : null,
  };
}
