import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CAMPO_SESSION_KEY = 'rede_amor_active_campo';
const GLOBAL_VIEW_KEY = 'rede_amor_global_view';

export interface CampoInfo {
  id: string;
  nome: string;
}

interface CampoContextType {
  activeCampoId: string | null;
  activeCampo: CampoInfo | null;
  setActiveCampo: (campo: CampoInfo) => void;
  clearCampo: () => void;
  /** True when user can see all campos (pastor_senior_global / admin) */
  isGlobalView: boolean;
  setIsGlobalView: (v: boolean) => void;
}

const CampoContext = createContext<CampoContextType | undefined>(undefined);

export function CampoProvider({ children }: { children: ReactNode }) {
  const [activeCampoId, setActiveCampoId] = useState<string | null>(null);
  const [activeCampo, setActiveCampoState] = useState<CampoInfo | null>(null);
  const [isGlobalView, setIsGlobalViewState] = useState(false);

  // Restore on mount
  useEffect(() => {
    try {
      // Restore global view flag
      const storedGlobal = localStorage.getItem(GLOBAL_VIEW_KEY);
      if (storedGlobal === 'true') {
        setIsGlobalViewState(true);
        // Don't restore campus when in global view
        return;
      }
      const stored = localStorage.getItem(CAMPO_SESSION_KEY);
      if (stored) {
        const campo: CampoInfo = JSON.parse(stored);
        setActiveCampoId(campo.id);
        setActiveCampoState(campo);
      }
    } catch {
      localStorage.removeItem(CAMPO_SESSION_KEY);
      localStorage.removeItem(GLOBAL_VIEW_KEY);
    }
  }, []);

  const setActiveCampo = (campo: CampoInfo) => {
    setActiveCampoId(campo.id);
    setActiveCampoState(campo);
    setIsGlobalViewState(false);
    localStorage.setItem(CAMPO_SESSION_KEY, JSON.stringify(campo));
    localStorage.removeItem(GLOBAL_VIEW_KEY);
  };

  const setIsGlobalView = (v: boolean) => {
    setIsGlobalViewState(v);
    if (v) {
      localStorage.setItem(GLOBAL_VIEW_KEY, 'true');
    } else {
      localStorage.removeItem(GLOBAL_VIEW_KEY);
    }
  };

  const clearCampo = () => {
    setActiveCampoId(null);
    setActiveCampoState(null);
    setIsGlobalViewState(false);
    localStorage.removeItem(CAMPO_SESSION_KEY);
    localStorage.removeItem(GLOBAL_VIEW_KEY);
  };

  return (
    <CampoContext.Provider value={{
      activeCampoId,
      activeCampo,
      setActiveCampo,
      clearCampo,
      isGlobalView,
      setIsGlobalView,
    }}>
      {children}
    </CampoContext.Provider>
  );
}

export function useCampo() {
  const context = useContext(CampoContext);
  if (!context) {
    throw new Error('useCampo must be used within a CampoProvider');
  }
  return context;
}
