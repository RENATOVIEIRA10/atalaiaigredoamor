import { Home, Users, Heart, TrendingUp, Network, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryMetrics as SummaryMetricsType } from '@/hooks/useSummaryMetrics';
import { cn } from '@/lib/utils';

interface Props {
  metrics: SummaryMetricsType | undefined;
  isLoading: boolean;
}

const metricConfig = [
  { key: 'celulasAtivas' as const, label: 'Células ativas', icon: Home, color: 'text-blue-500' },
  { key: 'membrosAtivos' as const, label: 'Membros ativos', icon: Users, color: 'text-violet-500' },
  { key: 'novasVidasMes' as const, label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-500' },
  { key: 'redesAtivas' as const, label: 'Redes ativas', icon: Network, color: 'text-primary' },
  { key: 'coordenacoesAtivas' as const, label: 'Coordenações', icon: Layers, color: 'text-emerald-500' },
];

export function SummaryMetricsPanel({ metrics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!metrics) return null;

  // Show top 3 primary + 3 secondary
  const primary = metricConfig.slice(0, 3);
  const secondary = metricConfig.slice(3);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {primary.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="p-4 text-center">
            <Icon className={cn('h-5 w-5 mx-auto mb-2', color)} />
            <p className="text-2xl font-bold text-foreground">{metrics[key]}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
          </Card>
        ))}
      </div>
      {secondary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {secondary.map(({ key, label, icon: Icon, color }) => (
            <Card key={key} className="p-3 flex items-center gap-3">
              <Icon className={cn('h-4 w-4 shrink-0', color)} />
              <div>
                <p className="text-lg font-bold text-foreground">{metrics[key]}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
