import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConciergeCard as ConciergeCardType } from '@/hooks/useConciergeCards';
import { ConciergeCardDrilldown } from './ConciergeCardDrilldown';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  cards: ConciergeCardType[] | undefined;
  isLoading: boolean;
}

const DRILLDOWN_CARD_IDS = [
  'novas-vidas-pendentes',
  'vidas-aguardando-contato',
  'celulas-sem-relatorio',
  'novas-vidas-mes',
];

export function ConciergeCards({ cards, isLoading }: Props) {
  const navigate = useNavigate();
  const [openDrilldown, setOpenDrilldown] = useState<{ id: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-muted/30" />
        ))}
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="glass-card rounded-2xl border-dashed p-8 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success opacity-80" />
        <p className="text-base font-semibold text-foreground">Tudo em dia!</p>
        <p className="mt-1 text-sm text-muted-foreground">Não há pendências no momento</p>
      </div>
    );
  }

  if (openDrilldown) {
    return (
      <ConciergeCardDrilldown
        cardId={openDrilldown.id}
        cardTitle={openDrilldown.title}
        onClose={() => setOpenDrilldown(null)}
      />
    );
  }

  const handleCardClick = (card: ConciergeCardType) => {
    if (DRILLDOWN_CARD_IDS.includes(card.id)) {
      setOpenDrilldown({ id: card.id, title: card.title });
    } else {
      navigate(card.actionPath);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-border/40 p-5 transition-all duration-300 cursor-pointer',
            'bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-lg',
            'hover:-translate-y-0.5 hover:border-border/60 hover:shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.2)]',
          )}
          onClick={() => handleCardClick(card)}
          role="button"
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/8 blur-2xl transition-all duration-500 group-hover:bg-primary/15" />
          
          <div className={cn('mb-3 inline-flex rounded-xl border border-border/30 bg-background/30 p-2.5', card.iconColor)}>
            <card.icon className="h-4.5 w-4.5" />
          </div>

          <p className="text-sm font-semibold tracking-tight text-foreground">{card.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{card.description}</p>

          <Button
            size="sm"
            className="relative mt-3 h-8 rounded-full px-3.5 text-[11px] font-semibold gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick(card);
            }}
          >
            {card.actionLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
