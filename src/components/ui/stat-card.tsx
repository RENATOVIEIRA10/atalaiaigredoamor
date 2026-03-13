import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverLift } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  /** Progress bar: 0–100 */
  bar?: { pct: number; label?: string };
  className?: string;
  onClick?: () => void;
  /** Animate entrance — pass stagger index (0, 1, 2 …) */
  delay?: number;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  bar,
  className,
  onClick,
  delay = 0,
}: StatCardProps) {
  const content = (
    <Card
      variant="glass"
      className={cn("group transition-all duration-300", onClick && "cursor-pointer", className)}
      onClick={onClick}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-1">
          {/* Label — monospace uppercase */}
          <p className="label-mono">{label}</p>
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/30 group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
            <Icon className="h-4.5 w-4.5 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        {/* Value — editorial serif light */}
        <p className="metric-number text-[40px] text-foreground tabular-nums mb-1">
          {value}
        </p>

        {subtitle && (
          <p className="text-xs text-muted-foreground leading-snug mb-2">{subtitle}</p>
        )}

        {trend && (
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] font-medium font-mono",
              trend.positive
                ? "bg-vida/10 text-vida border-vida/20"
                : "bg-destructive/10 text-destructive border-destructive/20",
            )}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Badge>
        )}

        {/* Optional progress bar */}
        {bar && (
          <div className="mt-3">
            {bar.label && (
              <div className="flex justify-between mb-1.5">
                <span className="label-mono text-[9px]">{bar.label}</span>
                <span className="label-mono text-[9px] text-primary">{bar.pct}%</span>
              </div>
            )}
            <div className="h-[3px] rounded-full overflow-hidden bg-border/60">
              <div
                className="h-full rounded-full bg-primary bar-grow"
                style={{ width: `${bar.pct}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return <HoverLift className="cursor-pointer">{content}</HoverLift>;
  }
  return content;
}
