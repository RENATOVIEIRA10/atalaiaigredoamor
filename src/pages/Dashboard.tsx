import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { CellLeaderDashboard } from '@/components/dashboard/CellLeaderDashboard';
import { CoordinatorDashboard } from '@/components/dashboard/CoordinatorDashboard';
import { NetworkLeaderDashboard } from '@/components/dashboard/NetworkLeaderDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SupervisorDashboard } from '@/components/dashboard/SupervisorDashboard';
import { PastorDashboard } from '@/components/dashboard/PastorDashboard';
import { CoordinatorPWADashboard } from '@/components/dashboard/pwa/CoordinatorPWADashboard';
import { NetworkLeaderPWADashboard } from '@/components/dashboard/pwa/NetworkLeaderPWADashboard';

export default function Dashboard() {
  const { isAdmin, isRedeLeader, isCoordenador, isSupervisor, isPastor } = useRole();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  const renderDashboard = () => {
    if (isPastor) {
      return <PastorDashboard />;
    }
    if (isAdmin) {
      return <AdminDashboard />;
    }
    if (isRedeLeader) {
      // PWA: enxuto / Web: completo
      return isPWAMobile ? <NetworkLeaderPWADashboard /> : <NetworkLeaderDashboard />;
    }
    if (isCoordenador) {
      // PWA: enxuto / Web: completo
      return isPWAMobile ? <CoordinatorPWADashboard /> : <CoordinatorDashboard />;
    }
    if (isSupervisor) {
      return <SupervisorDashboard />;
    }
    return <CellLeaderDashboard />;
  };

  return (
    <AppLayout title="Dashboard">
      {renderDashboard()}
    </AppLayout>
  );
}
