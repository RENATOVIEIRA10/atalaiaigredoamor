import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConciergeCard as ConciergeCardType } from '@/hooks/useConciergeCards';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface Props {
  cards: ConciergeCardType[] | undefined;
  isLoading: boolean;
}

export function ConciergeCards({ cards, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="p-6 text-center rounded-xl border border-dashed border-border/40 bg-card/30">
        <CheckCircle className="h-10 w-10 text-success mx-auto mb-3 opacity-80" />
        <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
        <p className="text-xs text-muted-foreground mt-1">Não há pendências no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className={cn(
            'p-4 flex items-center gap-4 cursor-pointer group rounded-xl',
            'bg-card/60 border border-border/40 hover:border-border/60',
            'transition-all duration-200 hover:-translate-y-0.5',
            'hover:shadow-[0_8px_32px_-4px_hsl(0_0%_0%/0.4)]',
            `stagger-${i + 1} fade-in`
          )}
          onClick={() => navigate(card.actionPath)}
        >
          <div className={cn(
            'shrink-0 p-2.5 rounded-xl border border-border/30',
            card.iconColor
          )}>
            <card.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{card.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
          </div>
          <Button
            size="sm"
            variant="default"
            className="shrink-0 text-xs h-8 rounded-lg opacity-80 group-hover:opacity-100 transition-all group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
            onClick={(e) => { e.stopPropagation(); navigate(card.actionPath); }}
          >
            {card.actionLabel}
          </Button>
        </div>
      ))}
    </div>
  );
}
