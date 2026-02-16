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

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, setScopeAccess } = useRole();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoScopeType, setDemoScopeType] = useState<DemoScopeType | null>(null);
  const [demoScopeId, setDemoScopeId] = useState<string | null>(null);
  const [demoLabel, setDemoLabel] = useState<string | null>(null);
  const [savedScopeType, setSavedScopeType] = useState<string | null>(null);
  const [savedScopeId, setSavedScopeId] = useState<string | null>(null);

  const activateDemo = useCallback((scopeType: DemoScopeType, scopeId: string | null, label: string) => {
    if (!isAdmin && !isDemoActive) return; // only admin can activate
    // Save current admin state on first activation
    if (!isDemoActive) {
      setSavedScopeType('admin');
      setSavedScopeId(null);
    }
    setIsDemoActive(true);
    setDemoScopeType(scopeType);
    setDemoScopeId(scopeId);
    setDemoLabel(label);
    // Actually switch the role context
    setScopeAccess(scopeType, scopeId);
  }, [isAdmin, isDemoActive, setScopeAccess]);

  const deactivateDemo = useCallback(() => {
    setIsDemoActive(false);
    setDemoScopeType(null);
    setDemoScopeId(null);
    setDemoLabel(null);
    // Restore admin
    setScopeAccess('admin', null);
  }, [setScopeAccess]);

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
