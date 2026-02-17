import { Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { usePolicyAcceptance } from '@/hooks/usePolicyAcceptance';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
}

export function RoleProtectedRoute({ children }: RoleProtectedRouteProps) {
  const { selectedRole, accessKeyId } = useRole();
  const { isDemoActive } = useDemoMode();
  const accepted = usePolicyAcceptance(accessKeyId);

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
