import { useEffect } from 'react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useCampos } from '@/hooks/useCampos';
import { useRedes } from '@/hooks/useRedes';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
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
  pastor_senior_global: 'Pastor Global',
  pastor_de_campo: 'Pastor de Campo',
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
    isDemoActive, demoScopeType, demoCampusId,
    deactivateDemo, activateDemo, setDemoCampusId,
  } = useDemoMode();
  const { data: campos } = useCampos();
  const { data: redes } = useRedes();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  // Filter redes by campus
  const filteredRedes = demoCampusId
    ? (redes || []).filter(r => r.campo_id === demoCampusId)
    : redes || [];

  // CRITICAL: Reset rede selection when campus changes and current rede doesn't belong
  // This is handled via the campus switch handler below

  if (!isDemoActive) return null;

  const isGlobalRole = demoScopeType === 'pastor' || demoScopeType === 'admin';

  const handleRoleSwitch = (newRole: string) => {
    const role = newRole as DemoScopeType;
    activateDemo(role, null, scopeLabels[role] || role, null, demoCampusId);
  };

  const handleCampusSwitch = (campusId: string) => {
    const id = campusId === 'ALL' ? null : campusId;
    setDemoCampusId(id);
    // Rede will be automatically invalidated since useRedes filters by campoId via useDemoScope
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white shadow-lg"
      style={{ paddingTop: isPWAMobile ? 'env(safe-area-inset-top, 0px)' : undefined }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto">
        {/* Validation indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Validação</span>
        </div>

        {/* Role switch */}
        <Select value={demoScopeType || 'pastor'} onValueChange={handleRoleSwitch}>
          <SelectTrigger className="h-7 text-xs bg-emerald-700/40 border-emerald-800/30 text-white w-[130px] shrink-0">
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
            <SelectTrigger className="h-7 text-xs bg-emerald-700/40 border-emerald-800/30 text-white w-[130px] shrink-0">
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

        {/* Rede indicator (when applicable, read-only info) */}
        {(demoScopeType === 'rede' || demoScopeType === 'coordenacao') && !isMobile && (
          <span className="text-[10px] bg-emerald-700/40 px-2 py-0.5 rounded shrink-0">
            {filteredRedes.length} rede(s) no campus
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Exit */}
        <Button
          size="sm"
          variant="outline"
          className="bg-emerald-700 border-emerald-800 text-white hover:bg-emerald-800 hover:text-white h-7 text-xs shrink-0"
          onClick={deactivateDemo}
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          Sair
        </Button>
      </div>
    </div>
  );
}
