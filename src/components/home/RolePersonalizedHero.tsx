/**
 * RolePersonalizedHero – Cinematic hero section with role-specific greeting and context.
 */

import { Sparkles } from 'lucide-react';
import { AskGuideDialog } from '@/components/guide/AskGuideDialog';
import { getRoleUXConfig } from '@/lib/roleUXConfig';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { roleLabels } from '@/lib/icons';
import { cn } from '@/lib/utils';

export function RolePersonalizedHero() {
  const { scopeType, selectedRole } = useRole();
  const { activeCampo } = useCampo();
  const config = getRoleUXConfig(scopeType);
  const roleLabel = selectedRole ? roleLabels[selectedRole] : 'Atalaia';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const accentClass = config.hero.accentColor === 'gold' 
    ? 'border-gold/20 bg-gold/10 text-gold' 
    : 'border-primary/20 bg-primary/10 text-primary';

  return (
    <section className="command-surface relative overflow-hidden rounded-3xl p-6 md:p-9">
      {/* Ambient gradients */}
      <div className={cn(
        "absolute inset-0",
        config.hero.accentColor === 'gold'
          ? "bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.08),transparent_58%)]"
          : "bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_58%)]"
      )} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--vida)/0.03),transparent_52%)]" />

      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl space-y-4">
          {/* Badge */}
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1", accentClass)}>
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Atalaia OS</span>
          </div>

          {/* Main greeting */}
          <h1 className="editorial-heading text-3xl md:text-4xl font-semibold text-foreground">
            {greeting}, liderança.
            <span className="block font-display text-2xl md:text-3xl text-foreground/90 mt-1">
              {config.hero.greeting}
            </span>
          </h1>

          {/* Subtitle with context */}
          <p className="max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground">
            {config.hero.subtitle}
            {' '}
            <span className="text-foreground/70">
              Contexto: <span className="font-medium text-foreground">{roleLabel}</span>
              {activeCampo && (
                <> no campus <span className="font-medium text-foreground">{activeCampo.nome}</span></>
              )}
              .
            </span>
          </p>

          {/* Context chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {config.hero.contextChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/25 px-3 py-1 text-[11px] font-medium text-foreground/80"
              >
                <chip.icon className={cn("h-3 w-3", config.hero.accentColor === 'gold' ? 'text-gold' : 'text-primary')} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <AskGuideDialog />
      </div>
    </section>
  );
}
