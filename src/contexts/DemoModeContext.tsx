import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRole } from './RoleContext';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_cadastro' | 'lider_recomeco_central' | 'central_celulas' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo';

interface DemoModeContextType {
  isDemoActive: boolean;
  demoScopeType: DemoScopeType | null;
  demoScopeId: string | null;
  demoLabel: string | null;
  /** The seed_run_id whose data should be shown in demo mode */
  demoRunId: string | null;
  /** Campus currently selected in demo (for multi-campus switching) */
  demoCampusId: string | null;
  activateDemo: (scopeType: DemoScopeType, scopeId: string | null, label: string, runId?: string | null, campusId?: string | null) => void;
  deactivateDemo: () => void;
  /** Switch the demo seed run (e.g. after reset/regenerate) */
  setDemoRunId: (runId: string | null) => void;
  /** Switch the campus in demo without leaving demo mode */
  setDemoCampusId: (campusId: string | null) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'rede_amor_demo';

interface DemoStoredState {
  active: boolean;
  scopeType: DemoScopeType;
  scopeId: string | null;
  label: string;
  savedAccessKeyId: string | null;
  demoRunId: string | null;
  demoCampusId: string | null;
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, setScopeAccess, accessKeyId } = useRole();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoScopeType, setDemoScopeType] = useState<DemoScopeType | null>(null);
  const [demoScopeId, setDemoScopeId] = useState<string | null>(null);
  const [demoLabel, setDemoLabel] = useState<string | null>(null);
  const [savedAccessKeyId, setSavedAccessKeyId] = useState<string | null>(null);
  const [demoRunId, setDemoRunIdState] = useState<string | null>(null);
  const [demoCampusId, setDemoCampusIdState] = useState<string | null>(null);

  const persistState = useCallback((state: DemoStoredState) => {
    try { sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, []);

  const activateDemo = useCallback((
    scopeType: DemoScopeType,
    scopeId: string | null,
    label: string,
    runId?: string | null,
    campusId?: string | null,
  ) => {
    if (!isAdmin && !isDemoActive) return;
    
    // Save current admin accessKeyId on first activation
    const akId = isDemoActive ? savedAccessKeyId : accessKeyId;
    if (!isDemoActive) {
      setSavedAccessKeyId(accessKeyId);
    }
    
    setIsDemoActive(true);
    setDemoScopeType(scopeType);
    setDemoScopeId(scopeId);
    setDemoLabel(label);
    if (runId !== undefined) setDemoRunIdState(runId ?? null);
    if (campusId !== undefined) setDemoCampusIdState(campusId ?? null);
    
    // Switch scope but KEEP the admin's accessKeyId so policy guard passes
    setScopeAccess(scopeType, scopeId, akId);
    
    persistState({
      active: true,
      scopeType,
      scopeId,
      label,
      savedAccessKeyId: akId,
      demoRunId: runId ?? demoRunId,
      demoCampusId: campusId ?? demoCampusId,
    });
  }, [isAdmin, isDemoActive, setScopeAccess, accessKeyId, savedAccessKeyId, demoRunId, demoCampusId, persistState]);

  const deactivateDemo = useCallback(() => {
    const akId = savedAccessKeyId;
    setIsDemoActive(false);
    setDemoScopeType(null);
    setDemoScopeId(null);
    setDemoLabel(null);
    setSavedAccessKeyId(null);
    setDemoRunIdState(null);
    setDemoCampusIdState(null);
    
    // Restore admin with the original accessKeyId
    setScopeAccess('admin', null, akId);
    
    try { sessionStorage.removeItem(DEMO_STORAGE_KEY); } catch {}
  }, [setScopeAccess, savedAccessKeyId]);

  const setDemoRunId = useCallback((runId: string | null) => {
    setDemoRunIdState(runId);
  }, []);

  const setDemoCampusId = useCallback((campusId: string | null) => {
    setDemoCampusIdState(campusId);
  }, []);

  return (
    <DemoModeContext.Provider value={{
      isDemoActive, demoScopeType, demoScopeId, demoLabel,
      demoRunId, demoCampusId,
      activateDemo, deactivateDemo,
      setDemoRunId, setDemoCampusId,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) throw new Error('useDemoMode must be used within DemoModeProvider');
  return context;
}
