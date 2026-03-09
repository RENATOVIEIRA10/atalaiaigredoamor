import { Heart, ClipboardCheck, ArrowRight, Users, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ActivityItem } from '@/hooks/useRecentActivity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  nova_vida: { icon: Heart, color: 'text-ruby', bg: 'bg-ruby/12' },
  relatorio: { icon: ClipboardCheck, color: 'text-primary', bg: 'bg-primary/12' },
  encaminhamento: { icon: ArrowRight, color: 'text-warning', bg: 'bg-warning/12' },
  membro: { icon: Users, color: 'text-vida', bg: 'bg-vida/12' },
};

export function RecentActivity({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card variant="glass" className="space-y-1 p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-muted/15" />
        ))}
      </Card>
    );
  }

  if (!items?.length) {
    return (
      <Card variant="glass" className="border-dashed p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/20">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden p-1.5">
      {items.map((item, index) => {
        const { icon: Icon, color, bg } = iconMap[item.type] || iconMap.membro;
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-4 rounded-xl px-5 py-4 transition-colors hover:bg-accent/30',
              `stagger-${index + 1} animate-fade-in`
            )}
          >
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bg)}>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground/90">{item.description}</p>
            </div>
            <span className="rounded-full bg-muted/30 px-3 py-1 text-[10px] font-semibold text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
