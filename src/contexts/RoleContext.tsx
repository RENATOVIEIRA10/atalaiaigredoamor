import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'admin' | 'rede_leader' | 'coordenador' | 'supervisor' | 'celula_leader';
type ScopeType = 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';

interface RoleContextType {
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  scopeType: ScopeType | null;
  scopeId: string | null;
  setScopeAccess: (scopeType: ScopeType, scopeId: string | null) => void;
  clearAccess: () => void;
  isAdmin: boolean;
  isRedeLeader: boolean;
  isCoordenador: boolean;
  isSupervisor: boolean;
  isCelulaLeader: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

function scopeTypeToRole(scopeType: ScopeType): UserRole {
  switch (scopeType) {
    case 'admin': return 'admin';
    case 'rede': return 'rede_leader';
    case 'coordenacao': return 'coordenador';
    case 'supervisor': return 'supervisor';
    case 'celula': return 'celula_leader';
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [scopeType, setScopeType] = useState<ScopeType | null>(null);
  const [scopeId, setScopeId] = useState<string | null>(null);

  const setScopeAccess = (st: ScopeType, sid: string | null) => {
    setScopeType(st);
    setScopeId(sid);
    setSelectedRole(scopeTypeToRole(st));
  };

  const clearAccess = () => {
    setSelectedRole(null);
    setScopeType(null);
    setScopeId(null);
  };

  const value: RoleContextType = {
    selectedRole,
    setSelectedRole,
    scopeType,
    scopeId,
    setScopeAccess,
    clearAccess,
    isAdmin: selectedRole === 'admin',
    isRedeLeader: selectedRole === 'rede_leader',
    isCoordenador: selectedRole === 'coordenador',
    isSupervisor: selectedRole === 'supervisor',
    isCelulaLeader: selectedRole === 'celula_leader',
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
