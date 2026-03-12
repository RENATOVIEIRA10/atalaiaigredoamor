import { LucideIcon } from 'lucide-react';
import { ReactNode, ComponentType } from 'react';
import { cn } from '@/lib/utils';

// ─── Background Ambient Components ──────────────────────────────────────────

function BgDots() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="es-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="hsl(var(--foreground))" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#es-dots)" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/[0.06] blur-[60px]" />
    </div>
  );
}

function BgOrganic() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-vida/[0.04] blur-[60px]"
        style={{ animation: 'emptyBreathe 6s ease-in-out infinite' }} />
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <path d="M0 60 Q40 30 80 50 T160 40 T240 55 T320 45" stroke="hsl(var(--vida))" strokeWidth="0.5" fill="none" />
        <path d="M0 80 Q50 60 100 70 T200 55 T300 65" stroke="hsl(var(--vida))" strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}

function BgRings() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none flex items-center justify-center">
      {[80, 110, 140, 170].map((size, i) => (
        <div key={i}
          className="absolute rounded-full border border-primary/[0.04]"
          style={{
            width: size, height: size,
            animation: `emptyBreathe ${5 + i}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function BgDiagonal() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="es-diag" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="hsl(var(--primary))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#es-diag)" />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full bg-primary/[0.04] blur-[50px]" />
    </div>
  );
}

// ─── Background map by context ──────────────────────────────────────────────

const bgMap: Record<string, ComponentType> = {
  relatorio: BgDots,
  membros: BgOrganic,
  recomeco: BgRings,
  supervisoes: BgDots,
  financeiro: BgDiagonal,
  default: BgDots,
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Lucide icon (backward compat) */
  icon?: LucideIcon;
  /** Custom SVG glyph component (premium) */
  glyph?: ComponentType;
  /** Context key for background selection */
  context?: 'relatorio' | 'membros' | 'recomeco' | 'supervisoes' | 'financeiro' | 'celulas';
  /** DM Mono tag label */
  tag?: string;
  title: string;
  /** Alias for description (backward compat) */
  description?: string;
  subtitle?: string;
  /** CTA label */
  ctaLabel?: string;
  onCta?: () => void;
  /** ReactNode action (backward compat) */
  action?: ReactNode;
  /** Compact mode for inline usage */
  compact?: boolean;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  glyph: Glyph,
  context,
  tag,
  title,
  description,
  subtitle,
  ctaLabel,
  onCta,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const desc = subtitle || description;
  const BgComponent = bgMap[context || 'default'] || BgDots;

  return (
    <div
      className={cn(
        'relative glass-card rounded-2xl overflow-hidden transition-colors duration-300',
        'hover:border-primary/20',
        compact ? 'py-8 px-5' : 'py-0 px-0',
        className,
      )}
    >
      {/* Ambient background */}
      <BgComponent />

      {/* Content */}
      <div className={cn(
        'relative z-[2] flex flex-col items-center text-center',
        compact ? '' : 'py-12 px-9',
      )}>
        {/* Glyph or Icon */}
        {Glyph ? (
          <div className="w-20 h-20 mb-4" style={{ animation: 'emptyGlyphEntry 0.8s cubic-bezier(0.16,1,0.3,1) both' }}>
            <Glyph />
          </div>
        ) : Icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/30 mb-4 fade-up fade-up-1">
            <Icon className="h-7 w-7 text-muted-foreground/50" />
          </div>
        ) : null}

        {/* Tag */}
        {tag && (
          <p className="mono-label text-muted-foreground/40 mb-5 fade-up fade-up-1">{tag}</p>
        )}

        {/* Title */}
        <h3 className={cn(
          'tracking-tight text-foreground fade-up fade-up-2',
          Glyph
            ? 'font-editorial text-2xl font-light italic leading-snug'
            : 'text-base font-display font-semibold',
        )}>
          {title}
        </h3>

        {/* Description */}
        {desc && (
          <p className="mt-2.5 text-[13px] text-muted-foreground max-w-[260px] leading-relaxed fade-up fade-up-3">
            {desc}
          </p>
        )}

        {/* CTA Button */}
        {ctaLabel && onCta && (
          <button
            onClick={onCta}
            className={cn(
              'mt-6 px-5 py-2 rounded-[10px] text-[12.5px] font-medium',
              'border border-primary/25 bg-primary/10 text-primary',
              'hover:bg-primary/20 hover:border-primary/40 hover:-translate-y-px',
              'hover:shadow-[0_8px_24px_hsl(var(--primary)/0.15)]',
              'transition-all duration-200 ease-out',
              'fade-up fade-up-4',
            )}
          >
            {ctaLabel}
          </button>
        )}

        {/* Legacy action slot */}
        {action && <div className="mt-4 fade-up fade-up-4">{action}</div>}
      </div>
    </div>
  );
}
