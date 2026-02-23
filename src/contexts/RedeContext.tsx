import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const REDE_SESSION_KEY = 'rede_amor_active_rede';

export interface RedeInfo {
  id: string;
  name: string;
  slug: string | null;
  ativa: boolean;
}

interface RedeContextType {
  activeRedeId: string | null;
  activeRede: RedeInfo | null;
  redes: RedeInfo[];
  setActiveRede: (rede: RedeInfo) => void;
  setRedes: (redes: RedeInfo[]) => void;
  clearRede: () => void;
}

const RedeContext = createContext<RedeContextType | undefined>(undefined);

export function RedeProvider({ children }: { children: ReactNode }) {
  const [activeRedeId, setActiveRedeId] = useState<string | null>(null);
  const [activeRede, setActiveRedeState] = useState<RedeInfo | null>(null);
  const [redes, setRedesState] = useState<RedeInfo[]>([]);

  // Restore on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REDE_SESSION_KEY);
      if (stored) {
        const rede: RedeInfo = JSON.parse(stored);
        setActiveRedeId(rede.id);
        setActiveRedeState(rede);
      }
    } catch {
      localStorage.removeItem(REDE_SESSION_KEY);
    }
  }, []);

  const setActiveRede = (rede: RedeInfo) => {
    setActiveRedeId(rede.id);
    setActiveRedeState(rede);
    localStorage.setItem(REDE_SESSION_KEY, JSON.stringify(rede));
  };

  const setRedes = (list: RedeInfo[]) => {
    setRedesState(list);
  };

  const clearRede = () => {
    setActiveRedeId(null);
    setActiveRedeState(null);
    localStorage.removeItem(REDE_SESSION_KEY);
  };

  return (
    <RedeContext.Provider value={{ activeRedeId, activeRede, redes, setActiveRede, setRedes, clearRede }}>
      {children}
    </RedeContext.Provider>
  );
}

export function useRede() {
  const context = useContext(RedeContext);
  if (!context) {
    throw new Error('useRede must be used within a RedeProvider');
  }
  return context;
}
