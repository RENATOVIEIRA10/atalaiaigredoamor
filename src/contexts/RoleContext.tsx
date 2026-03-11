import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type UserRole = 'pastor' | 'admin' | 'rede_leader' | 'coordenador' | 'supervisor' | 'celula_leader' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura' | 'recomeco_cadastro' | 'central_celulas' | 'lider_recomeco_central' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo' | 'financeiro_global' | 'financeiro_campo' | 'secretaria_admin';
type ScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura' | 'recomeco_cadastro' | 'central_celulas' | 'lider_recomeco_central' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo' | 'financeiro_global' | 'financeiro_campo' | 'secretaria_admin';

const SESSION_KEY = 'rede_amor_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredSession {
  scopeType: ScopeType;
  scopeId: string | null;
  accessKeyId: string | null;
  expiresAt: number;
}

interface RoleContextType {
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  scopeType: ScopeType | null;
  scopeId: string | null;
  accessKeyId: string | null;
  setScopeAccess: (scopeType: ScopeType, scopeId: string | null, accessKeyId?: string | null) => void;
  clearAccess: () => void;
  isPastor: boolean;
  isAdmin: boolean;
  isRedeLeader: boolean;
  isCoordenador: boolean;
  isSupervisor: boolean;
  isCelulaLeader: boolean;
  isDemoInstitucional: boolean;
  isRecomecoOperador: boolean;
  isRecomecoLeitura: boolean;
  isRecomecoCadastro: boolean;
    isCentralCelulas: boolean;
    isLiderRecomecoCentral: boolean;
    isLiderBatismoAclamacao: boolean;
    isCentralBatismoAclamacao: boolean;
    isPastorSeniorGlobal: boolean;
    isPastorDeCampo: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

function scopeTypeToRole(scopeType: ScopeType): UserRole {
  switch (scopeType) {
    case 'pastor': return 'pastor';
    case 'admin': return 'admin';
    case 'rede': return 'rede_leader';
    case 'coordenacao': return 'coordenador';
    case 'supervisor': return 'supervisor';
    case 'celula': return 'celula_leader';
    case 'demo_institucional': return 'demo_institucional';
    case 'recomeco_operador': return 'recomeco_operador';
    case 'recomeco_leitura': return 'recomeco_leitura';
    case 'recomeco_cadastro': return 'recomeco_cadastro';
    case 'central_celulas': return 'central_celulas';
    case 'lider_recomeco_central': return 'lider_recomeco_central';
    case 'lider_batismo_aclamacao': return 'lider_batismo_aclamacao';
    case 'central_batismo_aclamacao': return 'central_batismo_aclamacao';
    case 'pastor_senior_global': return 'pastor_senior_global';
    case 'pastor_de_campo': return 'pastor_de_campo';
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [scopeType, setScopeType] = useState<ScopeType | null>(null);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [accessKeyId, setAccessKeyId] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: StoredSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          setScopeType(session.scopeType);
          setScopeId(session.scopeId);
          setAccessKeyId(session.accessKeyId || null);
          setSelectedRole(scopeTypeToRole(session.scopeType));
        } else {
          // Session expired
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Check expiry periodically (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
          const session: StoredSession = JSON.parse(stored);
          if (session.expiresAt <= Date.now()) {
            localStorage.removeItem(SESSION_KEY);
            setScopeType(null);
            setScopeId(null);
            setAccessKeyId(null);
            setSelectedRole(null);
          }
        }
      } catch {
        // ignore
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const setScopeAccess = (st: ScopeType, sid: string | null, akId?: string | null) => {
    setScopeType(st);
    setScopeId(sid);
    setAccessKeyId(akId || null);
    setSelectedRole(scopeTypeToRole(st));
    // Persist session with 24h expiry
    const session: StoredSession = {
      scopeType: st,
      scopeId: sid,
      accessKeyId: akId || null,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const clearAccess = () => {
    setSelectedRole(null);
    setScopeType(null);
    setScopeId(null);
    setAccessKeyId(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const value: RoleContextType = {
    selectedRole,
    setSelectedRole,
    scopeType,
    scopeId,
    accessKeyId,
    setScopeAccess,
    clearAccess,
    isPastor: selectedRole === 'pastor',
    isAdmin: selectedRole === 'admin',
    isRedeLeader: selectedRole === 'rede_leader',
    isCoordenador: selectedRole === 'coordenador',
    isSupervisor: selectedRole === 'supervisor',
    isCelulaLeader: selectedRole === 'celula_leader',
    isDemoInstitucional: selectedRole === 'demo_institucional',
    isRecomecoOperador: selectedRole === 'recomeco_operador',
    isRecomecoLeitura: selectedRole === 'recomeco_leitura',
    isRecomecoCadastro: selectedRole === 'recomeco_cadastro',
    isCentralCelulas: selectedRole === 'central_celulas',
    isLiderRecomecoCentral: selectedRole === 'lider_recomeco_central',
    isLiderBatismoAclamacao: selectedRole === 'lider_batismo_aclamacao',
    isCentralBatismoAclamacao: selectedRole === 'central_batismo_aclamacao',
    isPastorSeniorGlobal: selectedRole === 'pastor_senior_global',
    isPastorDeCampo: selectedRole === 'pastor_de_campo',
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
