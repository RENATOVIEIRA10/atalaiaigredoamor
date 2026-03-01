import { Loader2 } from 'lucide-react';
import { useRecomecoFunnel } from '@/hooks/useRecomecoFunnel';
import { RecomecoKPICards } from './RecomecoKPICards';
import { RecomecoGroupTable } from './RecomecoGroupTable';
import { RecomecoAlerts } from './RecomecoAlerts';
import { useDemoScope } from '@/hooks/useDemoScope';

interface RecomecoRedeTabProps {
  redeId: string;
}

export function RecomecoRedeTab({ redeId }: RecomecoRedeTabProps) {
  const { campoId } = useDemoScope();
  const { isLoading, totalKPIs, byCoordenacao, pendingOver3Days, noResponseOver7Days } = useRecomecoFunnel('rede', redeId, campoId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (totalKPIs.encaminhadas === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma vida encaminhada para células desta rede.</p>;
  }

  return (
    <div className="space-y-6">
      <RecomecoKPICards kpis={totalKPIs} />
      <RecomecoAlerts pendingOver3Days={pendingOver3Days} noResponseOver7Days={noResponseOver7Days} />
      <RecomecoGroupTable groups={byCoordenacao} groupLabel="Coordenação" title="Funil por Coordenação" description="Visão consolidada por coordenação" />
    </div>
  );
}
