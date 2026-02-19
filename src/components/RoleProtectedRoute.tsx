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
const SUPERVISOR_PWA_BLOCKED = ['/membros', '/dados', '/redes', '/coordenacoes', '/configuracoes', '/ferramentas-teste', '/organograma'];

interface RoleProtectedRouteProps {
  children: React.ReactNode;
}

export function RoleProtectedRoute({ children }: RoleProtectedRouteProps) {
  const { selectedRole, accessKeyId, isSupervisor } = useRole();
  const { isDemoActive } = useDemoMode();
  const accepted = usePolicyAcceptance(accessKeyId);
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const location = useLocation();

  const isPWAMobile = isPWA && isMobile;

  // PWA Supervisor route guard
  const isBlockedRoute = isPWAMobile && isSupervisor && SUPERVISOR_PWA_BLOCKED.includes(location.pathname);
  const isPulsoRoute = isPWAMobile && isSupervisor && location.pathname === '/dashboard' && location.search.includes('tab=pulso');

  useEffect(() => {
    if (isBlockedRoute || isPulsoRoute) {
      toast.info('Aba indisponível no app do Supervisor.');
    }
  }, [isBlockedRoute, isPulsoRoute]);

  if (isBlockedRoute || isPulsoRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  // No session → login
  if (!selectedRole) {
    return <Navigate to="/" replace />;
  }

  // During demo mode, skip onboarding guard entirely (admin already accepted)
  if (isDemoActive) {
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
