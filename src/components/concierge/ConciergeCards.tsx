import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ConciergeCard as ConciergeCardType } from '@/hooks/useConciergeCards';
import { ConciergeCardDrilldown } from './ConciergeCardDrilldown';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

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

const cardVariantMap: Record<string, 'alert' | 'risk' | 'vida' | 'gold' | 'glass'> = {
  'text-amber-500': 'alert',
  'text-orange-500': 'alert',
  'text-rose-500': 'risk',
  'text-emerald-500': 'vida',
  'text-primary': 'glass',
  'text-blue-500': 'glass',
};

function getCardVariant(iconColor: string): 'alert' | 'risk' | 'vida' | 'gold' | 'glass' {
  return cardVariantMap[iconColor] || 'glass';
}

export function ConciergeCards({ cards, isLoading }: Props) {
  const navigate = useNavigate();
  const [openDrilldown, setOpenDrilldown] = useState<{ id: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <Card variant="glass" className="rounded-2xl border-dashed p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vida/10 text-vida">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-foreground">Tudo em dia!</p>
        <p className="mt-1 text-sm text-muted-foreground">Não há pendências no momento</p>
      </Card>
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, idx) => (
        <Card
          key={card.id}
          variant={getCardVariant(card.iconColor)}
          className={cn(
            'group relative overflow-hidden p-6 cursor-pointer',
            'hover:-translate-y-1 hover:shadow-[0_24px_44px_-20px_hsl(var(--primary)/0.15)]',
            `stagger-${idx + 1} animate-fade-in`
          )}
          onClick={() => handleCardClick(card)}
          role="button"
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/6 blur-2xl transition-all duration-500 group-hover:bg-primary/12" />
          
          {/* Icon */}
          <div className={cn(
            'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/30 bg-background/40',
            card.iconColor
          )}>
            <card.icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <p className="text-base font-semibold tracking-tight text-foreground leading-tight">
              {card.title}
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
              {card.description}
            </p>
          </div>

          {/* Action */}
          <Button
            size="sm"
            className="relative mt-5 h-9 rounded-xl px-4 text-xs font-semibold gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick(card);
            }}
          >
            {card.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
