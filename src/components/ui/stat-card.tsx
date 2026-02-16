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
    <Card className={cn("card-hover", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium mt-1",
                  trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Badge>
            )}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
