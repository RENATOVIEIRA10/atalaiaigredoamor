import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { ConciergeCards } from '@/components/concierge/ConciergeCards';
import { QuickActionsBar } from '@/components/home/QuickActionsBar';
import { PastoralConciergeBlocks } from '@/components/home/PastoralConciergeBlocks';
import { SummaryMetricsPanel, getSectionLabel } from '@/components/concierge/SummaryMetrics';
import { RecentActivity } from '@/components/concierge/RecentActivity';
import { DailyBriefing } from '@/components/concierge/DailyBriefing';
import { OnboardingBanner } from '@/components/guide/OnboardingBanner';
import { AskGuideDialog } from '@/components/guide/AskGuideDialog';
import { useConciergeCards } from '@/hooks/useConciergeCards';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSummaryMetrics, getScopeLevel } from '@/hooks/useSummaryMetrics';
import { usePastorCampoConcierge, usePastorGlobalConcierge } from '@/hooks/usePastoralConcierge';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminPWADashboard } from '@/components/dashboard/pwa/AdminPWADashboard';
import { roleLabels } from '@/lib/icons';
import { Sparkles, Crosshair, Shield, Compass } from 'lucide-react';

export default function HomeConcierge() {
  const { data: cards, isLoading: cardsLoading } = useConciergeCards();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: metrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { selectedRole, scopeType, isAdmin } = useRole();
  const { activeCampo } = useCampo();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;
  const level = getScopeLevel(scopeType);
  const { incrementVisit } = useOnboarding();

  const isPastorCampo = scopeType === 'pastor_de_campo';
  const isPastorGlobal = scopeType === 'pastor_senior_global' || scopeType === 'pastor';
  const isPastoral = isPastorCampo || isPastorGlobal;

  const { data: pastorCampoData, isLoading: pastorCampoLoading } = usePastorCampoConcierge();
  const { data: pastorGlobalData, isLoading: pastorGlobalLoading } = usePastorGlobalConcierge();

  const pastoralData = isPastorCampo ? pastorCampoData : pastorGlobalData;
  const pastoralLoading = isPastorCampo ? pastorCampoLoading : pastorGlobalLoading;

  useEffect(() => {
    incrementVisit();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const roleLabel = selectedRole ? roleLabels[selectedRole] : 'Atalaia';

  // Admin in PWA → Torre de Controle as main view
  if (isAdmin && isPWAMobile) {
    return (
      <AppLayout title="Torre de Controle">
        <div className="mx-auto w-full max-w-[600px]">
          <AdminPWADashboard />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Centro de Comando Pastoral">
      <ScopeMissingGate>
        <div className="mx-auto w-full max-w-[1380px] space-y-7">
          <OnboardingBanner />

          {/* ═══ COMMAND HERO ═══ */}
          <section className="command-surface relative overflow-hidden rounded-3xl p-6 md:p-9">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--gold)/0.04),transparent_52%)]" />

            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Atalaia OS</span>
                </div>

                <h1 className="editorial-heading text-3xl md:text-4xl font-semibold text-foreground">
                  {greeting}, liderança.
                  <span className="block font-display text-2xl md:text-3xl text-foreground/90 mt-1">
                    Seu centro de comando pastoral está vivo.
                  </span>
                </h1>

                <p className="max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground">
                  Contexto ativo: <span className="text-foreground font-medium">{roleLabel}</span>
                  {activeCampo ? (
                    <>
                      {' '}no campus <span className="text-foreground font-medium">{activeCampo.nome}</span>.
                    </>
                  ) : (
                    '.'
                  )}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <ContextChip icon={Crosshair} label="Direção do dia" />
                  <ContextChip icon={Shield} label="Cuidado preventivo" />
                  <ContextChip icon={Compass} label="Ação pastoral" />
                </div>
              </div>

              <AskGuideDialog />
            </div>
          </section>

          {/* ═══ DAILY BRIEFING ═══ */}
          <DailyBriefing cards={cards} metrics={metrics} />

          {/* ═══ PASTORAL VIEW (Pastor de Campo / Pastor Global) ═══ */}
          {isPastoral ? (
            <PastoralConciergeBlocks
              data={pastoralData}
              isLoading={pastoralLoading}
              level={isPastorCampo ? 'campo' : 'global'}
            />
          ) : (
            <>
              {/* ═══ AÇÕES PASTORAIS ═══ */}
              <section className="space-y-3">
                <SectionLabel label="Ações pastorais prioritárias" />
                <ConciergeCards cards={cards} isLoading={cardsLoading} />
              </section>

              {/* ═══ PANORAMA + AÇÕES ESSENCIAIS ═══ */}
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <section className="space-y-4">
                  <SectionLabel label={getSectionLabel(level)} />
                  <SummaryMetricsPanel metrics={metrics} isLoading={metricsLoading} />
                </section>
                <aside className="space-y-4">
                  <SectionLabel label="Próximos passos" />
                  <div className="glass-card-strong rounded-2xl p-6">
                    <QuickActionsBar />
                  </div>
                </aside>
              </div>

              {/* ═══ MOVIMENTO VIVO ═══ */}
              <section className="space-y-3">
                <SectionLabel label="Vida acontecendo na igreja" />
                <RecentActivity items={activity} isLoading={activityLoading} />
              </section>
            </>
          )}
        </div>
      </ScopeMissingGate>
    </AppLayout>
  );
}

function ContextChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/25 px-3 py-1 text-[11px] font-medium text-foreground/80">
      <Icon className="h-3 w-3 text-primary" />
      {label}
    </span>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <h2 className="section-label">{label}</h2>;
}
