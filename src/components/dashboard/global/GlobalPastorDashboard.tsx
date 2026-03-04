import { useState } from 'react';
import { GlobalValidationPanel } from '../GlobalValidationPanel';
import { IntegrityAuditPanel } from '../IntegrityAuditPanel';
import { Loader2, Globe, Church, Users, Home, GitBranch, Heart, Network, Sparkles, ShieldAlert, TrendingUp, ArrowRight, MessageSquare, RefreshCw, X, Calendar, BookOpen } from 'lucide-react';
import { useGlobalKingdomData, CampusKPI } from '@/hooks/useGlobalKingdomData';
import { useGlobalKingdomFunnel } from '@/hooks/useGlobalKingdomFunnel';
import { useGlobalKingdomAgenda } from '@/hooks/useGlobalKingdomAgenda';
import { useGlobalPastoralRanking } from '@/hooks/useGlobalPastoralRanking';
import { useGlobalKingdomTrends } from '@/hooks/useGlobalKingdomTrends';
import { CampusDetailView } from './CampusDetailView';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from '../MissionVerse';
import { InitialViewGate } from '../InitialViewGate';
import { SectionLabel } from '../SectionLabel';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAIInsights } from '@/hooks/useAIInsights';
import ReactMarkdown from 'react-markdown';
import { NetworkLeaderDashboard } from '../NetworkLeaderDashboard';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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
  const { data: campusData, isLoading } = useGlobalKingdomData(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (drill.level === 'rede' && drill.campoId && drill.redeId) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink className="cursor-pointer" onClick={() => setDrill({ level: 'kingdom' })}>Global</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink className="cursor-pointer" onClick={() => setDrill({ level: 'campus', campoId: drill.campoId, campoNome: drill.campoNome })}>{drill.campoNome}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{drill.redeNome}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <NetworkLeaderDashboard
          initialRedeId={drill.redeId}
          overrideCampoId={drill.campoId}
          onBack={() => setDrill({ level: 'campus', campoId: drill.campoId, campoNome: drill.campoNome })}
          breadcrumbLabel={`${drill.campoNome} > ${drill.redeNome}`}
        />
      </div>
    );
  }

  if (drill.level === 'campus' && drill.campoId) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink className="cursor-pointer" onClick={() => setDrill({ level: 'kingdom' })}>Global</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{drill.campoNome}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <CampusDetailView
          campoId={drill.campoId}
          campoNome={drill.campoNome!}
          onBack={() => setDrill({ level: 'kingdom' })}
          onSelectRede={(redeId, redeNome) => setDrill({ level: 'rede', campoId: drill.campoId, campoNome: drill.campoNome, redeId, redeNome })}
        />
      </div>
    );
  }

  return <KingdomView campusData={campusData || []} onSelectCampus={(id, nome) => setDrill({ level: 'campus', campoId: id, campoNome: nome })} />;
}

// ============================================================
// KINGDOM VIEW — Strategic pastoral governance
// ============================================================

function KingdomView({ campusData, onSelectCampus }: { campusData: CampusKPI[]; onSelectCampus: (id: string, nome: string) => void }) {
  const activeCampus = campusData.filter(c => c.celulas_ativas > 0 || c.membros_total > 0);
  const totalCelulas = campusData.reduce((s, c) => s + c.celulas_ativas, 0);
  const totalMembros = campusData.reduce((s, c) => s + c.membros_total, 0);
  const totalNV = campusData.reduce((s, c) => s + c.novas_vidas_total, 0);
  const totalConversoes = campusData.reduce((s, c) => s + c.novas_vidas_convertidas, 0);
  const totalBatismo = campusData.reduce((s, c) => s + c.marcos_batismo, 0);
  // Count total redes across all campuses (use engajamento as proxy if no direct count)
  // We can approximate total redes from the campus data

  return (
    <div className="space-y-8">
      <PageHeader title="Visão do Reino" subtitle="Governo espiritual de todos os campos" icon={Globe} />
      <MissionVerse role="pastor" />

      {/* ═══ 1. PANORAMA GLOBAL ═══ */}
      <SectionLabel title="Panorama Global" subtitle="Dados estruturais consolidados de todos os campos" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Church} label="Campos Ativos" value={activeCampus.length} subtitle={`de ${campusData.length} total`} />
        <StatCard icon={Home} label="Células" value={totalCelulas} />
        <StatCard icon={Users} label="Membros" value={totalMembros} />
        <StatCard icon={GitBranch} label="Batismos" value={totalBatismo} subtitle="acumulado" />
      </div>

      {/* ═══ 2. MOVIMENTO GLOBAL ═══ */}
      <SectionLabel title="Movimento Global" subtitle="Crescimento espiritual do Reino" />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MarcoCard label="Novas Vidas" value={totalNV} icon="🌱" />
            <MarcoCard label="Conversões" value={totalConversoes} icon="🔥" />
            <MarcoCard label="Batismos" value={totalBatismo} icon="💧" />
            <MarcoCard label="Multiplicações" value={campusData.reduce((s, c) => s + (c.marcos_curso_lidere || 0), 0)} icon="🌿" />
          </div>
        </CardContent>
      </Card>

      <FunnelSection />

      {/* ═══ 3. SAÚDE DOS CAMPOS ═══ */}
      <SectionLabel title="Saúde dos Campos" subtitle="Visão consolidada por campo" />
      <CampusHealthTable campusData={campusData} onSelect={onSelectCampus} />

      {/* ═══ 4. PONTOS DE ATENÇÃO ═══ */}
      <SectionLabel title="Pontos de Atenção" subtitle="Alertas estratégicos gerados automaticamente" />
      <GlobalStrategicAlerts campusData={campusData} />

      {/* ═══ 5. ABA: REUNIÃO COM PASTORES DE CAMPO ═══ */}
      <Tabs defaultValue="reuniao" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="reuniao" className="gap-1.5"><MessageSquare className="h-4 w-4" />Reunião com Pastores de Campo</TabsTrigger>
          <TabsTrigger value="detalhes" className="gap-1.5"><BookOpen className="h-4 w-4" />Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="reuniao">
          <MeetingAgendaSection campusData={campusData} />
        </TabsContent>

        <TabsContent value="detalhes">
          <div className="space-y-6">
            <TrendsSection />
            <AgendaSection />
            <PastoralRankingSection />

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>🛡️</span> Validação & Auditoria
              </h2>
              <p className="text-xs text-muted-foreground mb-4">Consistência de dados entre campus</p>
              <div className="space-y-6">
                <GlobalValidationPanel />
                <IntegrityAuditPanel />
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Campus Health Table ──

function CampusHealthTable({ campusData, onSelect }: { campusData: CampusKPI[]; onSelect: (id: string, nome: string) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Campo</TableHead>
                <TableHead className="text-center">Células</TableHead>
                <TableHead className="text-center">Membros</TableHead>
                <TableHead className="text-center">Novas Vidas</TableHead>
                <TableHead className="text-center">Conversões</TableHead>
                <TableHead className="text-center">Batismos</TableHead>
                <TableHead className="text-center">Engajamento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campusData.map(c => (
                <TableRow key={c.campo_id} className="cursor-pointer hover:bg-muted/30" onClick={() => onSelect(c.campo_id, c.campo_nome)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2"><Church className="h-3.5 w-3.5 text-primary" />{c.campo_nome}</div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{c.celulas_ativas}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.membros_total}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.novas_vidas_total}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.novas_vidas_convertidas}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.marcos_batismo}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`text-xs ${c.engajamento_pct >= 80 ? 'bg-green-500/10 text-green-600' : c.engajamento_pct >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>
                      {c.engajamento_pct}%
                    </Badge>
                  </TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
              {campusData.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum campus cadastrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Global strategic alerts ──

function GlobalStrategicAlerts({ campusData }: { campusData: CampusKPI[] }) {
  const alerts: { title: string; description: string; severity: 'warning' | 'critical' }[] = [];

  // Campos com engajamento baixo
  const lowEngCampus = campusData.filter(c => c.engajamento_pct < 40 && c.celulas_ativas > 0);
  if (lowEngCampus.length > 0) {
    alerts.push({
      title: 'Engajamento baixo em campos',
      description: `${lowEngCampus.map(c => `${c.campo_nome} (${c.engajamento_pct}%)`).join(', ')}`,
      severity: lowEngCampus.some(c => c.engajamento_pct < 20) ? 'critical' : 'warning',
    });
  }

  // Campos sem multiplicação (poucas células)
  const camposPequenos = campusData.filter(c => c.celulas_ativas > 0 && c.celulas_ativas <= 2);
  if (camposPequenos.length > 0) {
    alerts.push({
      title: `${camposPequenos.length} campo(s) com poucas células`,
      description: `Os campos ${camposPequenos.map(c => c.campo_nome).join(', ')} têm 2 ou menos células ativas. Avaliar estratégia de crescimento.`,
      severity: 'warning',
    });
  }

  // Vidas aguardando avanço
  const totalNVParadas = campusData.reduce((s, c) => s + c.novas_vidas_total - c.novas_vidas_convertidas, 0);
  if (totalNVParadas > 5) {
    alerts.push({
      title: `${totalNVParadas} vidas aguardando avanço`,
      description: `Novas vidas sem progressão no funil de integração. Necessário acompanhamento pastoral.`,
      severity: totalNVParadas > 15 ? 'critical' : 'warning',
    });
  }

  // Campos sem batismo
  const semBatismo = campusData.filter(c => c.marcos_batismo === 0 && c.membros_total > 10);
  if (semBatismo.length > 0) {
    alerts.push({
      title: `${semBatismo.length} campo(s) sem batismos registrados`,
      description: `Os campos ${semBatismo.map(c => c.campo_nome).join(', ')} não registraram batismos recentes.`,
      severity: 'warning',
    });
  }

  if (alerts.length === 0) {
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
      {alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1)).map((alert, i) => (
        <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/20 bg-amber-500/5'}>
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className={`h-5 w-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-600'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            </div>
            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0">
              {alert.severity === 'critical' ? 'Crítico' : 'Atenção'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Meeting Agenda Section ──

function MeetingAgendaSection({ campusData }: { campusData: CampusKPI[] }) {
  const { isLoading: aiLoading, insight: aiInsight, generateInsight, clearInsight } = useAIInsights();

  const handleGenerate = async () => {
    const summary = campusData.map(c => ({
      campus: c.campo_nome, celulas: c.celulas_ativas, membros: c.membros_total, engajamento: c.engajamento_pct,
      novas_vidas: c.novas_vidas_total, conversoes: c.novas_vidas_convertidas, supervisoes_bimestre: c.supervisoes_bimestre,
      batismos: c.marcos_batismo,
    }));
    await generateInsight('meeting_agenda' as any, summary as any, 'Reunião com Pastores de Campo');
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10"><MessageSquare className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-lg">Pauta de Reunião</CardTitle>
              <CardDescription>Sugestões geradas com base nos dados atuais dos campos</CardDescription>
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
              Gere automaticamente sugestões de pauta para sua reunião com os pastores de campo,
              com base nos dados de saúde, crescimento e pontos de atenção de cada campus.
            </p>
            <Button onClick={handleGenerate} disabled={aiLoading || campusData.length === 0} className="gap-2">
              {aiLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Gerando pauta...</>) : (<><Sparkles className="h-4 w-4" />Gerar Pauta de Reunião</>)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Gerado em: {new Date(aiInsight.generatedAt).toLocaleString('pt-BR')}</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={aiLoading} className="gap-1"><RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Regenerar</span></Button>
                <Button variant="ghost" size="sm" onClick={clearInsight} className="gap-1"><X className="h-3 w-3" /><span className="hidden sm:inline">Limpar</span></Button>
              </div>
            </div>
            <ScrollArea className="h-[400px] rounded-lg border bg-card p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{typeof aiInsight === 'string' ? aiInsight : (aiInsight as any)?.insight || ''}</ReactMarkdown></div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Trends ──

function TrendsSection() {
  const { data: trends, isLoading } = useGlobalKingdomTrends();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!trends || trends.length === 0) return <p className="text-sm text-muted-foreground text-center">Sem dados suficientes</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Entradas & Conversões</CardTitle></CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="novasVidas" fill="hsl(var(--primary))" name="Novas Vidas" radius={[2, 2, 0, 0]} />
              <Bar dataKey="conversoes" fill="hsl(var(--accent))" name="Conversões" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Multiplicações</CardTitle></CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="multiplicacoes" fill="hsl(var(--accent))" name="Multiplicações" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Funnel ──

function FunnelSection() {
  const { data, isLoading } = useGlobalKingdomFunnel();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!data) return null;

  const steps = [
    { label: 'Cadastradas', value: data.cadastradas },
    { label: 'Boas-vindas', value: data.boasVindasEnviadas },
    { label: 'Encaminhadas', value: data.encaminhadas },
    { label: 'Integradas', value: data.integradas },
    { label: 'Membros', value: data.membros },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {steps.map((step, i) => (
        <Card key={step.label} className="text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold tabular-nums">{step.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{step.label}</p>
            {i > 0 && data.cadastradas > 0 && (
              <Badge variant="secondary" className="text-[10px] mt-2">
                {Math.round((step.value / data.cadastradas) * 100)}%
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Agenda ──

function AgendaSection() {
  const { data: events, isLoading } = useGlobalKingdomAgenda();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!events || events.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum evento nos próximos 14 dias</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {events.map(ev => (
        <Card key={ev.id} className="card-hover">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-bold">
              {format(new Date(ev.date + 'T12:00:00'), 'dd')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ev.title}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(ev.date + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
                {ev.start_time && ` · ${ev.start_time.slice(0, 5)}`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">{ev.type === 'batismo' ? '💧 Batismo' : '🎉 Aclamação'}</Badge>
                {ev.campo_nome && <span className="text-[10px] text-muted-foreground">{ev.campo_nome}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Pastoral Ranking ──

function PastoralRankingSection() {
  const { data, isLoading } = useGlobalPastoralRanking();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">⭐ Potenciais para Servir</CardTitle>
          <CardDescription className="text-xs">Membros com marcos avançados e sem função ativa</CardDescription>
        </CardHeader>
        <CardContent>
          {data.potentials.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum potencial identificado</p>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {data.potentials.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.celula_name} · {m.anos_igreja}a</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end ml-2">
                      {m.marcos.map(marco => (<Badge key={marco} variant="secondary" className="text-[10px]">{marco}</Badge>))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-amber-600" />Cuidado Pastoral Necessário</CardTitle>
          <CardDescription className="text-xs">Membros com tempo de igreja alto e marcos pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          {data.stagnant.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro identificado</p>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {data.stagnant.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.celula_name} · {m.anos_igreja}a</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end ml-2">
                      {m.missing.map(marco => (<Badge key={marco} variant="outline" className="text-[10px] border-amber-500/30 text-amber-700">Sem {marco}</Badge>))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Marco Card ──

function MarcoCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
