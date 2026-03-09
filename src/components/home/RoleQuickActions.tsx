/**
 * RoleQuickActions – Role-specific quick action buttons with personalized paths.
 */

import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getRoleUXConfig } from '@/lib/roleUXConfig';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';

export function RoleQuickActions() {
  const navigate = useNavigate();
  const { scopeType } = useRole();
  const config = getRoleUXConfig(scopeType);

  if (!config.quickActions.length) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {config.quickActions.map((action, idx) => (
        <button
          key={action.id}
          onClick={() => navigate(action.path)}
          className={cn(
            'group inline-flex items-center gap-2.5 rounded-xl border border-border/40 bg-background/30 px-4 py-3',
            'text-sm font-medium text-foreground/85 transition-all duration-250',
            'hover:border-primary/40 hover:bg-primary/8 hover:text-foreground',
            'hover:shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.25)]',
            `stagger-${idx + 1} animate-fade-in`
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
            <action.icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] leading-tight">{action.label}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      ))}
    </div>
  );
}
