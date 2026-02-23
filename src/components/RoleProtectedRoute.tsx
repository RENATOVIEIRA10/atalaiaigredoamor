import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { usePolicyAcceptance } from '@/hooks/usePolicyAcceptance';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Routes blocked for Supervisor in PWA mode
const SUPERVISOR_PWA_BLOCKED = ['/membros', '/dados', '/redes', '/coordenacoes', '/configuracoes', '/ferramentas-teste', '/organograma', '/presenca'];

// Routes blocked for Coordenador / Líder de Rede in PWA mode (heavy web-only routes)
const COORD_REDE_PWA_BLOCKED = ['/membros', '/dados', '/redes', '/coordenacoes', '/configuracoes', '/ferramentas-teste'];

// Routes blocked for Cell Leader in PWA mode
const CELULA_PWA_BLOCKED = ['/dados', '/redes', '/coordenacoes', '/configuracoes', '/ferramentas-teste'];

// Routes allowed for Demo Institucional (read-only)
const DEMO_INSTITUCIONAL_ALLOWED = ['/dashboard', '/organograma', '/material', '/manual-usuario', '/manual-lider', '/faq'];

interface RoleProtectedRouteProps {
  children: React.ReactNode;
}

export function RoleProtectedRoute({ children }: RoleProtectedRouteProps) {
  const { selectedRole, accessKeyId, isSupervisor, isCoordenador, isRedeLeader, isCelulaLeader, isAdmin, isPastor, isDemoInstitucional } = useRole();
  const { isDemoActive } = useDemoMode();
  const accepted = usePolicyAcceptance(accessKeyId);
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const location = useLocation();

  const isPWAMobile = isPWA && isMobile;

  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  // PWA Supervisor route guard
  const isSupervisorBlocked = isPWAMobile && isSupervisor && SUPERVISOR_PWA_BLOCKED.includes(location.pathname);
  const isPulsoBlocked = isPWAMobile && isSupervisor && location.pathname === '/dashboard' && location.search.includes('tab=pulso');

  // PWA Coordenador / Líder de Rede route guard
  const isCoordRedeBlocked = isPWAMobile && (isCoordenador || isRedeLeader) && COORD_REDE_PWA_BLOCKED.includes(location.pathname);

  // PWA Cell Leader route guard
  const isCelulaBlocked = isPWAMobile && isCellLeaderOnly && CELULA_PWA_BLOCKED.includes(location.pathname);

  // Demo Institucional route guard - only allow specific routes
  const isDemoBlocked = isDemoInstitucional && !DEMO_INSTITUCIONAL_ALLOWED.includes(location.pathname);

  const isBlocked = isSupervisorBlocked || isPulsoBlocked || isCoordRedeBlocked || isCelulaBlocked || isDemoBlocked;

  useEffect(() => {
    if (isBlocked) {
      toast.info('Indisponível no app. Use o navegador para acesso completo.');
    }
  }, [isBlocked]);

  if (isBlocked) {
    return <Navigate to="/dashboard" replace />;
  }

  // No session → login
  if (!selectedRole) {
    return <Navigate to="/" replace />;
  }

  // During demo mode or demo_institucional, skip onboarding guard
  if (isDemoActive || isDemoInstitucional) {
    return <>{children}</>;
  }

  // Still checking acceptance
  if (accepted === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not accepted → onboarding
  if (!accepted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
