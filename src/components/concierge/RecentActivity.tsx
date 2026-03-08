import { Heart, ClipboardCheck, ArrowRight, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityItem } from '@/hooks/useRecentActivity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  nova_vida: { icon: Heart, color: 'text-destructive', bg: 'bg-destructive/12' },
  relatorio: { icon: ClipboardCheck, color: 'text-primary', bg: 'bg-primary/12' },
  encaminhamento: { icon: ArrowRight, color: 'text-warning', bg: 'bg-warning/12' },
  membro: { icon: Users, color: 'text-primary', bg: 'bg-primary/12' },
};

export function RecentActivity({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="glass-card space-y-1 rounded-2xl p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="glass-card rounded-2xl border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {items.map((item, index) => {
        const { icon: Icon, color, bg } = iconMap[item.type] || iconMap.membro;
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/30',
              index < items.length - 1 && 'border-b border-border/20'
            )}
          >
            <div className={cn('rounded-lg p-2', bg)}>
              <Icon className={cn('h-3.5 w-3.5', color)} />
            </div>
            <p className="flex-1 truncate text-sm text-foreground/85">{item.description}</p>
            <span className="rounded-full bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
