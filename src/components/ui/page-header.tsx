import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, actions, action, className }: PageHeaderProps) {
  const actionSlot = actions || action;
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.08)]">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actionSlot && <div className="flex flex-wrap items-center gap-2 shrink-0">{actionSlot}</div>}
    </div>
  );
}
