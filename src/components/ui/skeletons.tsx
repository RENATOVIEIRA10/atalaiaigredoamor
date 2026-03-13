/**
 * Atalaia OS — Skeletons contextuais premium
 * Cada skeleton respeita a hierarquia visual: base (neutro), gold (destaque), vida (frutos).
 */
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Loader Orbital (símbolo Atalaia) ────────────────────────────────────────

export function AtalaiaLoader({ size = 40 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Anel girando */}
      <div
        className="absolute inset-0 rounded-full border-[1.5px] border-primary/25 border-t-primary animate-[spin-slow_1.2s_linear_infinite]"
      />
      {/* Mini logo */}
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 16 16" fill="none">
        <path d="M8 2L10 6H6L8 2Z" fill="hsl(var(--primary))" opacity="0.8" />
        <rect x="7" y="6" width="2" height="7" rx="0.5" fill="hsl(var(--primary))" opacity="0.6" />
        <circle cx="8" cy="14.5" r="1" fill="hsl(var(--primary))" opacity="0.4" />
      </svg>
      {/* Orbiting dot */}
      <div
        className="absolute w-[5px] h-[5px] rounded-full bg-primary/80"
        style={{ animation: 'skeleton-orbit 1.2s linear infinite' }}
      />
    </div>
  );
}

// ─── Skeleton: Card de Métrica ───────────────────────────────────────────────

export function SkeletonMetricCard({ accentGold = false, className }: { accentGold?: boolean; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 space-y-3", className)}>
      {/* Tag */}
      <Skeleton className="h-2.5 w-16" />
      {/* Número */}
      <Skeleton variant={accentGold ? 'gold' : 'default'} className="h-9 w-20 rounded-lg" />
      {/* Subtítulo */}
      <Skeleton className="h-2 w-24" />
      {/* Barra de progresso */}
      <div className="pt-2 space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-14" />
          <Skeleton className="h-2 w-8" />
        </div>
        <div className="h-[3px] rounded-full bg-border/20 overflow-hidden">
          <div className="sk-gold h-full rounded-full" style={{ animation: 'skeleton-bar-ghost 3s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton: Lista (Saúde da Rede) ─────────────────────────────────────────

export function SkeletonListCard({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="p-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="gold" className="h-5 w-5 rounded" />
            <Skeleton variant="gold" className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        {/* Tabs */}
        <div className="flex gap-2 pt-1">
          {[60, 50, 40].map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-md" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="px-5 pb-4 space-y-0">
        {/* Table header */}
        <div className="flex justify-between py-2 border-b border-border/10">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-2 w-8" />
          <Skeleton className="h-2 w-14" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/5"
            style={{ animationDelay: `${i * 0.06}s` }}>
            {/* Avatar */}
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            {/* Name + cell */}
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-2 w-20" />
            </div>
            {/* Points */}
            <Skeleton className="h-3 w-8" />
            {/* Status badge */}
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex justify-between border-t border-border/10">
        <Skeleton className="h-2 w-28" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

// ─── Skeleton: Funil / Pipeline ──────────────────────────────────────────────

export function SkeletonPipeline({ className }: { className?: string }) {
  const widths = [100, 76, 47, 29, 16];
  return (
    <div className={cn("glass-card rounded-2xl p-5 space-y-4", className)}>
      <Skeleton variant="gold" className="h-3 w-28" />
      <Skeleton className="h-2 w-36" />
      {widths.map((pct, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-2 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-2 w-8" />
              <Skeleton variant="gold" className="h-3 w-6" />
            </div>
          </div>
          <div className="h-[3px] rounded-full bg-border/20 overflow-hidden">
            <Skeleton variant="gold" className="h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton: Ritmo Semanal ─────────────────────────────────────────────────

export function SkeletonRhythm({ className }: { className?: string }) {
  const heights = [65, 55, 85, 70, 100, 50, 40];
  return (
    <div className={cn("glass-card rounded-2xl p-5 space-y-3", className)}>
      <Skeleton variant="gold" className="h-3 w-32" />
      <Skeleton className="h-2 w-28" />
      <div className="flex items-end gap-2 pt-2" style={{ height: 100 }}>
        {heights.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <Skeleton variant={i === 4 ? 'gold' : 'default'} className="w-full rounded-sm" style={{ height: h }} />
            <Skeleton className="h-2 w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton: Concierge Hero ────────────────────────────────────────────────

export function SkeletonConcierge({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card-strong rounded-2xl p-8 relative overflow-hidden", className)}>
      {/* Loader */}
      <div className="absolute top-5 right-5 opacity-40">
        <AtalaiaLoader size={32} />
      </div>
      {/* Tag */}
      <Skeleton className="h-2.5 w-20 mb-6" />
      {/* Título */}
      <Skeleton variant="gold" className="h-7 w-64 mb-2 rounded-lg" />
      <Skeleton variant="gold" className="h-7 w-44 mb-4 rounded-lg" />
      {/* Subtítulo */}
      <Skeleton className="h-3 w-80 mb-2" />
      <Skeleton className="h-3 w-60 mb-6" />
      {/* Chips */}
      <div className="flex gap-2">
        {[100, 120, 90, 110].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-lg" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton: Perfil de Membro ──────────────────────────────────────────────

export function SkeletonMembro({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 space-y-4", className)}>
      {/* Avatar + nome */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="gold" className="h-4 w-36" />
          <Skeleton className="h-2.5 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="h-px bg-border/10" />

      {/* Marcos espirituais */}
      <div className="space-y-2">
        <Skeleton className="h-2 w-28" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[80, 95, 75, 110, 90].map((w, i) => (
          <Skeleton key={i} variant="vida" className="h-7 rounded-full" style={{ width: w }} />
        ))}
      </div>

      <div className="h-px bg-border/10" />

      {/* Info fields */}
      {[["50%", "80%"], ["40%", "65%"], ["55%", "70%"]].map(([l, v], i) => (
        <div key={i} className="flex justify-between items-center">
          <Skeleton className="h-2.5" style={{ width: l }} />
          <Skeleton className="h-2.5" style={{ width: v }} />
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton: Relatório Semanal ─────────────────────────────────────────────

export function SkeletonRelatorio({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 space-y-4", className)}>
      <Skeleton variant="gold" className="h-4 w-36" />
      <Skeleton className="h-2.5 w-52" />

      {/* Campos */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Campo texto */}
      <div className="space-y-1.5">
        <Skeleton className="h-2 w-16" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      <div className="h-px bg-border/10" />

      {/* Botão */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton variant="gold" className="h-10 w-36 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Skeleton: Dashboard completo ────────────────────────────────────────────

export function SkeletonDashboard() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton variant="gold" className="h-5 w-40" />
        <Skeleton className="h-2.5 w-64" />
      </div>
      {/* 4 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SkeletonMetricCard accentGold />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard accentGold />
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonListCard className="lg:col-span-1" />
        <SkeletonPipeline />
        <SkeletonRhythm />
      </div>
    </div>
  );
}
