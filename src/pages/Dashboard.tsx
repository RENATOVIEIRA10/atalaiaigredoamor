import { lazy, Suspense } from 'react';
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
import { InstitutionalDashboard } from '@/components/dashboard/InstitutionalDashboard';
import { CoordinatorPWADashboard } from '@/components/dashboard/pwa/CoordinatorPWADashboard';
import { NetworkLeaderPWADashboard } from '@/components/dashboard/pwa/NetworkLeaderPWADashboard';
import { CellLeaderPWADashboard } from '@/components/dashboard/pwa/CellLeaderPWADashboard';
import { SupervisorPWADashboard } from '@/components/dashboard/pwa/SupervisorPWADashboard';
import { Loader2 } from 'lucide-react';

const LiderRecomecoCentralDashboard = lazy(() => import('@/components/dashboard/LiderRecomecoCentralDashboard'));
const EventLeaderDashboard = lazy(() => import('@/components/dashboard/EventLeaderDashboard'));
const CentralBatismoDashboard = lazy(() => import('@/components/dashboard/CentralBatismoDashboard'));

export default function Dashboard() {
  const { isAdmin, isRedeLeader, isCoordenador, isSupervisor, isPastor, isDemoInstitucional, isLiderRecomecoCentral, isLiderBatismoAclamacao, isCentralBatismoAclamacao, isPastorSeniorGlobal, isPastorDeCampo } = useRole();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  const suspenseFallback = <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const renderDashboard = () => {
    if (isLiderBatismoAclamacao) {
      return <Suspense fallback={suspenseFallback}><EventLeaderDashboard /></Suspense>;
    }
    if (isCentralBatismoAclamacao) {
      return <Suspense fallback={suspenseFallback}><CentralBatismoDashboard /></Suspense>;
    }
    if (isLiderRecomecoCentral) {
      return <Suspense fallback={suspenseFallback}><LiderRecomecoCentralDashboard /></Suspense>;
    }
    if (isDemoInstitucional) return <InstitutionalDashboard />;
    if (isPastorSeniorGlobal) return <PastorDashboard />;
    if (isPastorDeCampo) return <PastorDashboard />;
    if (isPastor) return <PastorDashboard />;
    if (isAdmin) return <AdminDashboard />;
    if (isRedeLeader) return isPWAMobile ? <NetworkLeaderPWADashboard /> : <NetworkLeaderDashboard />;
    if (isCoordenador) return isPWAMobile ? <CoordinatorPWADashboard /> : <CoordinatorDashboard />;
    if (isSupervisor) return isPWAMobile ? <SupervisorPWADashboard /> : <SupervisorDashboard />;
    return isPWAMobile ? <CellLeaderPWADashboard /> : <CellLeaderDashboard />;
  };

  return (
    <AppLayout title="Dashboard">
      {renderDashboard()}
    </AppLayout>
  );
}
