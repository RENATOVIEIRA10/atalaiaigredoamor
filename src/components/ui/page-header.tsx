import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3"
          style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25"
              style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.08)' }}
            >
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
