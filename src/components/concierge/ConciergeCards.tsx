import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConciergeCard as ConciergeCardType } from '@/hooks/useConciergeCards';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  cards: ConciergeCardType[] | undefined;
  isLoading: boolean;
}

export function ConciergeCards({ cards, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border/55 bg-card/60 p-8 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success opacity-80" />
        <p className="text-base font-medium text-foreground">Tudo em dia!</p>
        <p className="mt-1 text-sm text-muted-foreground">Não há pendências no momento</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((card, i) => {
        const featured = i === 0;
        return (
          <div
            key={card.id}
            className={cn(
              'group relative overflow-hidden rounded-3xl border border-border/55 bg-[linear-gradient(165deg,hsl(var(--card)/0.95),hsl(var(--card)/0.82))] p-5 transition-all duration-300',
              'hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_24px_36px_-30px_hsl(222_30%_20%/0.6)]',
              featured && 'md:col-span-2 md:flex md:items-center md:gap-5'
            )}
            onClick={() => navigate(card.actionPath)}
            role="button"
          >
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className={cn('relative mb-4 inline-flex rounded-2xl border border-border/45 p-3', card.iconColor, featured && 'mb-0')}>
              <card.icon className="h-5 w-5" />
            </div>

            <div className={cn('relative flex-1', featured && 'md:pr-8')}>
              <p className="text-base font-semibold tracking-tight text-foreground">{card.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            </div>

            <Button
              size="sm"
              className={cn('relative mt-4 h-9 rounded-full px-4 text-xs', featured && 'md:mt-0')}
              onClick={(e) => {
                e.stopPropagation();
                navigate(card.actionPath);
              }}
            >
              {card.actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
