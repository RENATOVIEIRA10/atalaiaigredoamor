import { Home, Users, Heart, Network, Layers, UserCheck } from 'lucide-react';
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
      { key: 'membrosCelula', label: 'Membros da célula', icon: Users, color: 'text-violet-400' },
      { key: 'novasVidasCelula', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-400' },
    ];
  }
  if (level === 'supervisor') {
    return [
      { key: 'celulasSupervisionadas', label: 'Células supervisionadas', icon: Home, color: 'text-blue-400' },
    ];
  }
  if (level === 'coordenacao') {
    return [
      { key: 'celulasCoordenacao', label: 'Células na coordenação', icon: Home, color: 'text-blue-400' },
      { key: 'membrosCoordenacao', label: 'Membros na coordenação', icon: Users, color: 'text-violet-400' },
    ];
  }
  if (level === 'rede') {
    return [
      { key: 'celulasAtivas', label: 'Células da rede', icon: Home, color: 'text-blue-400' },
      { key: 'membrosAtivos', label: 'Membros da rede', icon: Users, color: 'text-violet-400' },
      { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-400' },
    ];
  }
  if (level === 'ministerio') {
    return [
      { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-400' },
    ];
  }
  // pastor / global
  return [
    { key: 'celulasAtivas', label: 'Células ativas', icon: Home, color: 'text-blue-400' },
    { key: 'membrosAtivos', label: 'Membros ativos', icon: Users, color: 'text-violet-400' },
    { key: 'novasVidasMes', label: 'Novas vidas (mês)', icon: Heart, color: 'text-rose-400' },
    { key: 'redesAtivas', label: 'Redes ativas', icon: Network, color: 'text-primary' },
    { key: 'coordenacoesAtivas', label: 'Coordenações', icon: Layers, color: 'text-emerald-400' },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!metrics) return null;

  // Filter out metrics with undefined values
  const visibleItems = items.filter(item => metrics[item.key] !== undefined);

  if (!visibleItems.length) return null;

  const cols = visibleItems.length <= 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={cn('grid gap-3', cols)}>
      {visibleItems.map(({ key, label, icon: Icon, color }) => (
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
  );
}

export { getSectionLabel };
