import { useDemoMode } from '@/contexts/DemoModeContext';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft } from 'lucide-react';

const scopeLabels: Record<string, string> = {
  pastor: 'Pastor Sênior',
  admin: 'Administrador',
  rede: 'Líder de Rede',
  coordenacao: 'Coordenador',
  supervisor: 'Supervisor',
  celula: 'Líder de Célula',
};

export function DemoModeBanner() {
  const { isDemoActive, demoScopeType, demoLabel, deactivateDemo } = useDemoMode();

  if (!isDemoActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        <span>
          Modo Demonstração: <strong>{scopeLabels[demoScopeType || ''] || demoScopeType}</strong>
          {demoLabel && <> — {demoLabel}</>}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-amber-600 border-amber-700 text-amber-50 hover:bg-amber-700 hover:text-white h-7 text-xs"
        onClick={deactivateDemo}
      >
        <ArrowLeft className="h-3 w-3 mr-1" />
        Voltar para Admin
      </Button>
    </div>
  );
}
