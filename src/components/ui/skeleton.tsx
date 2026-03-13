import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// BASE SKELETON
// variant: "default" (neutral) | "gold" | "vida"
// ─────────────────────────────────────────────────────────────
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "vida";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        variant === "gold" ? "sk-gold" : variant === "vida" ? "sk-vida" : "sk",
        className
      )}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// ATALAIA ORBITAL LOADER
// Replaces generic <Loader2 className="animate-spin" />
// ─────────────────────────────────────────────────────────────
function AtalaiaLoader({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <div className="atalaia-ring absolute inset-0" />
      <svg
        width={size * 0.44}
        height={size * 0.44}
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M20 80C20 80 28 40 50 15C72 40 80 80 80 80"
          stroke="hsl(var(--gold))"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M35 60C40 57 60 57 65 60"
          stroke="hsl(var(--gold))"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle cx="50" cy="8" r="9" fill="hsl(var(--gold))" opacity="0.7" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK METRIC — Stat card skeleton
// ─────────────────────────────────────────────────────────────
function SkMetric({
  accentGold = false,
  delay = 0,
  className,
}: {
  accentGold?: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("glass-card rounded-2xl p-5 animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Label */}
      <div className="sk mb-4" style={{ width: "55%", height: 9 }} />
      {/* Number */}
      <div
        className={accentGold ? "sk-gold" : "sk"}
        style={{ width: "45%", height: 42, borderRadius: 8, marginBottom: 10 }}
      />
      {/* Subtitle */}
      <div className="sk mb-4" style={{ width: "70%", height: 9 }} />
      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <div className="sk" style={{ width: "35%", height: 8 }} />
          <div className={accentGold ? "sk-gold" : "sk"} style={{ width: "12%", height: 8 }} />
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
          <div
            className={cn("h-full rounded-full animate-pulse-soft", accentGold ? "sk-gold" : "sk")}
            style={{ width: "65%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK LIST — Alert/table list skeleton (Saúde da Rede)
// ─────────────────────────────────────────────────────────────
function SkList({ rows = 5, delay = 0, className }: { rows?: number; delay?: number; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl overflow-hidden animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-0 border-b border-border/30">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="sk mb-2.5" style={{ width: 80, height: 9 }} />
            <div className="sk-gold" style={{ width: 180, height: 22, borderRadius: 8 }} />
          </div>
          <div className="sk" style={{ width: 90, height: 28, borderRadius: 8 }} />
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {[64, 50, 40].map((w, i) => (
            <div key={i} className={i === 0 ? "sk-gold" : "sk"}
              style={{ width: w, height: 28, borderRadius: "8px 8px 0 0" }} />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="py-2">
        <div className="px-5 py-1.5 flex gap-3 mb-1">
          <div className="sk flex-1" style={{ height: 8 }} />
          <div className="sk" style={{ width: 24, height: 8 }} />
          <div className="sk" style={{ width: 60, height: 8 }} />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-2.5 flex items-center gap-3"
            style={{ animationDelay: `${delay + i * 50}ms` }}>
            <div className="sk shrink-0" style={{ width: 32, height: 32, borderRadius: 10 }} />
            <div className="flex-1">
              <div className="sk mb-1.5" style={{ width: `${55 + (i % 4) * 8}%`, height: 11 }} />
              <div className="sk" style={{ width: `${35 + (i % 3) * 8}%`, height: 9 }} />
            </div>
            <div className="sk" style={{ width: 24, height: 14 }} />
            <div className={i % 3 === 0 ? "sk-gold" : "sk"}
              style={{ width: 72, height: 22, borderRadius: 6 }} />
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/30 flex justify-between items-center">
        <div className="sk" style={{ width: 120, height: 9 }} />
        <div className="sk-gold" style={{ width: 80, height: 28, borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK PIPELINE — Funnel / Recomeço skeleton
// ─────────────────────────────────────────────────────────────
function SkPipeline({ delay = 0, className }: { delay?: number; className?: string }) {
  const pcts = [100, 76, 47, 29, 16];
  return (
    <div className={cn("glass-card rounded-2xl p-5 animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="sk mb-2.5" style={{ width: 90, height: 9 }} />
      <div className="sk-gold mb-5" style={{ width: 160, height: 22, borderRadius: 8 }} />
      <div className="space-y-3.5">
        {pcts.map((pct, i) => (
          <div key={i} style={{ animationDelay: `${delay + i * 60}ms` }}>
            <div className="flex justify-between mb-1.5">
              <div className="sk" style={{ width: `${50 + i * 8}%`, height: 10 }} />
              <div className="flex gap-2">
                <div className="sk" style={{ width: 28, height: 10 }} />
                <div className={i < 2 ? "sk-gold" : i > 3 ? "sk-vida" : "sk"}
                  style={{ width: 22, height: 16, borderRadius: 4 }} />
              </div>
            </div>
            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
              <div
                className={cn("h-full rounded-full animate-pulse-soft", i > 3 ? "sk-vida" : "sk")}
                style={{ width: `${pct}%`, animationDelay: `${i * 0.15}s` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK RHYTHM — Weekly rhythm bars skeleton
// ─────────────────────────────────────────────────────────────
function SkRhythm({ delay = 0, className }: { delay?: number; className?: string }) {
  const heights = [65, 55, 85, 70, 100, 50, 40];
  return (
    <div className={cn("glass-card rounded-2xl p-5 animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="sk mb-2.5" style={{ width: 100, height: 9 }} />
      <div className="sk-gold mb-5" style={{ width: 140, height: 22, borderRadius: 8 }} />
      <div className="flex items-end gap-1.5" style={{ height: 72 }}>
        {heights.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
            <div
              className={cn("w-full rounded-t-sm animate-pulse-soft", i === 4 ? "sk-gold" : "sk")}
              style={{ height: `${(h / 100) * 56}px`, animationDelay: `${i * 0.1}s` }}
            />
            <div className="sk" style={{ width: "70%", height: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK MEMBRO — Member profile skeleton
// ─────────────────────────────────────────────────────────────
function SkMembro({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-6 animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-3.5 mb-5">
        <div className="sk shrink-0" style={{ width: 52, height: 52, borderRadius: 14 }} />
        <div className="flex-1 pt-1">
          <div className="sk mb-2" style={{ width: "65%", height: 14 }} />
          <div className="sk-gold" style={{ width: "40%", height: 9 }} />
        </div>
        <div className="sk" style={{ width: 28, height: 28, borderRadius: 8 }} />
      </div>
      <div className="h-px bg-border/40 mb-4" />
      <div className="sk mb-2.5" style={{ width: 100, height: 8 }} />
      <div className="flex flex-wrap gap-2 mb-4">
        {[80, 96, 76, 110, 90].map((w, i) => (
          <div key={i} className={i < 3 ? "sk-vida" : "sk"}
            style={{ width: w, height: 24, borderRadius: 20 }} />
        ))}
      </div>
      <div className="h-px bg-border/40 mb-4" />
      {[["50%", "80%"], ["40%", "65%"], ["55%", "70%"]].map(([l, v], i) => (
        <div key={i} className="flex justify-between items-center mb-2.5">
          <div className="sk" style={{ width: l, height: 9 }} />
          <div className="sk" style={{ width: v, height: 9 }} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK RELATORIO — Weekly report form skeleton
// ─────────────────────────────────────────────────────────────
function SkRelatorio({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-6 animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="sk-gold mb-2.5" style={{ width: 130, height: 9 }} />
      <div className="sk mb-6" style={{ width: "50%", height: 20, borderRadius: 8 }} />
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="sk mb-2" style={{ width: "60%", height: 9 }} />
            <div className={i === 1 ? "sk-gold" : "sk"}
              style={{ width: "100%", height: 40, borderRadius: 10 }} />
          </div>
        ))}
      </div>
      <div className="sk mb-2" style={{ width: "45%", height: 9 }} />
      <div className="sk mb-5" style={{ width: "100%", height: 80, borderRadius: 10 }} />
      <div className="h-px bg-border/40 mb-4" />
      <div className="flex justify-end gap-2.5">
        <div className="sk" style={{ width: 90, height: 36, borderRadius: 10 }} />
        <div className="sk-gold" style={{ width: 130, height: 36, borderRadius: 10 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK CONCIERGE — Hero home card skeleton
// ─────────────────────────────────────────────────────────────
function SkConcierge({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <div
      className={cn("glass-card-strong rounded-2xl p-7 relative overflow-hidden animate-fade-in-up", className)}
      style={{
        background: "linear-gradient(135deg, hsl(var(--gold)/0.07) 0%, hsl(var(--card)/0.5) 60%)",
        border: "1px solid hsl(var(--gold)/0.22)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="absolute top-5 right-5">
        <AtalaiaLoader size={36} />
      </div>
      <div className="sk-gold mb-3.5" style={{ width: 120, height: 9 }} />
      <div className="sk-gold mb-2" style={{ width: "60%", height: 32, borderRadius: 10 }} />
      <div className="sk-gold mb-6" style={{ width: "40%", height: 28, borderRadius: 10 }} />
      <div className="sk mb-2" style={{ width: "75%", height: 11 }} />
      <div className="sk mb-6" style={{ width: "55%", height: 11 }} />
      <div className="flex flex-wrap gap-2.5">
        {[100, 120, 90, 110].map((w, i) => (
          <div key={i} className={i === 0 ? "sk-gold" : "sk"}
            style={{ width: w, height: 34, borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK DASHBOARD — Full dashboard layout skeleton
// ─────────────────────────────────────────────────────────────
function SkDashboard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Page title */}
      <div>
        <div className="sk-gold mb-2" style={{ width: "35%", height: 32, borderRadius: 10 }} />
        <div className="sk" style={{ width: "55%", height: 10 }} />
      </div>
      {/* Metric cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SkMetric delay={50} accentGold />
        <SkMetric delay={100} />
        <SkMetric delay={150} />
        <SkMetric delay={200} accentGold />
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <SkList rows={4} delay={250} />
        </div>
        <SkPipeline delay={300} />
        <SkRhythm delay={350} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SK PWA — Mobile dashboard skeleton (compact)
// ─────────────────────────────────────────────────────────────
function SkPWA({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)} style={{ animationDelay: `${delay}ms` }}>
      <SkConcierge delay={0} />
      <div className="grid grid-cols-2 gap-3">
        <SkMetric delay={80} accentGold />
        <SkMetric delay={130} />
        <SkMetric delay={180} />
        <SkMetric delay={230} />
      </div>
    </div>
  );
}

export {
  Skeleton,
  AtalaiaLoader,
  SkMetric,
  SkList,
  SkPipeline,
  SkRhythm,
  SkMembro,
  SkRelatorio,
  SkConcierge,
  SkDashboard,
  SkPWA,
};
