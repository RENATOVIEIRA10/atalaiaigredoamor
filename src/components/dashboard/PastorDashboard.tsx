import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2, Home, Users, Heart, Sparkles, PartyPopper,
  GitBranch, Cake, ShieldAlert, TrendingUp, RefreshCw, X,
  BookOpen, GraduationCap, Droplets, Church, Sprout, Globe,
  AlertTriangle, MessageSquare, Network
} from 'lucide-react';
import {
  usePastoralStats,
  useWeeklyBirthdays,
  usePastoralAlerts,
  usePastoralCelebrations,
  useRedeGrowthData,
  useSpiritualStagnation,
} from '@/hooks/usePastoralData';
import { usePulsoPastoral } from '@/hooks/usePulsoPastoral';
import { useConversionsMetrics } from '@/hooks/useConversionsMetrics';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useWeeklyReports } from '@/hooks/useWeeklyReports';
import { useDemoScope } from '@/hooks/useDemoScope';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { format, subDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { PastoralGrowthCharts } from './PastoralGrowthCharts';
import { MissionVerse } from './MissionVerse';
import { InitialViewGate } from './InitialViewGate';
import { RadarSaudePanel } from './RadarSaudePanel';
import { RecomecoPastorTab } from './recomeco/RecomecoPastorTab';
import { DiscipuladoPastorView } from './discipulado/DiscipuladoPastorView';
import { GlobalPastorDashboard } from './global/GlobalPastorDashboard';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { RevelaShortcut } from './RevelaShortcut';
import { DashboardScopeBanner } from './DashboardScopeBanner';
import { SectionLabel } from './SectionLabel';

export function PastorDashboard() {
  const { isPastorSeniorGlobal } = useRole();
  const { isGlobalView } = useCampo();

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

  const { data: conversions } = useConversionsMetrics();
  const { isLoading: aiLoading, insight: aiInsight, generateInsight, clearInsight } = useAIInsights();
  const { campoId } = useDemoScope();
  const dateRange = { from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') };
  const { data: allReports } = useWeeklyReports(undefined, dateRange, campoId);

  const handleGenerateMeetingAgenda = async () => {
    if (!redeGrowth || redeGrowth.length === 0) return;
    const context = {
      redes: redeGrowth.map(r => ({
        nome: r.rede_name,
        celulas: r.celulas_count,
        membros: r.members_count,
        media_presenca: r.avg_attendance,
        relatorios_6meses: r.reports_count,
      })),
      alertas: alerts?.map(a => ({ titulo: a.title, descricao: a.description, severidade: a.severity })) || [],
      marcos: {
        encontro: pulso?.marcosEncontro || 0,
        batismo: pulso?.marcosBatismo || 0,
        discipulado: pulso?.marcosDiscipulado || 0,
        multiplicacoes: stats?.multiplicacoes90dias || 0,
      },
      estagnacao: stagnation?.count || 0,
    };
    await generateInsight('meeting_agenda' as any, [context] as any, 'Reunião com Líderes de Rede');
  };

  if (statsLoading || pulsoLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <DashboardScopeBanner />
      <PageHeader title="Visão Pastoral" subtitle="Governo espiritual e cuidado do rebanho" icon={Heart} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MissionVerse role="pastor" />
        <RevelaShortcut />
      </div>

      {/* ═══ 1. PANORAMA DA IGREJA — Dados Estruturais ═══ */}
      <SectionLabel title="Panorama da Igreja" subtitle="Dados estruturais consolidados" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Network} label="Redes" value={redeGrowth?.length || 0} />
        <StatCard icon={Home} label="Células Ativas" value={pulso?.totalCelulas || 0} />
        <StatCard icon={Users} label="Membros Ativos" value={stats?.totalMembers || 0} />
        <StatCard icon={GitBranch} label="Multiplicações" value={stats?.multiplicacoes90dias || 0} subtitle="últimos 90 dias" />
      </div>

      {/* ═══ 2. MOVIMENTO DO REINO ═══ */}
      <SectionLabel title="Movimento do Reino" subtitle="Crescimento espiritual do rebanho" />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MarcoCard label="Conversões" value={conversions?.conversoes90dias || 0} icon="🔥" subtitle="Recomeço · 90 dias" />
            <MarcoCard label="Novos Membros" value={conversions?.novosMembros90dias || 0} icon="🌱" subtitle="integrados · 90 dias" />
            <MarcoCard label="Batismos" value={pulso?.marcosBatismo || 0} icon="💧" subtitle="acumulado" />
            <MarcoCard label="Multiplicações" value={stats?.multiplicacoes90dias || 0} icon="🌿" subtitle="últimos 90 dias" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <MarcoCard label="Encontro c/ Deus" value={pulso?.marcosEncontro || 0} icon="⛰️" />
            <MarcoCard label="Discipulado" value={pulso?.marcosDiscipulado || 0} icon="📖" />
            <MarcoCard label="Curso Lidere" value={pulso?.marcosCursoLidere || 0} icon="🎓" />
            <MarcoCard label="Conversões (total)" value={conversions?.conversoes || 0} icon="✝️" subtitle="acumulado geral" />
          </div>
        </CardContent>
      </Card>

      {celebrations && celebrations.length > 0 && (
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
      )}

      {/* ═══ 3. SAÚDE DAS REDES ═══ */}
      <SectionLabel title="Saúde das Redes" subtitle="Visão consolidada por rede" />
      {redeGrowth && redeGrowth.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Rede</TableHead>
                    <TableHead className="text-center">Células</TableHead>
                    <TableHead className="text-center">Membros</TableHead>
                    <TableHead className="text-center">Média Presença</TableHead>
                    <TableHead className="text-center">Relatórios (6m)</TableHead>
                    <TableHead className="text-center">Indicador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redeGrowth.map((rede) => {
                    const healthScore = rede.celulas_count > 0 ? Math.min(100, Math.round((rede.reports_count / (rede.celulas_count * 4)) * 100)) : 0;
                    const healthColor = healthScore >= 70 ? 'bg-green-500/10 text-green-600' : healthScore >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive';
                    const healthLabel = healthScore >= 70 ? 'Saudável' : healthScore >= 40 ? 'Atenção' : 'Crítica';
                    return (
                      <TableRow key={rede.rede_name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2"><Network className="h-3.5 w-3.5 text-primary" />{rede.rede_name}</div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{rede.celulas_count}</TableCell>
                        <TableCell className="text-center tabular-nums">{rede.members_count}</TableCell>
                        <TableCell className="text-center tabular-nums">{rede.avg_attendance}</TableCell>
                        <TableCell className="text-center tabular-nums">{rede.reports_count}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`text-xs ${healthColor}`}>{healthLabel}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Network className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma rede cadastrada</p>
          </CardContent>
        </Card>
      )}

      {/* ═══ 4. PONTOS DE ATENÇÃO ═══ */}
      <SectionLabel title="Pontos de Atenção" subtitle="Alertas estratégicos gerados automaticamente" />
      <PastorStrategicAlerts
        alerts={alerts || []}
        redeGrowth={redeGrowth || []}
        stagnation={stagnation}
        stats={stats}
      />

      {/* ═══ 5. ABA: REUNIÃO COM LÍDERES DE REDE ═══ */}
      <Tabs defaultValue="reuniao" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="reuniao" className="gap-1.5"><MessageSquare className="h-4 w-4" />Reunião com Líderes de Rede</TabsTrigger>
          <TabsTrigger value="detalhes" className="gap-1.5"><BookOpen className="h-4 w-4" />Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="reuniao">
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><MessageSquare className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle className="text-lg">Pauta de Reunião</CardTitle>
                    <CardDescription>Sugestões geradas com base nos dados atuais das redes</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" />Lovable AI</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!aiInsight ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Gere automaticamente sugestões de pauta para sua reunião com os líderes de rede,
                    com base nos dados de saúde, crescimento e pontos de atenção.
                  </p>
                  <Button onClick={handleGenerateMeetingAgenda} disabled={aiLoading || !redeGrowth || redeGrowth.length === 0} className="gap-2">
                    {aiLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Gerando pauta...</>) : (<><Sparkles className="h-4 w-4" />Gerar Pauta de Reunião</>)}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Gerado em: {new Date(aiInsight.generatedAt).toLocaleString('pt-BR')}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleGenerateMeetingAgenda} disabled={aiLoading} className="gap-1"><RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Regenerar</span></Button>
                      <Button variant="ghost" size="sm" onClick={clearInsight} className="gap-1"><X className="h-3 w-3" /><span className="hidden sm:inline">Limpar</span></Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[400px] rounded-lg border bg-card p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{aiInsight.insight}</ReactMarkdown></div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhes">
          <div className="space-y-6">
            {/* Aniversários */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Cake className="h-4 w-4 text-primary" />Aniversários da Semana</CardTitle></CardHeader>
              <CardContent>
                {birthdays && birthdays.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {birthdays.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
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

            <PastoralGrowthCharts campoId={campoId} />
            <DiscipuladoPastorView />
            <RadarSaudePanel scopeType="all" campoId={campoId} title="Saúde da Rede" />
            <RecomecoPastorTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Strategic alerts for pastor ──

interface PastorStrategicAlertsProps {
  alerts: any[];
  redeGrowth: any[];
  stagnation: any;
  stats: any;
}

function PastorStrategicAlerts({ alerts, redeGrowth, stagnation, stats }: PastorStrategicAlertsProps) {
  const strategicAlerts: { title: string; description: string; severity: 'warning' | 'critical' }[] = [];

  // Redes sem multiplicação
  const redesSemMultiplicacao = redeGrowth.filter(r => r.reports_count > 0 && r.celulas_count <= 1);
  if (redesSemMultiplicacao.length > 0) {
    strategicAlerts.push({
      title: `${redesSemMultiplicacao.length} rede(s) sem crescimento em células`,
      description: `As redes ${redesSemMultiplicacao.map(r => r.rede_name).join(', ')} possuem apenas 1 célula ou menos. Avaliar estratégia de multiplicação.`,
      severity: redesSemMultiplicacao.length > 2 ? 'critical' : 'warning',
    });
  }

  // Redes com baixa presença
  const redesBaixaPresenca = redeGrowth.filter(r => r.avg_attendance > 0 && r.avg_attendance < 5 && r.members_count > 5);
  if (redesBaixaPresenca.length > 0) {
    strategicAlerts.push({
      title: 'Queda de membros em redes',
      description: `${redesBaixaPresenca.map(r => `${r.rede_name} (média ${r.avg_attendance})`).join(', ')} apresentam média de presença abaixo do esperado.`,
      severity: 'warning',
    });
  }

  // Estagnação espiritual
  if (stagnation && stagnation.count > 5) {
    strategicAlerts.push({
      title: `${stagnation.count} membros sem avanço espiritual`,
      description: `Membros com mais de ${stagnation.yearsThreshold} anos de igreja sem marcos espirituais básicos. Necessário plano de cuidado pastoral.`,
      severity: stagnation.count > 15 ? 'critical' : 'warning',
    });
  }

  // Include existing alerts from pastoral alerts hook
  for (const a of alerts) {
    strategicAlerts.push({ title: a.title, description: a.description, severity: a.severity });
  }

  if (strategicAlerts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum ponto de atenção no momento ✨</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {strategicAlerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1)).map((alert, i) => (
        <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/20 bg-amber-500/5'}>
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className={`h-5 w-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-600'}`} />
            <div className="flex-1 min-w-0">
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
  );
}

function MarcoCard({ label, value, icon, subtitle }: { label: string; value: number; icon: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {subtitle && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</div>}
    </div>
  );
}
