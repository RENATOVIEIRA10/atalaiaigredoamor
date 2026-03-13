import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { HoverLift } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

// ─── Semantic color tokens ────────────────────────────────────────────────────

type ValueColor = 'gold' | 'vida' | 'ruby';

const COLOR_CLASSES: Record<ValueColor, { text: string; bar: string; badge: string }> = {
  gold: {
    text: 'text-[hsl(var(--gold))]',
    bar:  'bg-[hsl(var(--gold))]',
    badge: 'bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.25)]',
  },
  vida: {
    text: 'text-[hsl(var(--vida))]',
    bar:  'bg-[hsl(var(--vida))]',
    badge: 'bg-[hsl(var(--vida)/0.1)] text-[hsl(var(--vida))] border-[hsl(var(--vida)/0.25)]',
  },
  ruby: {
    text: 'text-[hsl(var(--ruby))]',
    bar:  'bg-[hsl(var(--ruby))]',
    badge: 'bg-[hsl(var(--ruby)/0.1)] text-[hsl(var(--ruby))] border-[hsl(var(--ruby)/0.25)]',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  /** Small secondary text rendered after the value (e.g. "/74" or "este mês") */
  unit?: string;
  subtitle?: string;
  /** Semantic color applied to value, bar fill and trend badge */
  color?: ValueColor;
  trend?: { value: number; positive: boolean };
  /** Progress bar: 0–100 */
  bar?: { pct: number; label?: string };
  className?: string;
  onClick?: () => void;
  /** Animate entrance — pass stagger index (0, 1, 2 …) */
  delay?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  subtitle,
  color,
  trend,
  bar,
  className,
  onClick,
  delay = 0,
}: StatCardProps) {
  const col = color ? COLOR_CLASSES[color] : null;

  const content = (
    <Card
      variant="glass"
      className={cn("group transition-all duration-300", onClick && "cursor-pointer", className)}
      onClick={onClick}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <CardContent className="p-5">
        {/* Label + icon row */}
        <div className="flex items-start justify-between mb-1">
          <p className="label-mono">{label}</p>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/30 group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
            <Icon className="h-4.5 w-4.5 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        {/* Value row — editorial serif light, optional unit */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <p className={cn("metric-number text-[40px] tabular-nums", col ? col.text : "text-foreground")}>
            {value}
          </p>
          {unit && (
            <span className="text-base text-muted-foreground font-light leading-none">
              {unit}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground leading-snug mb-2">{subtitle}</p>
        )}

        {/* Trend badge */}
        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium",
            col ? col.badge
              : trend.positive
                ? "bg-[hsl(var(--vida)/0.1)] text-[hsl(var(--vida))] border-[hsl(var(--vida)/0.25)]"
                : "bg-destructive/10 text-destructive border-destructive/20",
          )}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}

        {/* Progress bar */}
        {bar && (
          <div className="mt-3">
            {bar.label && (
              <div className="flex justify-between mb-1.5">
                <span className="label-mono text-[9px]">{bar.label}</span>
                <span className={cn("label-mono text-[9px]", col ? col.text : "text-primary")}>
                  {bar.pct}%
                </span>
              </div>
            )}
            <div className="h-[3px] rounded-full overflow-hidden bg-border/60">
              <div
                className={cn("h-full rounded-full bar-grow", col ? col.bar : "bg-primary")}
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
