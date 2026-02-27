import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CAMPO_SESSION_KEY = 'rede_amor_active_campo';

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
  const [isGlobalView, setIsGlobalView] = useState(false);

  // Restore on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CAMPO_SESSION_KEY);
      if (stored) {
        const campo: CampoInfo = JSON.parse(stored);
        setActiveCampoId(campo.id);
        setActiveCampoState(campo);
      }
    } catch {
      localStorage.removeItem(CAMPO_SESSION_KEY);
    }
  }, []);

  const setActiveCampo = (campo: CampoInfo) => {
    setActiveCampoId(campo.id);
    setActiveCampoState(campo);
    setIsGlobalView(false);
    localStorage.setItem(CAMPO_SESSION_KEY, JSON.stringify(campo));
  };

  const clearCampo = () => {
    setActiveCampoId(null);
    setActiveCampoState(null);
    setIsGlobalView(false);
    localStorage.removeItem(CAMPO_SESSION_KEY);
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
