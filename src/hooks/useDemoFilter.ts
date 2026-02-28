import { useDemoMode } from '@/contexts/DemoModeContext';

/**
 * Returns the active demo_run_id (seed_run_id) when demo mode is active.
 * Hooks should use this to add `.eq('seed_run_id', demoRunId)` to queries
 * and `.eq('is_test_data', true)` when demoRunId is set.
 * 
 * Returns null when demo is inactive → hooks use normal (real) data.
 */
export function useDemoFilter(): {
  isDemoActive: boolean;
  demoRunId: string | null;
  demoCampusId: string | null;
} {
  const { isDemoActive, demoRunId, demoCampusId } = useDemoMode();
  
  return {
    isDemoActive,
    demoRunId: isDemoActive ? demoRunId : null,
    demoCampusId: isDemoActive ? demoCampusId : null,
  };
}
