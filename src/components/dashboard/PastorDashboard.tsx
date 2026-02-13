import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2, Home, Users, AlertTriangle, Heart, Sparkles, PartyPopper,
  GitBranch, Eye, Cake, Clock, ShieldAlert, TrendingUp, RefreshCw, X, ChevronRight
} from 'lucide-react';
import {
  usePastoralStats,
  useAbsentMembers,
  useSpiritualStagnation,
  useWeeklyBirthdays,
  usePastoralAlerts,
  usePastoralCelebrations,
  useRedeGrowthData,
} from '@/hooks/usePastoralData';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useWeeklyReports } from '@/hooks/useWeeklyReports';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export function PastorDashboard() {
  const { data: stats, isLoading: statsLoading } = usePastoralStats();
  const { data: absent, isLoading: absentLoading } = useAbsentMembers();
  const { data: stagnation } = useSpiritualStagnation();
  const { data: birthdays } = useWeeklyBirthdays();
  const { data: alerts } = usePastoralAlerts();
  const { data: celebrations } = usePastoralCelebrations();
  const { data: redeGrowth } = useRedeGrowthData();

  // AI Pastoral Summary
  const { isLoading: aiLoading, insight: aiInsight, generateInsight, clearInsight } = useAIInsights();
  const dateRange = { from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') };
  const { data: allReports } = useWeeklyReports(undefined, dateRange);

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

  if (statsLoading || absentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Visão Pastoral"
        subtitle="Saúde espiritual e cuidado do rebanho"
        icon={Heart}
      />

      {/* 1. Visão Geral */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Visão Geral</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Home} label="Células Ativas" value={stats?.totalCelulas || 0} />
          <StatCard icon={Users} label="Membros" value={stats?.totalMembers || 0} />
          <StatCard icon={Eye} label="Acompanhamento" value={stats?.celulasEmAcompanhamento || 0} subtitle="sem relatório 2 sem." />
          <StatCard icon={AlertTriangle} label="Em Risco" value={stats?.celulasEmRisco || 0} subtitle="sem relatório esta sem." className={stats?.celulasEmRisco && stats.celulasEmRisco > 0 ? 'border-destructive/30' : ''} />
          <StatCard icon={GitBranch} label="Multiplicações" value={stats?.multiplicacoes90dias || 0} subtitle="últimos 90 dias" />
        </div>
      </section>

      {/* 2. Saúde do Rebanho */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🩺 Saúde do Rebanho</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Ausências */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Membros Ausentes
              </CardTitle>
              <CardDescription>Tempo sem presença registrada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Sem presença há 30 dias</span>
                <Badge variant="secondary">{absent?.thirty || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Sem presença há 60 dias</span>
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">{absent?.sixty || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Sem presença há 90 dias</span>
                <Badge variant="outline" className="border-destructive/50 text-destructive">{absent?.ninety || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Aniversários */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cake className="h-4 w-4 text-primary" />
                Aniversários da Semana
              </CardTitle>
              <CardDescription>Para cuidado e oração</CardDescription>
            </CardHeader>
            <CardContent>
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
        </div>

        {/* Estagnação espiritual */}
        {stagnation && stagnation.count > 0 && (
          <Card className="mt-4 border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Heart className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Atenção Pastoral</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Há <strong>{stagnation.count} pessoa(s)</strong> com mais de {stagnation.yearsThreshold} anos de igreja 
                  que ainda não avançaram em marcos espirituais básicos (Encontro com Deus, Batismo ou Curso Lidere).
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 3. Radar Pastoral */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">⚠️ Radar Pastoral</h2>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/20 bg-amber-500/5'}>
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldAlert className={`h-5 w-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-600'}`} />
                  <div>
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

      {/* 4. Frutos e Celebrações */}
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

      {/* 5. Visão de Governo */}
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

      {/* 6. Resumo Pastoral com IA */}
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
    </div>
  );
}
