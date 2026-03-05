import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { ConciergeCards } from '@/components/concierge/ConciergeCards';
import { QuickActions } from '@/components/concierge/QuickActions';
import { SummaryMetricsPanel } from '@/components/concierge/SummaryMetrics';
import { RecentActivity } from '@/components/concierge/RecentActivity';
import { FAB } from '@/components/concierge/FAB';
import { useConciergeCards } from '@/hooks/useConciergeCards';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useSummaryMetrics } from '@/hooks/useSummaryMetrics';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { roleLabels } from '@/lib/icons';
import { AtalaiaIcon } from '@/components/institutional/AtalaiaLogoHeader';

export default function HomeConcierge() {
  const { data: cards, isLoading: cardsLoading } = useConciergeCards();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: metrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { selectedRole } = useRole();
  const { activeCampo } = useCampo();

  return (
    <AppLayout title="Início">
      <ScopeMissingGate>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <AtalaiaIcon className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                O que precisa da sua atenção
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedRole ? roleLabels[selectedRole] : ''} 
                {activeCampo ? ` · ${activeCampo.nome}` : ''}
              </p>
            </div>
          </div>

          {/* 1. Concierge — Ações prioritárias */}
          <section>
            <SectionLabel label="Ações prioritárias" />
            <ConciergeCards cards={cards} isLoading={cardsLoading} />
          </section>

          {/* 2. Ações rápidas */}
          <section>
            <SectionLabel label="Ações rápidas" />
            <QuickActions />
          </section>

          {/* 3. Visão resumida */}
          <section>
            <SectionLabel label="Saúde da rede" />
            <SummaryMetricsPanel metrics={metrics} isLoading={metricsLoading} />
          </section>

          {/* 4. Atividade recente */}
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
    <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
      {label}
    </h2>
  );
}
