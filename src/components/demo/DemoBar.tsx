import { useDemoMode } from '@/contexts/DemoModeContext';
import { useDemoActions } from '@/hooks/useDemoActions';
import { useCampos } from '@/hooks/useCampos';
import { useRedes } from '@/hooks/useRedes';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, ArrowLeft, RefreshCw, Database, Loader2 } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';

const scopeLabels: Record<string, string> = {
  pastor: 'Pastor Sênior',
  admin: 'Administrador',
  rede: 'Líder de Rede',
  coordenacao: 'Coordenador',
  supervisor: 'Supervisor',
  celula: 'Líder de Célula',
  demo_institucional: 'Demo Institucional',
};

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional';

const ROLE_OPTIONS: { value: DemoScopeType; label: string }[] = [
  { value: 'pastor', label: 'Pastor Sênior' },
  { value: 'rede', label: 'Líder de Rede' },
  { value: 'coordenacao', label: 'Coordenador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'celula', label: 'Líder de Célula' },
];

export function DemoBar() {
  const {
    isDemoActive, demoScopeType, demoLabel, demoRunId,
    demoCampusId, deactivateDemo, activateDemo, setDemoCampusId,
  } = useDemoMode();
  const { resetDemo, isResetting } = useDemoActions();
  const { data: campos } = useCampos();
  const { data: redes } = useRedes();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  if (!isDemoActive) return null;

  // Filter redes by campus when applicable
  const filteredRedes = demoCampusId
    ? (redes || []).filter(r => r.campo_id === demoCampusId)
    : redes || [];

  const isGlobalRole = demoScopeType === 'pastor' || demoScopeType === 'admin';

  const handleRoleSwitch = (newRole: string) => {
    const role = newRole as DemoScopeType;
    activateDemo(role, null, scopeLabels[role] || role, demoRunId, demoCampusId);
  };

  const handleCampusSwitch = (campusId: string) => {
    const id = campusId === 'ALL' ? null : campusId;
    setDemoCampusId(id);
  };

  const handleReset = async () => {
    const campusIds = demoCampusId ? [demoCampusId] : ['ALL'];
    await resetDemo(campusIds, 3);
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 shadow-lg"
      style={{ paddingTop: isPWAMobile ? 'env(safe-area-inset-top, 0px)' : undefined }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto">
        {/* Demo indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Eye className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Demo</span>
        </div>

        {/* Role switch */}
        <Select value={demoScopeType || 'pastor'} onValueChange={handleRoleSwitch}>
          <SelectTrigger className="h-7 text-xs bg-amber-600/30 border-amber-700/30 text-amber-950 w-[130px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Campus switch (only for global roles) */}
        {isGlobalRole && (campos || []).length > 0 && (
          <Select value={demoCampusId || 'ALL'} onValueChange={handleCampusSwitch}>
            <SelectTrigger className="h-7 text-xs bg-amber-600/30 border-amber-700/30 text-amber-950 w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">🌐 Todos</SelectItem>
              {(campos || []).filter(c => c.ativo).map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Rede switch (when applicable) */}
        {(demoScopeType === 'rede' || demoScopeType === 'coordenacao') && filteredRedes.length > 0 && !isMobile && (
          <Select value={''} onValueChange={() => {}}>
            <SelectTrigger className="h-7 text-xs bg-amber-600/30 border-amber-700/30 text-amber-950 w-[120px] shrink-0">
              <SelectValue placeholder="Rede" />
            </SelectTrigger>
            <SelectContent>
              {filteredRedes.map(r => (
                <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Dataset indicator */}
        {demoRunId && !isMobile && (
          <span className="text-[10px] bg-amber-600/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
            <Database className="h-3 w-3" />
            {demoRunId.slice(0, 8)}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-amber-950 hover:bg-amber-600/30 shrink-0 px-2"
          onClick={handleReset}
          disabled={isResetting}
        >
          {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {!isMobile && <span className="ml-1">Reset</span>}
        </Button>

        {/* Exit */}
        <Button
          size="sm"
          variant="outline"
          className="bg-amber-600 border-amber-700 text-amber-50 hover:bg-amber-700 hover:text-white h-7 text-xs shrink-0"
          onClick={deactivateDemo}
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          Sair
        </Button>
      </div>
    </div>
  );
}
