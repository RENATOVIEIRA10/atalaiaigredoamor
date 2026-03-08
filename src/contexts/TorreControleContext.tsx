import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type TorreRole = 
  | 'pastor_senior_global'
  | 'pastor_de_campo'
  | 'rede'
  | 'coordenacao'
  | 'supervisor'
  | 'celula'
  | 'recomeco_operador'
  | 'recomeco_cadastro'
  | 'lider_recomeco_central'
  | 'central_celulas'
  | 'lider_batismo_aclamacao'
  | 'central_batismo_aclamacao';

export interface TorreSelection {
  campoId: string | null;
  campoNome: string | null;
  redeId: string | null;
  redeNome: string | null;
  coordenacaoId: string | null;
  coordenacaoNome: string | null;
  celulaId: string | null;
  celulaNome: string | null;
  role: TorreRole | null;
}

interface TorreControleContextType {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  selection: TorreSelection;
  setSelection: (s: Partial<TorreSelection>) => void;
  clearSelection: () => void;
  isActive: boolean;
}

const EMPTY: TorreSelection = {
  campoId: null, campoNome: null,
  redeId: null, redeNome: null,
  coordenacaoId: null, coordenacaoNome: null,
  celulaId: null, celulaNome: null,
  role: null,
};

const TorreControleContext = createContext<TorreControleContextType | undefined>(undefined);

export function TorreControleProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelectionState] = useState<TorreSelection>(EMPTY);

  const setSelection = useCallback((partial: Partial<TorreSelection>) => {
    setSelectionState(prev => ({ ...prev, ...partial }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(EMPTY);
  }, []);

  const isActive = selection.role !== null;

  return (
    <TorreControleContext.Provider value={{ isOpen, setIsOpen, selection, setSelection, clearSelection, isActive }}>
      {children}
    </TorreControleContext.Provider>
  );
}

export function useTorreControle() {
  const ctx = useContext(TorreControleContext);
  if (!ctx) throw new Error('useTorreControle must be used within TorreControleProvider');
  return ctx;
}
