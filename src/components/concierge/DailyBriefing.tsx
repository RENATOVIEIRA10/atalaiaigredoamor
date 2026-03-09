import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingUp,
  Heart,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConciergeCards, ConciergeCard as ConciergeCardType } from '@/hooks/useConciergeCards';
import { useSummaryMetrics } from '@/hooks/useSummaryMetrics';
import { useRole } from '@/contexts/RoleContext';
import { roleLabels } from '@/lib/icons';

interface Props {
  cards: ConciergeCardType[] | undefined;
  metrics: { novasVidasMes?: number; membrosAtivos?: number } | undefined;
}

export function DailyBriefing({ cards, metrics }: Props) {
  const navigate = useNavigate();
  const { selectedRole } = useRole();
  const roleLabel = selectedRole ? roleLabels[selectedRole] : 'Líder';

  const briefingItems = useMemo(() => {
    const items: {
      id: string;
      icon: React.ElementType;
      text: string;
      type: 'alert' | 'positive' | 'info';
      action?: () => void;
    }[] = [];

    cards?.forEach((card) => {
      if (card.id.includes('pendente') || card.id.includes('sem-relatorio')) {
        items.push({
          id: card.id,
          icon: AlertTriangle,
          text: card.title,
          type: 'alert',
          action: () => navigate(card.actionPath),
        });
      } else if (card.id.includes('vidas') && !card.id.includes('aguardando')) {
        items.push({
          id: card.id,
          icon: TrendingUp,
          text: card.title,
          type: 'positive',
          action: () => navigate(card.actionPath),
        });
      } else if (card.id.includes('aguardando')) {
        items.push({
          id: card.id,
          icon: Heart,
          text: card.title,
          type: 'alert',
          action: () => navigate(card.actionPath),
        });
      } else {
        items.push({
          id: card.id,
          icon: Activity,
          text: card.title,
          type: 'info',
          action: () => navigate(card.actionPath),
        });
      }
    });

    return items.slice(0, 5);
  }, [cards, navigate]);

  const hasAlerts = briefingItems.some((i) => i.type === 'alert');
  const hasPositive = briefingItems.some((i) => i.type === 'positive');

  return (
    <section className="command-surface relative overflow-hidden rounded-3xl">
      {/* Atmospheric layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--gold)/0.04),transparent_55%)]" />
      <div className="absolute top-6 right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl animate-float" />

      <div className="relative px-6 py-8 md:px-10 md:py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
              <span className="briefing-dot bg-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Briefing do dia
              </span>
            </div>
            <h2 className="font-editorial text-2xl md:text-3xl font-medium text-foreground">
              Direção pastoral
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              O que precisa da sua atenção como {roleLabel.toLowerCase()}.
            </p>
          </div>

          {/* Status indicator */}
          <div className={cn(
            'hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
            hasAlerts ? 'bg-warning/10 text-warning' :
            hasPositive ? 'bg-vida/10 text-vida' :
            'bg-muted/50 text-muted-foreground'
          )}>
            <span className={cn(
              'h-2 w-2 rounded-full',
              hasAlerts ? 'bg-warning animate-pulse' :
              hasPositive ? 'bg-vida' :
              'bg-muted-foreground'
            )} />
            {hasAlerts ? 'Atenção necessária' : hasPositive ? 'Reino avançando' : 'Tudo em ordem'}
          </div>
        </div>

        {/* Briefing Items */}
        {briefingItems.length > 0 ? (
          <div className="space-y-3">
            {briefingItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={item.action}
                className={cn(
                  'group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200',
                  'bg-background/30 border border-border/30',
                  'hover:bg-background/50 hover:border-border/50 hover:-translate-x-1',
                  `stagger-${idx + 1} animate-fade-in`
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  item.type === 'alert' && 'bg-warning/15 text-warning',
                  item.type === 'positive' && 'bg-vida/15 text-vida',
                  item.type === 'info' && 'bg-primary/15 text-primary',
                )}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <p className="flex-1 text-sm font-medium text-foreground/90">{item.text}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vida/10 text-vida">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground">Tudo em dia!</p>
            <p className="mt-1 text-sm text-muted-foreground">Nenhuma pendência urgente no momento</p>
          </div>
        )}

        {/* Quick context metrics */}
        {metrics && (metrics.novasVidasMes || metrics.membrosAtivos) && (
          <div className="mt-6 flex flex-wrap gap-4 border-t border-border/20 pt-6">
            {metrics.novasVidasMes !== undefined && metrics.novasVidasMes > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-ruby" />
                <span className="font-semibold text-foreground">{metrics.novasVidasMes}</span>
                <span className="text-muted-foreground">novas vidas no mês</span>
              </div>
            )}
            {metrics.membrosAtivos !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{metrics.membrosAtivos}</span>
                <span className="text-muted-foreground">membros ativos</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
