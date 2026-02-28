import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRecomecoFunnel } from '@/hooks/useRecomecoFunnel';
import { RecomecoKPICards } from './RecomecoKPICards';
import { RecomecoGroupTable } from './RecomecoGroupTable';
import { useRedes } from '@/hooks/useRedes';
import { useDemoScope } from '@/hooks/useDemoScope';

export function RecomecoPastorTab() {
  const { campoId } = useDemoScope();
  const { isLoading, totalKPIs, byCoordenacao, byRede } = useRecomecoFunnel('all', undefined, campoId);
  const { data: redes } = useRedes();
  const [showDrillDown, setShowDrillDown] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (totalKPIs.encaminhadas === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma vida encaminhada ainda.</p>;
  }

  // Enrich byRede with rede names
  const enrichedByRede = byRede.map(g => {
    const rede = (redes || []).find(r => r.id === g.groupId);
    return { ...g, groupName: rede?.name || g.groupName };
  });

  return (
    <div className="space-y-6">
      <RecomecoKPICards kpis={totalKPIs} compact />

      {enrichedByRede.length > 1 && (
        <RecomecoGroupTable groups={enrichedByRede} groupLabel="Rede" title="Funil por Rede" description="Visão consolidada por rede" />
      )}

      <RecomecoGroupTable groups={byCoordenacao} groupLabel="Coordenação" title="Detalhe por Coordenação" />
    </div>
  );
}
