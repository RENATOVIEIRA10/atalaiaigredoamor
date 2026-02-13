import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { CellLeaderDashboard } from '@/components/dashboard/CellLeaderDashboard';
import { CoordinatorDashboard } from '@/components/dashboard/CoordinatorDashboard';
import { NetworkLeaderDashboard } from '@/components/dashboard/NetworkLeaderDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SupervisorDashboard } from '@/components/dashboard/SupervisorDashboard';
import { PastorDashboard } from '@/components/dashboard/PastorDashboard';

export default function Dashboard() {
  const { isAdmin, isRedeLeader, isCoordenador, isSupervisor, isPastor } = useRole();

  const renderDashboard = () => {
    if (isPastor) {
      return <PastorDashboard />;
    }
    if (isAdmin) {
      return <AdminDashboard />;
    }
    if (isRedeLeader) {
      return <NetworkLeaderDashboard />;
    }
    if (isCoordenador) {
      return <CoordinatorDashboard />;
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
