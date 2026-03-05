import { Home, Users, Heart, Network, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryMetrics as SummaryMetricsType } from '@/hooks/useSummaryMetrics';
import { cn } from '@/lib/utils';

interface Props {
  metrics: SummaryMetricsType | undefined;
  isLoading: boolean;
}

const metricConfig = [
  { key: 'celulasAtivas' as const, label: 'Células ativas', icon: Home, color: 'text-blue-400' },
  { key: 'membrosAtivos' as const, label: 'Membros ativos', icon: Users, color: 'text-violet-400' },
  { key: 'novasVidasMes' as const, label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-400' },
  { key: 'redesAtivas' as const, label: 'Redes ativas', icon: Network, color: 'text-primary' },
  { key: 'coordenacoesAtivas' as const, label: 'Coordenações', icon: Layers, color: 'text-emerald-400' },
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

  const primary = metricConfig.slice(0, 3);
  const secondary = metricConfig.slice(3);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {primary.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="p-4 text-center rounded-xl border border-border/40 bg-card/50 hover:bg-card/70 transition-all duration-200"
          >
            <Icon className={cn('h-4 w-4 mx-auto mb-2 opacity-70', color)} />
            <p className="text-2xl font-bold text-foreground tabular-nums">{metrics[key]}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>
      {secondary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {secondary.map(({ key, label, icon: Icon, color }) => (
            <div
              key={key}
              className="p-3 flex items-center gap-3 rounded-xl border border-border/30 bg-card/30"
            >
              <Icon className={cn('h-4 w-4 shrink-0 opacity-60', color)} />
              <div>
                <p className="text-lg font-bold text-foreground tabular-nums">{metrics[key]}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
