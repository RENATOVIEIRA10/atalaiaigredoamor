/**
 * RolePriorityCards – Dynamic priority alert cards based on role and real data.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getRoleUXConfig } from '@/lib/roleUXConfig';
import { useRole } from '@/contexts/RoleContext';
import { useConciergeCards, ConciergeCard } from '@/hooks/useConciergeCards';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function RolePriorityCards() {
  const navigate = useNavigate();
  const { scopeType } = useRole();
  const config = getRoleUXConfig(scopeType);
  const { data: cards, isLoading } = useConciergeCards();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <Card variant="glass" className="p-5 text-center">
        <p className="text-sm text-muted-foreground">
          ✅ Tudo em ordem! Nenhuma pendência no momento.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, idx) => (
        <PriorityCard key={card.id} card={card} index={idx} onClick={() => navigate(card.actionPath)} />
      ))}
    </div>
  );
}

function PriorityCard({ card, index, onClick }: { card: ConciergeCard; index: number; onClick: () => void }) {
  const Icon = card.icon;

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn(
        "group cursor-pointer p-4 transition-all duration-200",
        "hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.15)]",
        `stagger-${index + 1} animate-fade-in`
      )}
    >
      <div className="flex items-start gap-4">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-opacity-15", card.iconColor.replace('text-', 'bg-').replace('500', '500/15'))}>
          <Icon className={cn("h-5 w-5", card.iconColor)} />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground leading-tight">{card.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
          {card.actionLabel}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </Card>
  );
}
