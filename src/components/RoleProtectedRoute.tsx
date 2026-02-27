import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
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

// Routes allowed for Recomeço scopes
const RECOMECO_ALLOWED = ['/recomeco'];

// Routes allowed for Líder Recomeço+Central
const LIDER_RC_ALLOWED = ['/dashboard'];

interface RoleProtectedRouteProps {
  children: React.ReactNode;
}

export function RoleProtectedRoute({ children }: RoleProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedRole, accessKeyId, isSupervisor, isCoordenador, isRedeLeader, isCelulaLeader, isAdmin, isPastor, isDemoInstitucional, isRecomecoOperador, isRecomecoLeitura, isLiderRecomecoCentral, isLiderBatismo, isLiderAclamacao } = useRole();
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

  // Recomeço route guard - only allow /recomeco
  const isRecomecoBlocked = (isRecomecoOperador || isRecomecoLeitura) && !RECOMECO_ALLOWED.includes(location.pathname);

  // Líder Recomeço+Central route guard
  const isLiderRCBlocked = isLiderRecomecoCentral && !LIDER_RC_ALLOWED.includes(location.pathname);

  // Líder Batismo/Aclamação route guard
  const isEventLeaderBlocked = (isLiderBatismo || isLiderAclamacao) && !LIDER_RC_ALLOWED.includes(location.pathname);

  const isBlocked = isSupervisorBlocked || isPulsoBlocked || isCoordRedeBlocked || isCelulaBlocked || isDemoBlocked || isRecomecoBlocked || isLiderRCBlocked || isEventLeaderBlocked;

  useEffect(() => {
    if (isBlocked) {
      toast.info('Indisponível no app. Use o navegador para acesso completo.');
    }
  }, [isBlocked]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // No Supabase Auth session → login page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isBlocked) {
    if (isRecomecoOperador || isRecomecoLeitura) {
      return <Navigate to="/recomeco" replace />;
    }
    if (isLiderRecomecoCentral) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // No access-code session → code entry
  if (!selectedRole) {
    return <Navigate to="/" replace />;
  }

  // During demo mode, demo_institucional, recomeco, or lider_recomeco_central, skip onboarding guard
  if (isDemoActive || isDemoInstitucional || isRecomecoOperador || isRecomecoLeitura || isLiderRecomecoCentral || isLiderBatismo || isLiderAclamacao) {
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
