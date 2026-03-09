import { Home, Users, Heart, Network, Layers, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
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
  bgColor: string;
}

function getMetricsForScope(level: string): MetricItem[] {
  if (level === 'celula') {
    return [
      { key: 'membrosCelula', label: 'Membros', icon: Users, color: 'text-primary', bgColor: 'bg-primary/12' },
      { key: 'novasVidasCelula', label: 'Novas vidas', icon: Heart, color: 'text-ruby', bgColor: 'bg-ruby/12' },
    ];
  }
  if (level === 'supervisor') {
    return [{ key: 'celulasSupervisionadas', label: 'Células', icon: Home, color: 'text-primary', bgColor: 'bg-primary/12' }];
  }
  if (level === 'coordenacao') {
    return [
      { key: 'celulasCoordenacao', label: 'Células', icon: Home, color: 'text-primary', bgColor: 'bg-primary/12' },
      { key: 'membrosCoordenacao', label: 'Membros', icon: Users, color: 'text-primary', bgColor: 'bg-primary/12' },
    ];
  }
  if (level === 'rede') {
    return [
      { key: 'celulasAtivas', label: 'Células', icon: Home, color: 'text-primary', bgColor: 'bg-primary/12' },
      { key: 'membrosAtivos', label: 'Membros', icon: Users, color: 'text-primary', bgColor: 'bg-primary/12' },
      { key: 'novasVidasMes', label: 'Novas vidas', icon: Heart, color: 'text-ruby', bgColor: 'bg-ruby/12' },
    ];
  }
  if (level === 'ministerio') {
    return [{ key: 'novasVidasMes', label: 'Novas vidas', icon: Heart, color: 'text-ruby', bgColor: 'bg-ruby/12' }];
  }
  return [
    { key: 'celulasAtivas', label: 'Células', icon: Home, color: 'text-primary', bgColor: 'bg-primary/12' },
    { key: 'membrosAtivos', label: 'Membros', icon: Users, color: 'text-primary', bgColor: 'bg-primary/12' },
    { key: 'novasVidasMes', label: 'Novas vidas', icon: Heart, color: 'text-ruby', bgColor: 'bg-ruby/12' },
    { key: 'redesAtivas', label: 'Redes', icon: Network, color: 'text-gold', bgColor: 'bg-gold/12' },
  ];
}

function getSectionLabel(level: string): string {
  if (level === 'celula') return 'Saúde da sua célula';
  if (level === 'supervisor') return 'Suas células';
  if (level === 'coordenacao') return 'Sua coordenação';
  if (level === 'rede') return 'Panorama da rede';
  if (level === 'ministerio') return 'Visão do ministério';
  return 'Panorama do Reino';
}

export function SummaryMetricsPanel({ metrics, isLoading }: Props) {
  const { scopeType } = useRole();
  const level = getScopeLevel(scopeType);
  const items = getMetricsForScope(level);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const visibleItems = items.filter((item) => metrics[item.key] !== undefined);
  if (!visibleItems.length) return null;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {visibleItems.map(({ key, label, icon: Icon, color, bgColor }, idx) => (
        <Card
          key={key}
          variant="glass"
          className={cn(
            'p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-18px_hsl(var(--primary)/0.12)]',
            `stagger-${idx + 1} animate-fade-in`
          )}
        >
          <div className={cn('mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl', bgColor)}>
            <Icon className={cn('h-4.5 w-4.5', color)} />
          </div>
          <p className="font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {metrics[key]}
          </p>
          <p className="mt-1.5 text-xs uppercase tracking-[0.1em] text-muted-foreground/70 font-medium">
            {label}
          </p>
        </Card>
      ))}
    </div>
  );
}

export { getSectionLabel };
