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
      { key: 'membrosCelula', label: 'Membros da célula', icon: Users, color: 'text-primary' },
      { key: 'novasVidasCelula', label: 'Novas vidas (mês)', icon: Heart, color: 'text-destructive' },
    ];
  }
  if (level === 'supervisor') {
    return [{ key: 'celulasSupervisionadas', label: 'Células supervisionadas', icon: Home, color: 'text-primary' }];
  }
  if (level === 'coordenacao') {
    return [
      { key: 'celulasCoordenacao', label: 'Células na coordenação', icon: Home, color: 'text-primary' },
      { key: 'membrosCoordenacao', label: 'Membros na coordenação', icon: Users, color: 'text-primary' },
    ];
  }
  if (level === 'rede') {
    return [
      { key: 'celulasAtivas', label: 'Células da rede', icon: Home, color: 'text-primary' },
      { key: 'membrosAtivos', label: 'Membros da rede', icon: Users, color: 'text-primary' },
      { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-destructive' },
    ];
  }
  if (level === 'ministerio') {
    return [{ key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-destructive' }];
  }
  return [
    { key: 'celulasAtivas', label: 'Células ativas', icon: Home, color: 'text-primary' },
    { key: 'membrosAtivos', label: 'Membros ativos', icon: Users, color: 'text-primary' },
    { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-destructive' },
    { key: 'redesAtivas', label: 'Redes ativas', icon: Network, color: 'text-gold' },
    { key: 'coordenacoesAtivas', label: 'Coordenações', icon: Layers, color: 'text-success' },
  ];
}

function getSectionLabel(level: string): string {
  if (level === 'celula') return 'Saúde da sua célula';
  if (level === 'supervisor') return 'Suas células';
  if (level === 'coordenacao') return 'Sua coordenação';
  if (level === 'rede') return 'Saúde da rede';
  if (level === 'ministerio') return 'Visão do ministério';
  return 'Panorama do Reino';
}

export function SummaryMetricsPanel({ metrics, isLoading }: Props) {
  const { scopeType } = useRole();
  const level = getScopeLevel(scopeType);
  const items = getMetricsForScope(level);

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-muted/30" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const visibleItems = items.filter((item) => metrics[item.key] !== undefined);
  if (!visibleItems.length) return null;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {visibleItems.map(({ key, label, icon: Icon, color }, idx) => (
        <div
          key={key}
          className={cn(
            'glass-card rounded-2xl p-5 transition-all duration-300',
            'hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_hsl(var(--primary)/0.15)]',
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg border border-border/30 bg-background/20 p-1.5">
              <Icon className={cn('h-3.5 w-3.5', color)} />
            </div>
          </div>
          <p className="text-3xl font-display font-bold tracking-tight text-foreground tabular-nums">
            {metrics[key]}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">{label}</p>
        </div>
      ))}
    </div>
  );
}

export { getSectionLabel };
