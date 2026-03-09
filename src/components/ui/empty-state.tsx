import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center glass-card rounded-2xl border border-dashed border-border/40",
      className,
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/30 mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-display font-semibold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
