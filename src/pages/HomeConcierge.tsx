import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { RolePersonalizedHero } from '@/components/home/RolePersonalizedHero';
import { RoleQuickActions } from '@/components/home/RoleQuickActions';
import { RolePriorityCards } from '@/components/home/RolePriorityCards';
import { PastoralConciergeBlocks } from '@/components/home/PastoralConciergeBlocks';
import { SummaryMetricsPanel, getSectionLabel } from '@/components/concierge/SummaryMetrics';
import { RecentActivity } from '@/components/concierge/RecentActivity';
import { DailyBriefing } from '@/components/concierge/DailyBriefing';
import { OnboardingBanner } from '@/components/guide/OnboardingBanner';
import { useConciergeCards } from '@/hooks/useConciergeCards';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSummaryMetrics, getScopeLevel } from '@/hooks/useSummaryMetrics';
import { usePastorCampoConcierge, usePastorGlobalConcierge } from '@/hooks/usePastoralConcierge';
import { useRole } from '@/contexts/RoleContext';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminPWADashboard } from '@/components/dashboard/pwa/AdminPWADashboard';
import { getRoleUXConfig } from '@/lib/roleUXConfig';

export default function HomeConcierge() {
  const { data: cards, isLoading: cardsLoading } = useConciergeCards();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: metrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { scopeType, isAdmin } = useRole();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;
  const level = getScopeLevel(scopeType);
  const { incrementVisit } = useOnboarding();
  const config = getRoleUXConfig(scopeType);

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
    <AppLayout title={config.hero.greeting}>
      <ScopeMissingGate>
        <div className="mx-auto w-full max-w-[1380px] space-y-7">
          <OnboardingBanner />

          {/* ═══ ROLE-PERSONALIZED HERO ═══ */}
          <RolePersonalizedHero />

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
              {/* ═══ AÇÕES PRIORITÁRIAS (ROLE-SPECIFIC) ═══ */}
              <section className="space-y-3">
                <SectionLabel label={config.sectionLabel} />
                <RolePriorityCards />
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
                    <RoleQuickActions />
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

function SectionLabel({ label }: { label: string }) {
  return <h2 className="section-label">{label}</h2>;
}
