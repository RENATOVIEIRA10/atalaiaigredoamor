import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { ConciergeCards } from '@/components/concierge/ConciergeCards';
import { QuickActionsBar } from '@/components/home/QuickActionsBar';
import { SummaryMetricsPanel, getSectionLabel } from '@/components/concierge/SummaryMetrics';
import { RecentActivity } from '@/components/concierge/RecentActivity';
import { OnboardingBanner } from '@/components/guide/OnboardingBanner';
import { AskGuideDialog } from '@/components/guide/AskGuideDialog';
import { useConciergeCards } from '@/hooks/useConciergeCards';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSummaryMetrics, getScopeLevel } from '@/hooks/useSummaryMetrics';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { roleLabels } from '@/lib/icons';
import { Sparkles } from 'lucide-react';

export default function HomeConcierge() {
  const { data: cards, isLoading: cardsLoading } = useConciergeCards();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: metrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { selectedRole, scopeType } = useRole();
  const { activeCampo } = useCampo();
  const level = getScopeLevel(scopeType);
  const { incrementVisit } = useOnboarding();

  useEffect(() => {
    incrementVisit();
  }, []);

  return (
    <AppLayout title="Início">
      <ScopeMissingGate>
        <div className="mx-auto w-full max-w-[1360px] space-y-8">
          <OnboardingBanner />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <section className="premium-surface relative overflow-hidden rounded-[2rem] px-6 py-7 md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_52%)]" />
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/65 bg-background/65 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Painel Concierge
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[2rem]">
                      O que precisa da sua atenção hoje
                    </h1>
                    <p className="text-sm text-muted-foreground md:text-base">
                      {selectedRole ? roleLabels[selectedRole] : ''}
                      {activeCampo ? ` · ${activeCampo.nome}` : ''}
                    </p>
                  </div>
                  <AskGuideDialog />
                </div>

                <SectionLabel label="Prioridades" />
                <ConciergeCards cards={cards} isLoading={cardsLoading} />
              </div>
            </section>

            <aside className="space-y-5">
              <SectionLabel label={getSectionLabel(level)} />
              <SummaryMetricsPanel metrics={metrics} isLoading={metricsLoading} />
              <div className="premium-surface rounded-3xl p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">Ações essenciais</p>
                <QuickActionsBar />
              </div>
            </aside>
          </div>

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
    <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium flex items-center gap-2.5">
      <span className="h-px w-6 bg-primary/40" />
      {label}
    </h2>
  );
}
