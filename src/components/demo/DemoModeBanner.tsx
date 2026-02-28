import { useDemoMode } from '@/contexts/DemoModeContext';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft, Database } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';

const scopeLabels: Record<string, string> = {
  pastor: 'Pastor Sênior',
  admin: 'Administrador',
  rede: 'Líder de Rede',
  coordenacao: 'Coordenador',
  supervisor: 'Supervisor',
  celula: 'Líder de Célula',
  demo_institucional: 'Demonstração Institucional',
};

export function DemoModeBanner() {
  const { isDemoActive, demoScopeType, demoLabel, demoRunId, deactivateDemo } = useDemoMode();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  if (!isDemoActive) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between shadow-lg"
      style={{ paddingTop: isPWAMobile ? 'calc(env(safe-area-inset-top, 0px) + 4px)' : undefined }}
    >
      <div className="flex items-center gap-2 text-sm font-medium min-w-0">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          🔍 Demo: <strong>{scopeLabels[demoScopeType || ''] || demoScopeType}</strong>
          {demoLabel && !isPWAMobile && <> — {demoLabel}</>}
        </span>
        {demoRunId && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-amber-600/30 px-1.5 py-0.5 rounded">
            <Database className="h-3 w-3" />
            Dataset: {demoRunId.slice(0, 8)}
          </span>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-amber-600 border-amber-700 text-amber-50 hover:bg-amber-700 hover:text-white h-7 text-xs shrink-0 ml-2"
        onClick={deactivateDemo}
      >
        <ArrowLeft className="h-3 w-3 mr-1" />
        Voltar
      </Button>
    </div>
  );
}
