import { useState } from 'react';
import { Loader2, Globe, Church, Users, Home, GitBranch, Heart } from 'lucide-react';
import { useGlobalKingdomData, CampusKPI } from '@/hooks/useGlobalKingdomData';
import { useGlobalValidation } from '@/hooks/useGlobalValidation';
import { KingdomCampusCard } from './KingdomCampusCard';
import { CampusDetailView } from './CampusDetailView';
import { GlobalValidationPanel } from '../GlobalValidationPanel';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from '../MissionVerse';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type DrillLevel = 'kingdom' | 'campus' | 'rede';

interface DrillState {
  level: DrillLevel;
  campoId?: string;
  campoNome?: string;
  redeId?: string;
  redeNome?: string;
}

export function GlobalPastorDashboard() {
  const [drill, setDrill] = useState<DrillState>({ level: 'kingdom' });
  const [tab, setTab] = useState<string>('visao');
  const { data: campusData, isLoading } = useGlobalKingdomData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allCampus = campusData || [];
  const activeCampus = allCampus.filter(c => c.celulas_ativas > 0 || c.membros_total > 0);
  const inactiveCampus = allCampus.filter(c => c.celulas_ativas === 0 && c.membros_total === 0);

  // Totals
  const totalCelulas = allCampus.reduce((s, c) => s + c.celulas_ativas, 0);
  const totalMembros = allCampus.reduce((s, c) => s + c.membros_total, 0);
  const totalNV = allCampus.reduce((s, c) => s + c.novas_vidas_total, 0);
  const totalMultiplicacoes = allCampus.reduce((s, c) => s + 0, 0); // We'd need separate query for this
  const avgEngajamento = activeCampus.length > 0
    ? Math.round(activeCampus.reduce((s, c) => s + c.engajamento_pct, 0) / activeCampus.length)
    : 0;

  const handleSelectCampus = (campoId: string, campoNome: string) => {
    setDrill({ level: 'campus', campoId, campoNome });
  };

  const handleSelectRede = (redeId: string, redeNome: string) => {
    setDrill({ ...drill, level: 'rede', redeId, redeNome });
  };

  const handleBackToKingdom = () => {
    setDrill({ level: 'kingdom' });
  };

  const handleBackToCampus = () => {
    setDrill({ level: 'campus', campoId: drill.campoId, campoNome: drill.campoNome });
  };

  // Level 2: Campus detail
  if (drill.level === 'campus' && drill.campoId) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Visão Global"
          subtitle={`Detalhes do campus: ${drill.campoNome}`}
          icon={Globe}
        />
        <CampusDetailView
          campoId={drill.campoId}
          campoNome={drill.campoNome!}
          onBack={handleBackToKingdom}
          onSelectRede={handleSelectRede}
        />
      </div>
    );
  }

  // Level 3: Rede drill-down — placeholder (uses existing dashboard filters)
  if (drill.level === 'rede' && drill.redeId) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Visão Global"
          subtitle={`${drill.campoNome} › ${drill.redeNome}`}
          icon={Globe}
        />
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToCampus}>
            ← Voltar para {drill.campoNome}
          </Button>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Para detalhes da rede <strong>{drill.redeNome}</strong>, selecione o campus no seletor global e acesse a visão de pastor de campo.
          </p>
        </div>
      </div>
    );
  }

  // Level 1: Kingdom view
  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão do Reino"
        subtitle="Panorama executivo de todos os campos"
        icon={Globe}
      />

      <MissionVerse role="pastor" />

      {/* Global KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Consolidado Global
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Church} label="Campus Ativos" value={activeCampus.length} subtitle={`de ${allCampus.length} total`} />
          <StatCard icon={Home} label="Células" value={totalCelulas} />
          <StatCard icon={Users} label="Membros" value={totalMembros} />
          <StatCard icon={Heart} label="Novas Vidas" value={totalNV} />
          <StatCard
            icon={GitBranch}
            label="Engajamento Médio"
            value={`${avgEngajamento}%`}
            subtitle="relatórios na semana"
          />
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="visao">Campus</TabsTrigger>
          <TabsTrigger value="validacao">Validação</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          {/* Active campuses */}
          {activeCampus.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                📊 Campus com Dados Operacionais
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeCampus.map(campus => (
                  <KingdomCampusCard
                    key={campus.campo_id}
                    campus={campus}
                    onSelect={handleSelectCampus}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Inactive campuses */}
          {inactiveCampus.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                🏗️ Campus em Implantação ({inactiveCampus.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inactiveCampus.map(campus => (
                  <KingdomCampusCard
                    key={campus.campo_id}
                    campus={campus}
                    onSelect={handleSelectCampus}
                  />
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="validacao">
          <GlobalValidationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
