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

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  nova_vida: { icon: Heart, color: 'text-rose-500 bg-rose-500/12' },
  relatorio: { icon: ClipboardCheck, color: 'text-blue-500 bg-blue-500/12' },
  encaminhamento: { icon: ArrowRight, color: 'text-amber-500 bg-amber-500/12' },
  membro: { icon: Users, color: 'text-violet-500 bg-violet-500/12' },
};

export function RecentActivity({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="premium-surface space-y-2 rounded-3xl p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="premium-surface rounded-3xl border border-dashed border-border/55 p-5 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
      </div>
    );
  }

  return (
    <div className="premium-surface overflow-hidden rounded-3xl">
      {items.map((item, index) => {
        const { icon: Icon, color } = iconMap[item.type] || iconMap.membro;
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-background/60',
              index < items.length - 1 && 'border-b border-border/40'
            )}
          >
            <div className={cn('rounded-xl p-2', color)}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="flex-1 truncate text-sm text-foreground/90">{item.description}</p>
            <span className="rounded-full bg-background/75 px-2.5 py-1 text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
