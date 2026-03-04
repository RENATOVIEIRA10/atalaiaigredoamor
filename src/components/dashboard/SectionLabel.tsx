import { cn } from '@/lib/utils';

interface SectionLabelProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionLabel({ title, subtitle, className }: SectionLabelProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        style={{ letterSpacing: '0.1em' }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
      )}
    </div>
  );
}
