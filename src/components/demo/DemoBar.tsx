import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTorreControle } from '@/contexts/TorreControleContext';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radar, RotateCcw, Radio } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCampo } from '@/contexts/CampoContext';
import { useRede } from '@/contexts/RedeContext';

export function DemoBar() {
  const { isDemoActive, demoLabel, deactivateDemo } = useDemoMode();
  const { clearActiveState, isOperating, activeState } = useTorreControle();
  const { isAdmin } = useRole();
  const { setIsGlobalView } = useCampo();
  const { clearRede } = useRede();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  if (!isDemoActive && !isOperating) return null;
  // Only show for admin users operating via Torre
  if (!isAdmin && !isDemoActive) return null;

  const handleDeactivate = () => {
    deactivateDemo();
    clearActiveState();
    clearRede();
    setIsGlobalView(false);
    queryClient.invalidateQueries();
    navigate('/home');
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b border-gold/20"
      style={{
        paddingTop: isPWAMobile ? 'env(safe-area-inset-top, 0px)' : undefined,
        background: 'linear-gradient(90deg, hsl(222 47% 8%) 0%, hsl(222 41% 12%) 50%, hsl(222 47% 8%) 100%)',
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Radio className="h-3 w-3 text-gold animate-pulse" />
          <Radar className="h-4 w-4 text-gold" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold">Torre</span>
        </div>

        <div className="h-4 w-px bg-border/20 shrink-0" />

        <span className="text-xs font-medium text-foreground/80 truncate">
          {demoLabel || activeState?.label || 'Operação ativa'}
        </span>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-gold border border-gold/20 hover:bg-gold/10 hover:text-gold shrink-0"
          onClick={handleDeactivate}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Sair
        </Button>
      </div>
    </div>
  );
}
