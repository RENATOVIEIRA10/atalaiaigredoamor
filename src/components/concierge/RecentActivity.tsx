import { Heart, ClipboardCheck, ArrowRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  nova_vida: { icon: Heart, color: 'text-rose-500 bg-rose-500/15' },
  relatorio: { icon: ClipboardCheck, color: 'text-blue-500 bg-blue-500/15' },
  encaminhamento: { icon: ArrowRight, color: 'text-amber-500 bg-amber-500/15' },
  membro: { icon: Users, color: 'text-violet-500 bg-violet-500/15' },
};

export function RecentActivity({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <Card className="p-4 text-center border-dashed">
        <p className="text-xs text-muted-foreground">Nenhuma atividade recente</p>
      </Card>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const { icon: Icon, color } = iconMap[item.type] || iconMap.membro;
        return (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-card/60 transition-colors">
            <div className={cn('shrink-0 p-1.5 rounded-lg', color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">{item.description}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
