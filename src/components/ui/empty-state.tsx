import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// ORIGINAL EmptyState — backward compatible
// ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center glass-card rounded-2xl border border-dashed border-border/40",
      className,
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/30 mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-display font-semibold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG GLYPHS — each context has its own symbol
// ─────────────────────────────────────────────────────────────

function GlyphTorre() {
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none" className="glyph-in">
      <circle cx="40" cy="40" r="32" fill="hsl(var(--gold))" style={{ opacity: 0.07, animation: 'breathe-glow 4s ease-in-out infinite' }} />
      <circle cx="40" cy="40" r="20" fill="hsl(var(--gold))" style={{ opacity: 0.05, animation: 'breathe-glow 4s ease-in-out infinite 1s' }} />
      <path d="M28 60 L28 30 L40 16 L52 30 L52 60"
        stroke="hsl(var(--gold))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="120" strokeDashoffset="120" className="line-draw" />
      <path d="M34 60 L34 44 L46 44 L46 60"
        stroke="hsl(var(--gold))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="80" strokeDashoffset="80"
        style={{ animation: 'line-draw 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s forwards' }} />
      <circle cx="40" cy="16" r="4" fill="hsl(var(--gold))"
        style={{ animation: 'glyph-in 0.5s ease 0.8s both, breathe-glow 2s ease-in-out infinite 1s' }} />
      <rect x="36" y="34" width="8" height="6" rx="1"
        stroke="hsl(var(--gold)/0.5)" strokeWidth="1.5"
        strokeDasharray="30" strokeDashoffset="30"
        style={{ animation: 'line-draw 0.6s ease 0.9s forwards' }} />
      <line x1="24" y1="60" x2="56" y2="60" stroke="hsl(var(--gold)/0.4)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GlyphSemente() {
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none" className="glyph-in">
      <circle cx="40" cy="40" r="30" fill="hsl(var(--vida))" style={{ opacity: 0.08, animation: 'breathe-glow 5s ease-in-out infinite' }} />
      <path d="M40 62 L40 38"
        stroke="hsl(var(--vida)/0.8)" strokeWidth="2" strokeLinecap="round"
        strokeDasharray="30" strokeDashoffset="30"
        style={{ animation: 'line-draw 0.8s ease 0.3s forwards' }} />
      <path d="M40 50 C32 46 26 38 30 30 C38 34 42 44 40 50Z"
        fill="hsl(var(--vida)/0.2)" stroke="hsl(var(--vida))" strokeWidth="1.5"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: 'line-draw 0.9s ease 0.6s forwards' }} />
      <path d="M40 44 C48 40 54 32 50 24 C42 28 38 38 40 44Z"
        fill="hsl(var(--vida)/0.15)" stroke="hsl(var(--vida)/0.8)" strokeWidth="1.5"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: 'line-draw 0.9s ease 0.85s forwards' }} />
      <ellipse cx="40" cy="65" rx="8" ry="4"
        fill="hsl(var(--vida)/0.15)" stroke="hsl(var(--vida)/0.5)" strokeWidth="1.2"
        strokeDasharray="40" strokeDashoffset="40"
        style={{ animation: 'line-draw 0.6s ease 1s forwards' }} />
      <circle cx="40" cy="24" r="3" fill="hsl(var(--vida))"
        style={{ opacity: 0.8, animation: 'breathe-glow 2.5s ease-in-out infinite 0.5s' }} />
    </svg>
  );
}

function GlyphPortal() {
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none" className="glyph-in">
      {[28, 22, 16].map((r, i) => (
        <circle key={r} cx="40" cy="40" r={r} stroke="hsl(var(--gold))" strokeWidth="1"
          style={{ opacity: 0.12 + i * 0.06, animation: `pulse-ring 2.5s ease-out infinite ${i * 0.6}s` }} />
      ))}
      <path d="M22 58 L22 36 A18 18 0 0 1 58 36 L58 58"
        stroke="hsl(var(--gold))" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="100" strokeDashoffset="100"
        style={{ animation: 'line-draw 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s forwards' }} />
      <line x1="18" y1="58" x2="62" y2="58" stroke="hsl(var(--gold)/0.4)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="36" r="5" fill="hsl(var(--gold)/0.12)" stroke="hsl(var(--gold))" strokeWidth="1.5"
        style={{ animation: 'glyph-in 0.5s ease 0.9s both' }} />
      <circle cx="40" cy="36" r="2.5" fill="hsl(var(--gold))"
        style={{ animation: 'breathe-glow 2s ease-in-out infinite 1s' }} />
      {[34, 40, 46].map((x, i) => (
        <line key={x} x1={x} y1="44" x2={x} y2="52" stroke="hsl(var(--gold)/0.3)" strokeWidth="1"
          strokeDasharray="12" strokeDashoffset="12"
          style={{ animation: `line-draw 0.5s ease ${1.1 + i * 0.1}s forwards` }} />
      ))}
    </svg>
  );
}

function GlyphCalendario() {
  const days = [
    [24,42],[32,42],[40,42],[48,42],[56,42],
    [24,52],[32,52],[40,52],[48,52],[56,52],
  ];
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none" className="glyph-in">
      <rect x="16" y="22" width="48" height="42" rx="6"
        fill="hsl(var(--gold)/0.06)" stroke="hsl(var(--gold)/0.5)" strokeWidth="1.5"
        strokeDasharray="180" strokeDashoffset="180" className="line-draw" />
      <line x1="28" y1="16" x2="28" y2="28" stroke="hsl(var(--gold))" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="52" y1="16" x2="52" y2="28" stroke="hsl(var(--gold))" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="34" x2="64" y2="34" stroke="hsl(var(--gold)/0.3)" strokeWidth="1" />
      {days.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5"
          fill="none" stroke="hsl(var(--gold)/0.25)" strokeWidth="1"
          style={{ animation: `glyph-in 0.3s ease ${0.8 + i * 0.06}s both` }} />
      ))}
      <text x="40" y="57" textAnchor="middle"
        style={{ font: "300 10px 'Playfair Display', serif", fill: 'hsl(var(--gold)/0.3)' }}>
        ∅
      </text>
    </svg>
  );
}

function GlyphMoeda() {
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none"
      className="glyph-in" style={{ animation: 'glyph-in 0.7s ease both, float 4s ease-in-out infinite 0.7s' }}>
      <circle cx="40" cy="40" r="24"
        fill="hsl(var(--gold)/0.07)" stroke="hsl(var(--gold)/0.4)" strokeWidth="2"
        strokeDasharray="160" strokeDashoffset="160" className="line-draw" />
      <circle cx="40" cy="40" r="18"
        fill="hsl(var(--gold)/0.04)" stroke="hsl(var(--gold)/0.22)" strokeWidth="1.2"
        strokeDasharray="120" strokeDashoffset="120"
        style={{ animation: 'line-draw 0.9s ease 0.5s forwards' }} />
      <text x="40" y="47" textAnchor="middle"
        style={{ font: "300 22px 'Playfair Display', serif", fill: 'hsl(var(--gold)/0.7)', animation: 'glyph-in 0.5s ease 0.8s both' }}>
        R$
      </text>
      <ellipse cx="34" cy="30" rx="4" ry="2" fill="white"
        style={{ opacity: 0.06, transform: 'rotate(-20deg)', transformOrigin: '34px 30px' }} />
    </svg>
  );
}

function GlyphEspera() {
  return (
    <svg width="76" height="76" viewBox="0 0 80 80" fill="none" className="glyph-in">
      <circle cx="40" cy="40" r="30" fill="none"
        stroke="hsl(var(--muted-foreground)/0.3)" strokeWidth="1"
        strokeDasharray="4 6"
        style={{ animation: 'spin-slow 20s linear infinite' }} />
      <path d="M29 20 L51 20 L40 40 L51 60 L29 60 L40 40 Z"
        fill="hsl(var(--gold)/0.07)" stroke="hsl(var(--gold))" strokeWidth="1.5" strokeLinejoin="round"
        strokeDasharray="150" strokeDashoffset="150"
        style={{ animation: 'line-draw 1.2s ease 0.2s forwards' }} />
      <circle cx="40" cy="39" r="2" fill="hsl(var(--gold)/0.8)"
        style={{ animation: 'breathe-glow 1.8s ease-in-out infinite 0.5s' }} />
      <ellipse cx="40" cy="54" rx="6" ry="3" fill="hsl(var(--gold)/0.22)"
        style={{ animation: 'glyph-in 0.5s ease 1s both' }} />
      <line x1="26" y1="20" x2="54" y2="20" stroke="hsl(var(--gold)/0.5)" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="60" x2="54" y2="60" stroke="hsl(var(--gold)/0.5)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// AMBIENT BACKGROUNDS — unique per context
// ─────────────────────────────────────────────────────────────

function BgDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" className="absolute opacity-[0.06]">
        <defs>
          <pattern id="dots-es" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="hsl(var(--gold))" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots-es)" />
      </svg>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)/0.12) 0%, transparent 70%)', animation: 'breathe-glow 4s ease-in-out infinite' }} />
    </div>
  );
}

function BgRings() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {[120, 160, 200, 240].map((r, i) => (
        <div key={r} className="absolute rounded-full border border-gold/[0.05]"
          style={{ width: r, height: r, animation: `breathe-glow ${4 + i}s ease-in-out infinite ${i * 0.5}s` }} />
      ))}
    </div>
  );
}

function BgOrganic() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(var(--vida)/0.1) 0%, transparent 65%)', animation: 'breathe-glow 5s ease-in-out infinite 1s' }} />
      <svg width="100%" height="100%" className="absolute opacity-[0.08]">
        <path d="M0 80 Q80 40 160 80 T320 80" stroke="hsl(var(--vida))" strokeWidth="1" fill="none" />
        <path d="M0 120 Q80 80 160 120 T320 120" stroke="hsl(var(--vida))" strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}

function BgGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" className="absolute opacity-[0.04]">
        <defs>
          <pattern id="diag-es" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="30" stroke="hsl(var(--gold))" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diag-es)" />
      </svg>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold)/0.08) 0%, transparent 70%)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTEXTUAL EMPTY STATE — 6 pastoral variants
// ─────────────────────────────────────────────────────────────
type ContextualVariant =
  | 'relatorio'
  | 'membros'
  | 'recomeco'
  | 'supervisoes'
  | 'financeiro'
  | 'celulas';

interface ContextualConfig {
  tag: string;
  title: string;
  subtitle: string;
  Glyph: () => JSX.Element;
  Bg: () => JSX.Element;
  accentClass: string;        // Tailwind color for CTA border/text
  accentBgClass: string;      // Tailwind bg for CTA
}

const CONTEXTUAL_CONFIGS: Record<ContextualVariant, ContextualConfig> = {
  relatorio: {
    tag: 'Relatório Semanal',
    title: 'Nenhum relatório esta semana',
    subtitle: 'Sua célula ainda não registrou encontro nesta semana. Cada reunião é uma história de fé a preservar.',
    Glyph: GlyphTorre,
    Bg: BgDots,
    accentClass: 'text-gold border-gold/30',
    accentBgClass: 'bg-gold/10 hover:bg-gold/18',
  },
  membros: {
    tag: 'Membros · Célula',
    title: 'A célula aguarda sua primeira família',
    subtitle: 'Quando o primeiro membro for adicionado, você verá aqui a história de cuidado de cada pessoa.',
    Glyph: GlyphSemente,
    Bg: BgOrganic,
    accentClass: 'text-vida border-vida/30',
    accentBgClass: 'bg-vida/10 hover:bg-vida/18',
  },
  recomeco: {
    tag: 'Recomeço · Fila',
    title: 'Nenhuma vida aguardando',
    subtitle: 'Todas as decisões de fé desta semana já foram acolhidas e encaminhadas. O portal está pronto.',
    Glyph: GlyphPortal,
    Bg: BgRings,
    accentClass: 'text-gold border-gold/30',
    accentBgClass: 'bg-gold/10 hover:bg-gold/18',
  },
  supervisoes: {
    tag: 'Supervisões',
    title: 'Nenhuma supervisão neste período',
    subtitle: 'As visitas do supervisor às células ainda não foram registradas neste ciclo bimestral.',
    Glyph: GlyphCalendario,
    Bg: BgDots,
    accentClass: 'text-gold border-gold/30',
    accentBgClass: 'bg-gold/10 hover:bg-gold/18',
  },
  financeiro: {
    tag: 'Financeiro · Extrato',
    title: 'Nenhum movimento registrado',
    subtitle: 'O livro financeiro está em branco. Importe um extrato ou registre o primeiro lançamento.',
    Glyph: GlyphMoeda,
    Bg: BgGrid,
    accentClass: 'text-gold border-gold/30',
    accentBgClass: 'bg-gold/10 hover:bg-gold/18',
  },
  celulas: {
    tag: 'Células · Coordenação',
    title: 'Ainda não há células aqui',
    subtitle: 'Esta coordenação ainda não possui células vinculadas. Quando forem adicionadas, aparecerão aqui.',
    Glyph: GlyphEspera,
    Bg: BgDots,
    accentClass: 'text-muted-foreground border-border',
    accentBgClass: 'bg-muted/50 hover:bg-muted/70',
  },
};

interface ContextualEmptyStateProps {
  variant: ContextualVariant;
  ctaLabel?: string;
  onCta?: () => void;
  compact?: boolean;
  className?: string;
}

export function ContextualEmptyState({
  variant,
  ctaLabel,
  onCta,
  compact = false,
  className,
}: ContextualEmptyStateProps) {
  const cfg = CONTEXTUAL_CONFIGS[variant];
  const { Glyph, Bg } = cfg;

  return (
    <div className={cn('glass-card rounded-2xl relative overflow-hidden', className)}>
      <Bg />
      <div
        className={cn(
          'relative z-10 flex flex-col items-center text-center',
          compact ? 'px-7 py-8' : 'px-9 py-12',
        )}
      >
        {/* Glyph */}
        <div className="mb-5">
          <Glyph />
        </div>

        {/* Tag */}
        <span className="label-mono mb-5">{cfg.tag}</span>

        {/* Title */}
        <h3
          className={cn(
            'font-editorial font-light text-foreground leading-tight mb-3',
            compact ? 'text-[19px]' : 'text-[23px]',
          )}
          style={{ fontStyle: 'italic', letterSpacing: '-0.01em' }}
        >
          {cfg.title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
          {cfg.subtitle}
        </p>

        {/* CTA */}
        {(ctaLabel || onCta) && (
          <button
            onClick={onCta}
            className={cn(
              'mt-6 px-5 py-2 rounded-[10px] border text-[12.5px] font-medium transition-all duration-200',
              'hover:-translate-y-px hover:shadow-md',
              cfg.accentClass,
              cfg.accentBgClass,
            )}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
