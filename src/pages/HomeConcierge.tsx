import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { ConciergeCards } from '@/components/concierge/ConciergeCards';
import { QuickActions } from '@/components/concierge/QuickActions';
import { SummaryMetricsPanel, getSectionLabel } from '@/components/concierge/SummaryMetrics';
import { RecentActivity } from '@/components/concierge/RecentActivity';
import { FAB } from '@/components/concierge/FAB';
import { OnboardingBanner } from '@/components/guide/OnboardingBanner';
import { AskGuideDialog } from '@/components/guide/AskGuideDialog';
import { useConciergeCards } from '@/hooks/useConciergeCards';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSummaryMetrics, getScopeLevel } from '@/hooks/useSummaryMetrics';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { roleLabels } from '@/lib/icons';

export default function HomeConcierge() {
  const { data: cards, isLoading: cardsLoading } = useConciergeCards();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: metrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { selectedRole, scopeType } = useRole();
  const { activeCampo } = useCampo();
  const level = getScopeLevel(scopeType);
  const { incrementVisit } = useOnboarding();

  useEffect(() => { incrementVisit(); }, []);

  return (
    <AppLayout title="Início">
      <ScopeMissingGate>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Onboarding Banner */}
          <OnboardingBanner />

          {/* Header */}
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 80C30 80 35 45 50 20C65 45 70 80 70 80" stroke="hsl(239 84% 67%)" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M40 65C45 62 55 62 60 65" stroke="hsl(239 84% 67%)" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="50" cy="15" r="5" fill="hsl(239 84% 67%)" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  O que precisa da sua atenção
                </h1>
                <p className="text-xs text-muted-foreground">
                  {selectedRole ? roleLabels[selectedRole] : ''} 
                  {activeCampo ? ` · ${activeCampo.nome}` : ''}
                </p>
              </div>
              <AskGuideDialog />
            </div>
          </div>

          {/* 1. Concierge cards */}
          <section>
            <SectionLabel label="Ações prioritárias" />
            <ConciergeCards cards={cards} isLoading={cardsLoading} />
          </section>

          {/* 2. Quick actions */}
          <section>
            <SectionLabel label="Ações rápidas" />
            <QuickActions />
          </section>

          {/* 3. Summary metrics (label adapts to scope) */}
          <section>
            <SectionLabel label={getSectionLabel(level)} />
            <SummaryMetricsPanel metrics={metrics} isLoading={metricsLoading} />
          </section>

          {/* 4. Recent activity */}
          <section>
            <SectionLabel label="Atividade recente" />
            <RecentActivity items={activity} isLoading={activityLoading} />
          </section>
        </div>

        <FAB />
      </ScopeMissingGate>
    </AppLayout>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h2 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-semibold mb-3 flex items-center gap-2">
      <span className="h-px w-3 bg-primary/30" />
      {label}
    </h2>
  );
}
