import { Home, Users, Heart, Network, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryMetrics as SummaryMetricsType, getScopeLevel } from '@/hooks/useSummaryMetrics';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  metrics: SummaryMetricsType | undefined;
  isLoading: boolean;
}

interface MetricItem {
  key: keyof SummaryMetricsType;
  label: string;
  icon: LucideIcon;
  color: string;
}

function getMetricsForScope(level: string): MetricItem[] {
  if (level === 'celula') {
    return [
      { key: 'membrosCelula', label: 'Membros da célula', icon: Users, color: 'text-violet-500' },
      { key: 'novasVidasCelula', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-500' },
    ];
  }
  if (level === 'supervisor') {
    return [{ key: 'celulasSupervisionadas', label: 'Células supervisionadas', icon: Home, color: 'text-sky-500' }];
  }
  if (level === 'coordenacao') {
    return [
      { key: 'celulasCoordenacao', label: 'Células na coordenação', icon: Home, color: 'text-sky-500' },
      { key: 'membrosCoordenacao', label: 'Membros na coordenação', icon: Users, color: 'text-violet-500' },
    ];
  }
  if (level === 'rede') {
    return [
      { key: 'celulasAtivas', label: 'Células da rede', icon: Home, color: 'text-sky-500' },
      { key: 'membrosAtivos', label: 'Membros da rede', icon: Users, color: 'text-violet-500' },
      { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-500' },
    ];
  }
  if (level === 'ministerio') {
    return [{ key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-500' }];
  }
  return [
    { key: 'celulasAtivas', label: 'Células ativas', icon: Home, color: 'text-sky-500' },
    { key: 'membrosAtivos', label: 'Membros ativos', icon: Users, color: 'text-violet-500' },
    { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-500' },
    { key: 'redesAtivas', label: 'Redes ativas', icon: Network, color: 'text-primary' },
    { key: 'coordenacoesAtivas', label: 'Coordenações', icon: Layers, color: 'text-emerald-500' },
  ];
}

function getSectionLabel(level: string): string {
  if (level === 'celula') return 'Saúde da sua célula';
  if (level === 'supervisor') return 'Suas células';
  if (level === 'coordenacao') return 'Sua coordenação';
  if (level === 'rede') return 'Saúde da rede';
  if (level === 'ministerio') return 'Visão do ministério';
  return 'Saúde da rede';
}

export function SummaryMetricsPanel({ metrics, isLoading }: Props) {
  const { scopeType } = useRole();
  const level = getScopeLevel(scopeType);
  const items = getMetricsForScope(level);

  if (isLoading) {
    return (
      <div className="premium-surface rounded-3xl p-5">
        <Skeleton className="mb-4 h-16 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const visibleItems = items.filter((item) => metrics[item.key] !== undefined);
  if (!visibleItems.length) return null;

  const [featured, ...secondary] = visibleItems;
  const FeaturedIcon = featured.icon;

  return (
    <div className="premium-surface rounded-3xl p-5">
      <div className="rounded-2xl border border-border/55 bg-background/80 p-4">
        <FeaturedIcon className={cn('mb-2 h-4 w-4', featured.color)} />
        <p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">{metrics[featured.key]}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{featured.label}</p>
      </div>

      {!!secondary.length && (
        <div className="mt-3 space-y-2">
          {secondary.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-center justify-between rounded-2xl border border-border/45 bg-background/65 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-full border border-border/55 p-1.5">
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="text-lg font-semibold text-foreground tabular-nums">{metrics[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { getSectionLabel };
