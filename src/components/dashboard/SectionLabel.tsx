import { cn } from '@/lib/utils';

interface SectionLabelProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionLabel({ title, subtitle, className }: SectionLabelProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="section-label">
        <span>{title}</span>
      </div>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground/60 pl-[calc(2rem+0.75rem)]">{subtitle}</p>
      )}
    </div>
  );
}
