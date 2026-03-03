import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2, Home, Users, AlertTriangle, Heart, Sparkles, PartyPopper,
  GitBranch, Eye, Cake, ShieldAlert, TrendingUp, RefreshCw, X,
  Activity, BookOpen, GraduationCap, ChevronDown, ChevronUp, Droplets, Church, UserCheck
} from 'lucide-react';
import {
  usePastoralStats,
  useWeeklyBirthdays,
  usePastoralAlerts,
  usePastoralCelebrations,
  useRedeGrowthData,
  useSpiritualStagnation,
} from '@/hooks/usePastoralData';
import { usePulsoPastoral, CelulaReportStatus } from '@/hooks/usePulsoPastoral';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useWeeklyReports } from '@/hooks/useWeeklyReports';
import { useDemoScope } from '@/hooks/useDemoScope';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { format, subDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { PastoralGrowthCharts } from './PastoralGrowthCharts';
import { MissionVerse } from './MissionVerse';
import { RadarSaudePanel } from './RadarSaudePanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RecomecoPastorTab } from './recomeco/RecomecoPastorTab';
import { DiscipuladoPastorView } from './discipulado/DiscipuladoPastorView';
import { GlobalValidationPanel } from './GlobalValidationPanel';
import { GlobalPastorDashboard } from './global/GlobalPastorDashboard';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { RevelaShortcut } from './RevelaShortcut';
import { DashboardScopeBanner } from './DashboardScopeBanner';

export function PastorDashboard() {
  const { isPastorSeniorGlobal } = useRole();
  const { isGlobalView } = useCampo();

  // When pastor_senior_global is in global view, show the executive 3-level dashboard
  if (isPastorSeniorGlobal && isGlobalView) {
    return <GlobalPastorDashboard />;
  }

  return <CampoPastorDashboard />;
}

function CampoPastorDashboard() {
  const { data: stats, isLoading: statsLoading } = usePastoralStats();
  const { data: pulso, isLoading: pulsoLoading } = usePulsoPastoral();
  const { data: stagnation } = useSpiritualStagnation();
  const { data: birthdays } = useWeeklyBirthdays();
  const { data: alerts } = usePastoralAlerts();
  const { data: celebrations } = usePastoralCelebrations();
  const { data: redeGrowth } = useRedeGrowthData();

  const [showAlertCells, setShowAlertCells] = useState(false);
  const [showStagnantMembers, setShowStagnantMembers] = useState(false);

  // AI
  const { isLoading: aiLoading, insight: aiInsight, generateInsight, clearInsight } = useAIInsights();
  const { campoId } = useDemoScope();
  const dateRange = { from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') };
  const { data: allReports } = useWeeklyReports(undefined, dateRange, campoId);

  const handleGeneratePastoralSummary = async () => {
    if (!allReports || allReports.length === 0) return;
    const grouped = allReports.reduce((acc, r) => {
      const cid = r.celula_id;
      if (!acc[cid]) {
        acc[cid] = {
          celula_name: r.celula?.name || 'Célula',
          coordenacao_name: r.celula?.coordenacao?.name || 'Coordenação',
          reports: [],
        };
      }
      acc[cid].reports.push({
        meeting_date: r.meeting_date || r.week_start,
        members_present: r.members_present,
        leaders_in_training: r.leaders_in_training,
        discipleships: r.discipleships,
        visitors: r.visitors,
        children: r.children,
      });
      return acc;
    }, {} as Record<string, any>);
    await generateInsight('executive_summary', Object.values(grouped), 'Últimos 30 dias');
  };

  if (statsLoading || pulsoLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const engajamentoDiff = (pulso?.percentualEngajamento || 0) - (pulso?.percentualSemanaAnterior || 0);
  const totalAlertas = (pulso?.celulasAlerta1Semana.length || 0) + (pulso?.celulasAlerta2Semanas.length || 0) + (pulso?.celulasAlerta3Semanas.length || 0);

  return (
    <div className="space-y-8">
      <DashboardScopeBanner />
      <PageHeader
        title="Visão Pastoral"
        subtitle="Saúde espiritual e cuidado do rebanho"
        icon={Heart}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MissionVerse role="pastor" />
        <RevelaShortcut />
      </div>

      {/* 1. Visão Geral */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Visão Geral</h2>
        {(() => {
          const pendentesNaSemana = (pulso?.totalCelulas || 0) - (pulso?.celulasComRelatorio || 0);
          const pendenciaRecorrente = (pulso?.celulasAlerta2Semanas.length || 0) + (pulso?.celulasAlerta3Semanas.length || 0);
          // Sanity check
          if (pulso && pendentesNaSemana !== (pulso.celulasAlerta1Semana.length + pulso.celulasAlerta2Semanas.length + pulso.celulasAlerta3Semanas.length)) {
            console.warn('[Pulso Sanity] pendentesNaSemana !== soma dos alertas', {
              pendentesNaSemana,
              alerta1: pulso.celulasAlerta1Semana.length,
              alerta2: pulso.celulasAlerta2Semanas.length,
              alerta3: pulso.celulasAlerta3Semanas.length,
            });
          }
          return (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <StatCard icon={Home} label="Células Ativas" value={pulso?.totalCelulas || 0} />
              <StatCard icon={Users} label="Membros" value={stats?.totalMembers || 0} />
              <StatCard icon={Eye} label="Pendência recorrente" value={pendenciaRecorrente} subtitle="sem relatório há 2+ sem." />
              <StatCard icon={AlertTriangle} label="Relatórios pendentes" value={pendentesNaSemana} subtitle="sem relatório esta semana" className={pendentesNaSemana > 0 ? 'border-amber-500/30' : ''} />
              <StatCard icon={GitBranch} label="Multiplicações" value={stats?.multiplicacoes90dias || 0} subtitle="últimos 90 dias" />
            </div>
          );
        })()}
      </section>

      {/* 2. Pulso Pastoral da Rede */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🫀 Pulso Pastoral da Rede</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Engajamento das Células */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Engajamento das Células
              </CardTitle>
              <CardDescription>Relatórios enviados esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-bold text-primary">{pulso?.percentualEngajamento || 0}%</span>
                <span className="text-sm text-muted-foreground mb-1">
                  ({pulso?.celulasComRelatorio || 0} de {pulso?.totalCelulas || 0})
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all"
                  style={{ width: `${pulso?.percentualEngajamento || 0}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                {engajamentoDiff >= 0 ? (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    ↑ +{engajamentoDiff}pp vs semana anterior
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                    ↓ {engajamentoDiff}pp vs semana anterior
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

           {/* Relatórios Pendentes */}
          <Card className={totalAlertas > 0 ? 'border-amber-500/30' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Relatórios Pendentes
              </CardTitle>
              <CardDescription>Células sem envio de relatório</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-sm">🟢 1 semana</span>
                <Badge variant="secondary">{pulso?.celulasAlerta1Semana.length || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5">
                <span className="text-sm">🟡 2 semanas</span>
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">{pulso?.celulasAlerta2Semanas.length || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                <span className="text-sm">🔴 3+ semanas</span>
                <Badge variant="outline" className="border-destructive/50 text-destructive">{pulso?.celulasAlerta3Semanas.length || 0}</Badge>
              </div>
              {totalAlertas > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 text-xs"
                  onClick={() => setShowAlertCells(!showAlertCells)}
                >
                  {showAlertCells ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {showAlertCells ? 'Ocultar detalhes' : 'Ver células pendentes'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Movimento de Discipulado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Movimento de Discipulado
              </CardTitle>
              <CardDescription>Discipulados ativos na rede</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary">{pulso?.totalDiscipulados || 0}</span>
                <span className="text-sm text-muted-foreground mb-1">discipulados ativos</span>
              </div>
            </CardContent>
          </Card>

          {/* Movimento de Liderança */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Movimento de Liderança
              </CardTitle>
              <CardDescription>Futuros líderes em formação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary">{pulso?.lideresEmTreinamento || 0}</span>
                <span className="text-sm text-muted-foreground mb-1">líderes em treinamento</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes das células em alerta */}
        {showAlertCells && totalAlertas > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhes – Células sem Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-4">
                  {(pulso?.celulasAlerta3Semanas.length || 0) > 0 && (
                    <AlertCellGroup label="🔴 3+ semanas sem relatório" cells={pulso!.celulasAlerta3Semanas} severity="critical" />
                  )}
                  {(pulso?.celulasAlerta2Semanas.length || 0) > 0 && (
                    <AlertCellGroup label="🟡 2 semanas sem relatório" cells={pulso!.celulasAlerta2Semanas} severity="warning" />
                  )}
                  {(pulso?.celulasAlerta1Semana.length || 0) > 0 && (
                    <AlertCellGroup label="🟢 1 semana sem relatório" cells={pulso!.celulasAlerta1Semana} severity="info" />
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Marcos Espirituais */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Church className="h-4 w-4 text-primary" />
              Marcos Espirituais (Visão Pastoral)
            </CardTitle>
            <CardDescription>Crescimento espiritual real do rebanho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MarcoCard label="Encontro c/ Deus" value={pulso?.marcosEncontro || 0} icon="🔥" />
              <MarcoCard label="Batismo" value={pulso?.marcosBatismo || 0} icon="💧" />
              <MarcoCard label="Discipulado" value={pulso?.marcosDiscipulado || 0} icon="📖" />
              <MarcoCard label="Curso Lidere" value={pulso?.marcosCursoLidere || 0} icon="🎓" />
              <MarcoCard label="Renovo" value={pulso?.marcosRenovo || 0} icon="🌿" />
              <MarcoCard label="Líder em Treinamento" value={pulso?.marcosLiderEmTreinamento || 0} icon="⭐" />
            </div>
          </CardContent>
        </Card>

        {/* Estagnação espiritual */}
        {stagnation && stagnation.count > 0 && (
          <Card className="mt-4 border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Atenção Pastoral</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Há <strong>{stagnation.count} pessoa(s)</strong> com mais de {stagnation.yearsThreshold} anos de igreja
                    que ainda não avançaram em marcos espirituais básicos (Encontro com Deus, Batismo ou Curso Lidere).
                  </p>
                  {stagnation.members && stagnation.members.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs text-amber-700 hover:bg-amber-500/10"
                      onClick={() => setShowStagnantMembers(!showStagnantMembers)}
                    >
                      {showStagnantMembers ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {showStagnantMembers ? 'Ocultar membros' : `Ver ${stagnation.members.length} membro(s)`}
                    </Button>
                  )}
                </div>
              </div>
              {showStagnantMembers && stagnation.members && stagnation.members.length > 0 && (
                <ScrollArea className="mt-3 max-h-56">
                  <div className="space-y-2 pr-2">
                    {stagnation.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-background/60 border border-amber-500/10">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={m.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-amber-500/10 text-amber-700">{m.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.celula_name}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs border-amber-500/30 text-amber-700">
                          Sem marcos básicos
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Aniversários */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🎂 Aniversários da Semana</h2>
        <Card>
          <CardContent className="p-4">
            {birthdays && birthdays.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {birthdays.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={b.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{b.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.role} · {b.celula_name}</p>
                    </div>
                    {b.is_today && <Badge className="bg-primary/10 text-primary text-xs">Hoje! 🎂</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversário nesta semana</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Discipulado Anual */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">📖 Discipulado Anual</h2>
        <DiscipuladoPastorView />
      </section>

      {/* Radar Pastoral */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">⚠️ Radar Pastoral</h2>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/20 bg-amber-500/5'}>
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldAlert className={`h-5 w-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-600'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0 ml-auto">
                    {alert.severity === 'critical' ? 'Crítico' : 'Atenção'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum alerta no momento. O rebanho está saudável! ✨</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Radar de Saúde (baseado em supervisões) */}
      <section>
        <RadarSaudePanel scopeType="all" campoId={campoId} title="Radar de Saúde da Rede" />
      </section>

      {/* Frutos e Celebrações */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🎉 Frutos e Celebrações</h2>
        {celebrations && celebrations.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {celebrations.map((c, i) => (
              <Card key={i} className="border-primary/10 bg-primary/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <PartyPopper className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <PartyPopper className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">As celebrações aparecerão aqui à medida que o rebanho crescer</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recomeço — Caminho das Novas Vidas */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🕊️ Recomeço — Caminho das Novas Vidas</h2>
        <RecomecoPastorTab />
      </section>

      {/* Evolução Temporal */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">📈 Evolução dos Últimos 6 Meses</h2>
        <PastoralGrowthCharts campoId={campoId} />
      </section>

      {/* Visão de Governo */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">📊 Visão de Governo</h2>
        {redeGrowth && redeGrowth.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {redeGrowth.map((rede) => (
              <Card key={rede.rede_name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{rede.rede_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Células</span>
                    <span className="font-medium">{rede.celulas_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Membros ativos</span>
                    <span className="font-medium">{rede.members_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Média de presença</span>
                    <span className="font-medium">{rede.avg_attendance}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Relatórios (6 meses)</span>
                    <span className="font-medium">{rede.reports_count}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Dados de crescimento por rede aparecerão aqui</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Resumo Pastoral com IA */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🤖 Resumo Pastoral com IA</h2>
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Análise Pastoral</CardTitle>
                  <CardDescription>Resumo inteligente dos últimos 30 dias</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Lovable AI
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!aiInsight ? (
              <div className="text-center py-6">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Gere um resumo pastoral inteligente com base nos dados das últimas semanas
                </p>
                <Button
                  onClick={handleGeneratePastoralSummary}
                  disabled={aiLoading || !allReports || allReports.length === 0}
                  className="gap-2"
                >
                  {aiLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Analisando...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Gerar Resumo Pastoral</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Gerado em: {new Date(aiInsight.generatedAt).toLocaleString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleGeneratePastoralSummary} disabled={aiLoading} className="gap-1">
                      <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Regenerar</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearInsight} className="gap-1">
                      <X className="h-3 w-3" />
                      <span className="hidden sm:inline">Limpar</span>
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[400px] rounded-lg border bg-card p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{aiInsight.insight}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Validação de Consistência removed — now in GlobalPastorDashboard */}
    </div>
  );
}

function MarcoCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function AlertCellGroup({ label, cells, severity }: { label: string; cells: CelulaReportStatus[]; severity: 'critical' | 'warning' | 'info' }) {
  // Group by coordenação
  const grouped = cells.reduce((acc, c) => {
    const key = c.coordenacao_name || 'Sem Coordenação';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, CelulaReportStatus[]>);

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      {Object.entries(grouped).map(([coord, cels]) => (
        <div key={coord} className="ml-2 mb-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">{coord}</p>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {cels.map(c => (
              <Badge
                key={c.celula_id}
                variant="outline"
                className={`text-xs ${
                  severity === 'critical' ? 'border-destructive/50 text-destructive' :
                  severity === 'warning' ? 'border-amber-500/50 text-amber-600' :
                  ''
                }`}
              >
                {c.celula_name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
