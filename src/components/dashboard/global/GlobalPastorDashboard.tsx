import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, Globe, Church, Users, Home, GitBranch, Heart, FlaskConical, Eye, BookOpen, Calendar, Sparkles, ShieldAlert, TrendingUp, UserCheck, ArrowRight, Award } from 'lucide-react';
import { useGlobalKingdomData, CampusKPI } from '@/hooks/useGlobalKingdomData';
import { useGlobalKingdomFunnel } from '@/hooks/useGlobalKingdomFunnel';
import { useGlobalKingdomAgenda } from '@/hooks/useGlobalKingdomAgenda';
import { useGlobalPastoralRanking } from '@/hooks/useGlobalPastoralRanking';
import { useGlobalSupervisionGovernance } from '@/hooks/useGlobalSupervisionGovernance';
import { useGlobalKingdomTrends } from '@/hooks/useGlobalKingdomTrends';
import { KingdomCampusCard } from './KingdomCampusCard';
import { CampusDetailView } from './CampusDetailView';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from '../MissionVerse';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAIInsights } from '@/hooks/useAIInsights';
import ReactMarkdown from 'react-markdown';
import { useCampo } from '@/contexts/CampoContext';
import { NetworkLeaderDashboard } from '../NetworkLeaderDashboard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
  const { setActiveCampo, setIsGlobalView } = useCampo();

  // When drilling into a rede, temporarily set the CampoContext so queries filter correctly
  useEffect(() => {
    if (drill.level === 'rede' && drill.campoId && drill.campoNome) {
      setActiveCampo({ id: drill.campoId, nome: drill.campoNome });
    }
    if (drill.level === 'kingdom') {
      // Restore global view so data isn't filtered to a specific campus
      setIsGlobalView(true);
    }
  }, [drill.level, drill.campoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (drill.level === 'rede' && drill.campoId && drill.redeId) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => setDrill({ level: 'kingdom' })}>
                Global
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => setDrill({ level: 'campus', campoId: drill.campoId, campoNome: drill.campoNome })}>
                {drill.campoNome}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{drill.redeNome}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <NetworkLeaderDashboard
          initialRedeId={drill.redeId}
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
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => setDrill({ level: 'kingdom' })}>
                Global
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{drill.campoNome}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <CampusDetailView
          campoId={drill.campoId}
          campoNome={drill.campoNome!}
          onBack={() => setDrill({ level: 'kingdom' })}
          onSelectRede={(redeId, redeNome) => setDrill({
            level: 'rede',
            campoId: drill.campoId,
            campoNome: drill.campoNome,
            redeId,
            redeNome,
          })}
        />
      </div>
    );
  }

  return <KingdomView campusData={campusData || []} onSelectCampus={(id, nome) => setDrill({ level: 'campus', campoId: id, campoNome: nome })} />;
}

// ============================================================
// KINGDOM VIEW — All 8 sections
// ============================================================

function KingdomView({ campusData, onSelectCampus }: { campusData: CampusKPI[]; onSelectCampus: (id: string, nome: string) => void }) {
  const activeCampus = campusData.filter(c => c.celulas_ativas > 0 || c.membros_total > 0);
  const totalCelulas = campusData.reduce((s, c) => s + c.celulas_ativas, 0);
  const totalMembros = campusData.reduce((s, c) => s + c.membros_total, 0);
  const totalNV = campusData.reduce((s, c) => s + c.novas_vidas_total, 0);
  const avgEngajamento = activeCampus.length > 0
    ? Math.round(activeCampus.reduce((s, c) => s + c.engajamento_pct, 0) / activeCampus.length)
    : 0;

  return (
    <div className="space-y-10">
      <PageHeader title="Visão do Reino" subtitle="Panorama executivo de todos os campos" icon={Globe} />
      <MissionVerse role="pastor" />

      {/* Global KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Church} label="Campus Ativos" value={activeCampus.length} subtitle={`de ${campusData.length} total`} />
        <StatCard icon={Home} label="Células" value={totalCelulas} />
        <StatCard icon={Users} label="Membros" value={totalMembros} />
        <StatCard icon={Heart} label="Novas Vidas" value={totalNV} />
        <StatCard icon={GitBranch} label="Engajamento" value={`${avgEngajamento}%`} subtitle="relatórios na semana" />
      </div>

      {/* 1️⃣ MAPA DO REINO */}
      <Section title="1. Mapa do Reino" subtitle="Visão por campus" icon="📊">
        <KingdomMapTable campusData={campusData} onSelect={onSelectCampus} />
      </Section>

      {/* 2️⃣ ATENÇÃO PASTORAL */}
      <Section title="2. Atenção Pastoral" subtitle="Alertas priorizados" icon="🙏">
        <PastoralAlertsSection campusData={campusData} />
      </Section>

      {/* 3️⃣ MOVIMENTO DO REINO */}
      <Section title="3. Movimento do Reino" subtitle="Tendências das últimas 8 semanas" icon="📈">
        <TrendsSection />
      </Section>

      {/* 4️⃣ POTENCIAIS & CUIDADO */}
      <Section title="4. Potenciais & Cuidado" subtitle="Ranking pastoral" icon="⭐">
        <PastoralRankingSection />
      </Section>

      {/* 5️⃣ GOVERNANÇA DE SUPERVISÃO */}
      <Section title="5. Governança de Supervisão" subtitle="Cobertura bimestral por campus" icon="👁️">
        <SupervisionGovernanceSection />
      </Section>

      {/* 6️⃣ FUNIL DO ALTAR À CÉLULA */}
      <Section title="6. Do Altar à Célula" subtitle="Pipeline unificado" icon="🔄">
        <FunnelSection />
      </Section>

      {/* 7️⃣ AGENDA DO REINO */}
      <Section title="7. Agenda do Reino" subtitle="Próximos 14 dias" icon="📅">
        <AgendaSection />
      </Section>

      {/* 8️⃣ BRIEFING */}
      <Section title="8. Briefing Pastoral" subtitle="Resumo automático para reunião" icon="📋">
        <BriefingSection campusData={campusData} />
      </Section>
    </div>
  );
}

// ============================================================
// SECTION WRAPPER
// ============================================================

function Section({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      {children}
    </section>
  );
}

// ============================================================
// 1. MAPA DO REINO — TABELA CLICÁVEL
// ============================================================

function KingdomMapTable({ campusData, onSelect }: { campusData: CampusKPI[]; onSelect: (id: string, nome: string) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Campus</TableHead>
                <TableHead className="text-center">Células</TableHead>
                <TableHead className="text-center">Membros</TableHead>
                <TableHead className="text-center">Engajamento</TableHead>
                <TableHead className="text-center">Novas Vidas</TableHead>
                <TableHead className="text-center">Conversões</TableHead>
                <TableHead className="text-center">Supervisão</TableHead>
                <TableHead className="text-center">Discipulado</TableHead>
                <TableHead className="text-center">Batismo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campusData.map(c => {
                const supPct = c.supervisoes_total_celulas > 0 ? Math.round((c.supervisoes_bimestre / c.supervisoes_total_celulas) * 100) : 0;
                const discPct = c.membros_total > 0 ? Math.round((c.disc_presencas / c.membros_total) * 100) : 0;
                return (
                  <TableRow key={c.campo_id} className="cursor-pointer hover:bg-muted/30" onClick={() => onSelect(c.campo_id, c.campo_nome)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Church className="h-3.5 w-3.5 text-primary" />
                        {c.campo_nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{c.celulas_ativas}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.membros_total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-xs ${c.engajamento_pct >= 80 ? 'bg-green-500/10 text-green-600' : c.engajamento_pct >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>
                        {c.engajamento_pct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{c.novas_vidas_total}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.novas_vidas_convertidas}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">{supPct}%</Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{c.disc_encontros}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.marcos_batismo}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
              {campusData.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum campus cadastrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 2. ATENÇÃO PASTORAL
// ============================================================

function PastoralAlertsSection({ campusData }: { campusData: CampusKPI[] }) {
  const alerts: { title: string; description: string; severity: 'warning' | 'critical'; count: number }[] = [];

  // Cells without reports
  const totalSemRelatorio = campusData.reduce((s, c) => s + (c.celulas_ativas - c.celulas_com_relatorio), 0);
  if (totalSemRelatorio > 0) {
    alerts.push({
      title: 'Relatórios pendentes',
      description: `${totalSemRelatorio} células sem relatório esta semana`,
      severity: totalSemRelatorio > 10 ? 'critical' : 'warning',
      count: totalSemRelatorio,
    });
  }

  // Low supervision coverage
  const lowSupCampus = campusData.filter(c => {
    const pct = c.supervisoes_total_celulas > 0 ? (c.supervisoes_bimestre / c.supervisoes_total_celulas) * 100 : 100;
    return pct < 50 && c.supervisoes_total_celulas > 0;
  });
  if (lowSupCampus.length > 0) {
    alerts.push({
      title: 'Supervisões pendentes',
      description: `${lowSupCampus.map(c => c.campo_nome).join(', ')} com cobertura abaixo de 50%`,
      severity: 'warning',
      count: lowSupCampus.length,
    });
  }

  // Low engagement campus
  const lowEngCampus = campusData.filter(c => c.engajamento_pct < 40 && c.celulas_ativas > 0);
  if (lowEngCampus.length > 0) {
    alerts.push({
      title: 'Engajamento baixo',
      description: `${lowEngCampus.map(c => `${c.campo_nome} (${c.engajamento_pct}%)`).join(', ')}`,
      severity: lowEngCampus.some(c => c.engajamento_pct < 20) ? 'critical' : 'warning',
      count: lowEngCampus.length,
    });
  }

  // Stalled funnel
  const totalNVParadas = campusData.reduce((s, c) => s + c.novas_vidas_total - c.novas_vidas_convertidas, 0);
  if (totalNVParadas > 5) {
    alerts.push({
      title: 'Vidas aguardando avanço',
      description: `${totalNVParadas} novas vidas sem progressão no funil`,
      severity: totalNVParadas > 15 ? 'critical' : 'warning',
      count: totalNVParadas,
    });
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum alerta pastoral no momento ✨</p>
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
            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0">{alert.count}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// 3. TENDÊNCIAS
// ============================================================

function TrendsSection() {
  const { data: trends, isLoading } = useGlobalKingdomTrends();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!trends || trends.length === 0) return <p className="text-sm text-muted-foreground text-center">Sem dados suficientes</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Engajamento de Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="engajamento" stroke="hsl(var(--primary))" strokeWidth={2} name="Engajamento %" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entradas Recomeço & Conversões</CardTitle>
        </CardHeader>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Supervisões Realizadas</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="supervisoes" fill="hsl(var(--primary))" name="Supervisões" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Multiplicações</CardTitle>
        </CardHeader>
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

// ============================================================
// 4. RANKING PASTORAL
// ============================================================

function PastoralRankingSection() {
  const { data, isLoading } = useGlobalPastoralRanking();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Potenciais para Servir
          </CardTitle>
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
                      {m.marcos.map(marco => (
                        <Badge key={marco} variant="secondary" className="text-[10px]">{marco}</Badge>
                      ))}
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
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-amber-600" />
            Cuidado Pastoral Necessário
          </CardTitle>
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
                      {m.missing.map(marco => (
                        <Badge key={marco} variant="outline" className="text-[10px] border-amber-500/30 text-amber-700">Sem {marco}</Badge>
                      ))}
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

// ============================================================
// 5. SUPERVISÃO
// ============================================================

function SupervisionGovernanceSection() {
  const { data, isLoading } = useGlobalSupervisionGovernance();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center">Sem dados</p>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Campus</TableHead>
                <TableHead className="text-center">Células</TableHead>
                <TableHead className="text-center">Supervisionadas</TableHead>
                <TableHead className="text-center">Pendentes</TableHead>
                <TableHead className="text-center">Cobertura</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(c => (
                <TableRow key={c.campo_id}>
                  <TableCell className="font-medium">{c.campo_nome}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.total_celulas}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.supervisoes_bimestre}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.pendentes}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Progress value={c.cobertura_pct} className="h-2 w-16" />
                      <span className="text-xs tabular-nums font-medium">{c.cobertura_pct}%</span>
                      {c.cobertura_pct >= 100 && <span className="text-xs" title="Cobertura completa">🏆</span>}
                    </div>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 6. FUNIL DO ALTAR À CÉLULA
// ============================================================

function FunnelSection() {
  const { data, isLoading } = useGlobalKingdomFunnel();

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!data) return null;

  const steps = [
    { label: 'Cadastradas', value: data.cadastradas, color: 'bg-primary/10 text-primary' },
    { label: 'Boas-vindas', value: data.boasVindasEnviadas, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Encaminhadas', value: data.encaminhadas, color: 'bg-indigo-500/10 text-indigo-600' },
    { label: 'Contatadas', value: data.contatadas, color: 'bg-violet-500/10 text-violet-600' },
    { label: 'Agendadas', value: data.agendadas, color: 'bg-purple-500/10 text-purple-600' },
    { label: 'Integradas', value: data.integradas, color: 'bg-green-500/10 text-green-600' },
    { label: 'Membros', value: data.membros, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Sem resposta', value: data.semResposta, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {steps.map((step, i) => (
        <Card key={step.label} className="text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold tabular-nums">{step.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{step.label}</p>
            {i > 0 && i < steps.length - 1 && data.cadastradas > 0 && (
              <Badge variant="secondary" className={`text-[10px] mt-2 ${step.color}`}>
                {Math.round((step.value / data.cadastradas) * 100)}%
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// 7. AGENDA DO REINO
// ============================================================

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

// ============================================================
// 8. BRIEFING PASTORAL
// ============================================================

function BriefingSection({ campusData }: { campusData: CampusKPI[] }) {
  const { isLoading: aiLoading, insight: aiInsight, generateInsight, clearInsight } = useAIInsights();

  const handleGenerate = async () => {
    const summary = campusData.map(c => ({
      campus: c.campo_nome,
      celulas: c.celulas_ativas,
      membros: c.membros_total,
      engajamento: c.engajamento_pct,
      novas_vidas: c.novas_vidas_total,
      conversoes: c.novas_vidas_convertidas,
      supervisoes_bimestre: c.supervisoes_bimestre,
      marcos: { encontro: c.marcos_encontro, batismo: c.marcos_batismo, lidere: c.marcos_curso_lidere, renovo: c.marcos_renovo },
    }));
    await generateInsight('executive_summary', summary as any, 'Visão Global - Semana atual');
  };

  return (
    <Card>
      <CardContent className="p-5">
        {!aiInsight ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Gere um resumo automático para sua reunião pastoral com os dados atualizados de todos os campus.
            </p>
            <Button onClick={handleGenerate} disabled={aiLoading} size="lg">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar Resumo Pastoral da Semana
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">📋 Resumo Pastoral</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '🔄'} Atualizar
                </Button>
                <Button variant="ghost" size="sm" onClick={clearInsight}>✕</Button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              <ReactMarkdown>{typeof aiInsight === 'string' ? aiInsight : (aiInsight as any)?.insight || ''}</ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
