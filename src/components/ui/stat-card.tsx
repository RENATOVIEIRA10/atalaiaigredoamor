import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle, trend, className }: StatCardProps) {
  return (
    <Card variant="glass" className={cn("card-hover group", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-display font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium mt-1",
                  trend.positive ? "bg-vida/10 text-vida border-vida/20" : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Badge>
            )}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-primary/15 group-hover:ring-primary/30">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
