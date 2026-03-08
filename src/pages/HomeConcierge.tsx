import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { ConciergeCards } from '@/components/concierge/ConciergeCards';
import { QuickActionsBar } from '@/components/home/QuickActionsBar';
import { PastoralConciergeBlocks } from '@/components/home/PastoralConciergeBlocks';
import { SummaryMetricsPanel, getSectionLabel } from '@/components/concierge/SummaryMetrics';
import { RecentActivity } from '@/components/concierge/RecentActivity';
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
import { Sparkles, Star } from 'lucide-react';

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
    <AppLayout title="Início">
      <ScopeMissingGate>
        <div className="mx-auto w-full max-w-[1360px] space-y-6">
          <OnboardingBanner />

          {/* ═══ HERO CINEMATOGRÁFICO ═══ */}
          <section className="relative overflow-hidden rounded-3xl">
            {/* Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-gold/5" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.2),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--gold)/0.08),transparent_50%)]" />
            <div className="absolute top-4 right-8 h-32 w-32 rounded-full bg-gold/8 blur-3xl animate-float" />

            <div className="glass-card-strong relative px-6 py-8 md:px-10 md:py-10">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="space-y-3 max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/8 px-3 py-1">
                    <Star className="h-3 w-3 text-gold" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                      {selectedRole ? roleLabels[selectedRole] : 'Atalaia'}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
                    {greeting},<br />
                    <span className="gradient-text-gold">líder</span>
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
                    Você lidera um movimento de transformação espiritual.
                    {activeCampo ? ` Campus ${activeCampo.nome}.` : ''}
                    {' '}Hoje o Reino avançou através de você.
                  </p>
                </div>
                <AskGuideDialog />
              </div>

              {/* Priority Cards inline */}
              <div className="mt-8">
                <SectionLabel label="O que precisa da sua atenção" />
                <div className="mt-3">
                  <ConciergeCards cards={cards} isLoading={cardsLoading} />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ PANORAMA + AÇÕES ═══ */}
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <section className="space-y-5">
              <SectionLabel label={getSectionLabel(level)} />
              <SummaryMetricsPanel metrics={metrics} isLoading={metricsLoading} />
            </section>
            <aside className="space-y-5">
              <SectionLabel label="Ações essenciais" />
              <div className="glass-card rounded-2xl p-5">
                <QuickActionsBar />
              </div>
            </aside>
          </div>

          {/* ═══ ATIVIDADE RECENTE ═══ */}
          <section className="space-y-3">
            <SectionLabel label="Atividade recente" />
            <RecentActivity items={activity} isLoading={activityLoading} />
          </section>
        </div>
      </ScopeMissingGate>
    </AppLayout>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-semibold flex items-center gap-3">
      <span className="h-px w-8 bg-gradient-to-r from-primary/50 to-transparent" />
      {label}
    </h2>
  );
}
