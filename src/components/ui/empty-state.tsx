import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10 mb-5">
          <Icon className="h-8 w-8 text-primary/40" />
        </div>
        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  );
}
