import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
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
      <Card className="p-6 text-center border-dashed">
        <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
        <p className="text-xs text-muted-foreground mt-1">Não há pendências no momento</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <Card
          key={card.id}
          className={cn(
            'p-4 flex items-center gap-4 card-hover cursor-pointer group',
            `stagger-${i + 1} fade-in`
          )}
          onClick={() => navigate(card.actionPath)}
        >
          <div className={cn('shrink-0 p-2.5 rounded-xl bg-card', card.iconColor)}>
            <card.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{card.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
          </div>
          <Button
            size="sm"
            variant="default"
            className="shrink-0 text-xs h-8 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); navigate(card.actionPath); }}
          >
            {card.actionLabel}
          </Button>
        </Card>
      ))}
    </div>
  );
}
