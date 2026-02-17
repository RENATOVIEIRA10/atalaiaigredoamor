import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRole } from './RoleContext';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';

interface DemoModeContextType {
  isDemoActive: boolean;
  demoScopeType: DemoScopeType | null;
  demoScopeId: string | null;
  demoLabel: string | null;
  activateDemo: (scopeType: DemoScopeType, scopeId: string | null, label: string) => void;
  deactivateDemo: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'rede_amor_demo';

interface DemoStoredState {
  active: boolean;
  scopeType: DemoScopeType;
  scopeId: string | null;
  label: string;
  savedAccessKeyId: string | null;
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, setScopeAccess, accessKeyId } = useRole();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoScopeType, setDemoScopeType] = useState<DemoScopeType | null>(null);
  const [demoScopeId, setDemoScopeId] = useState<string | null>(null);
  const [demoLabel, setDemoLabel] = useState<string | null>(null);
  const [savedAccessKeyId, setSavedAccessKeyId] = useState<string | null>(null);

  const activateDemo = useCallback((scopeType: DemoScopeType, scopeId: string | null, label: string) => {
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
    
    // Switch scope but KEEP the admin's accessKeyId so policy guard passes
    setScopeAccess(scopeType, scopeId, akId);
    
    // Persist demo state
    try {
      const state: DemoStoredState = {
        active: true,
        scopeType,
        scopeId,
        label,
        savedAccessKeyId: akId,
      };
      sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [isAdmin, isDemoActive, setScopeAccess, accessKeyId, savedAccessKeyId]);

  const deactivateDemo = useCallback(() => {
    const akId = savedAccessKeyId;
    setIsDemoActive(false);
    setDemoScopeType(null);
    setDemoScopeId(null);
    setDemoLabel(null);
    setSavedAccessKeyId(null);
    
    // Restore admin with the original accessKeyId
    setScopeAccess('admin', null, akId);
    
    // Clear demo storage
    try { sessionStorage.removeItem(DEMO_STORAGE_KEY); } catch {}
  }, [setScopeAccess, savedAccessKeyId]);

  return (
    <DemoModeContext.Provider value={{ isDemoActive, demoScopeType, demoScopeId, demoLabel, activateDemo, deactivateDemo }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) throw new Error('useDemoMode must be used within DemoModeProvider');
  return context;
}
