import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Heart, UserPlus, Baby, Loader2, Network, FileSpreadsheet, LayoutGrid, Home, GitBranch, AlertTriangle, Calendar, Sprout, TrendingUp } from 'lucide-react';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReports, WeeklyReport, DateRangeFilter } from '@/hooks/useWeeklyReports';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useToast } from '@/hooks/use-toast';
import { DateRangeSelector, DateRangeValue, getDateString } from './DateRangeSelector';
import { MultiplicacoesTab } from './MultiplicacoesTab';
import { exportToExcel } from '@/utils/exportReports';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from './MissionVerse';
import { InitialViewGate } from './InitialViewGate';
import { useDemoScope } from '@/hooks/useDemoScope';
import { RevelaShortcut } from './RevelaShortcut';
import { DashboardScopeBanner } from './DashboardScopeBanner';
import { SectionLabel } from './SectionLabel';

export function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const defaultMainTab = urlTab === 'movimento' ? 'movimento' : 'semanal';
  const { toast } = useToast();
  const { campoId } = useDemoScope();
  const { data: redes, isLoading: redesLoading } = useRedes();
  const { data: coordenacoes, isLoading: coordenacoesLoading } = useCoordenacoes();
  const { data: celulas, isLoading: celulasLoading } = useCelulas();
  const { data: dashStats } = useDashboardStats();
  
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  
  const dateRangeFilter: DateRangeFilter = {
    from: getDateString(dateRange.from),
    to: getDateString(dateRange.to)
  };
  
  const { data: allReports, isLoading: reportsLoading } = useWeeklyReports(undefined, dateRangeFilter, campoId);
  
  const isLoading = redesLoading || coordenacoesLoading || celulasLoading || reportsLoading;
  const currentReports = allReports || [];

  interface RedeData {
    name: string;
    coordenacoes: string[];
    totals: { members_present: number; leaders_in_training: number; discipleships: number; visitors: number; children: number; };
    cellCount: number;
  }

  const reportsByRede = currentReports.reduce<Record<string, RedeData>>((acc, report) => {
    const redeId = report.celula?.coordenacao?.rede?.id;
    const redeName = report.celula?.coordenacao?.rede?.name || 'Sem Rede';
    const coordId = report.celula?.coordenacao_id;
    if (!redeId) return acc;
    
    if (!acc[redeId]) {
      acc[redeId] = { name: redeName, coordenacoes: [], totals: { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 }, cellCount: 0 };
    }
    
    if (coordId && !acc[redeId].coordenacoes.includes(coordId)) acc[redeId].coordenacoes.push(coordId);
    acc[redeId].cellCount++;
    acc[redeId].totals.members_present += report.members_present;
    acc[redeId].totals.leaders_in_training += report.leaders_in_training;
    acc[redeId].totals.discipleships += report.discipleships;
    acc[redeId].totals.visitors += report.visitors;
    acc[redeId].totals.children += report.children;
    
    return acc;
  }, {});

  const grandTotals = Object.values(reportsByRede).reduce((acc, rede) => ({
    members_present: acc.members_present + rede.totals.members_present,
    leaders_in_training: acc.leaders_in_training + rede.totals.leaders_in_training,
    discipleships: acc.discipleships + rede.totals.discipleships,
    visitors: acc.visitors + rede.totals.visitors,
    children: acc.children + rede.totals.children,
  }), { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 });

  const formatDateRangeDisplay = () => {
    return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
  };

  const handleExportExcel = async () => {
    if (!currentReports.length || !celulas || !coordenacoes) {
      toast({ title: 'Aviso', description: 'Nenhum dado para exportar', variant: 'destructive' });
      return;
    }
    await exportToExcel({ reports: currentReports, celulas, coordenacoes, periodLabel: formatDateRangeDisplay() });
    toast({ title: 'Sucesso!', description: 'Arquivo Excel exportado com sucesso' });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalCelulas = celulas?.length || 0;
  const celulasComRelatorio = currentReports.length;
  const celulasPendentes = totalCelulas - celulasComRelatorio;

  return (
    <div className="space-y-6">
      <DashboardScopeBanner />
      <PageHeader
        title="Dashboard Administrativo"
        subtitle="Visão estrutural do campo"
        icon={LayoutGrid}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MissionVerse role="admin" />
        <RevelaShortcut />
      </div>

      {/* ═══ PRIMEIRA TELA — Métricas Estruturais ═══ */}
      <SectionLabel title="Dados Estruturais" subtitle="Visão consolidada do campo" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Network} label="Redes" value={redes?.length || 0} />
        <StatCard icon={LayoutGrid} label="Coordenações" value={coordenacoes?.length || 0} />
        <StatCard icon={Home} label="Células" value={totalCelulas} />
        <StatCard icon={Users} label="Membros Ativos" value={dashStats?.totalMembers || 0} />
        <StatCard icon={TrendingUp} label="Crescimento" value={`${dashStats?.growth || 0}%`} subtitle="últimos 30 dias" />
      </div>

      {/* ═══ ABAS OPERACIONAIS ═══ */}
      <Tabs defaultValue={defaultMainTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="semanal" className="gap-1.5"><Calendar className="h-4 w-4" />Acompanhamento Semanal</TabsTrigger>
          <TabsTrigger value="movimento" className="gap-1.5"><Sprout className="h-4 w-4" />Movimento do Reino</TabsTrigger>
        </TabsList>

        <TabsContent value="semanal">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
              {currentReports.length > 0 && (
                <Button onClick={handleExportExcel} variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Exportar
                </Button>
              )}
            </div>

            {/* Pendências */}
            <SectionLabel title="Acompanhamento Semanal" subtitle="Período selecionado" />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard icon={AlertTriangle} label="Relatórios pendentes" value={celulasPendentes > 0 ? celulasPendentes : 0} subtitle="no período" className={celulasPendentes > 0 ? 'border-amber-500/30' : ''} />
              <StatCard icon={Users} label="Membros (semana)" value={grandTotals.members_present} subtitle="no período" />
              <StatCard icon={UserPlus} label="Visitantes (semana)" value={grandTotals.visitors} subtitle="no período" />
              <StatCard icon={UserCheck} label="Líd. Treinamento" value={grandTotals.leaders_in_training} subtitle="no período" />
            </div>

            {/* Tabela por Rede */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-5 w-5 text-primary" />
                  Dados por Rede — {formatDateRangeDisplay()}
                </CardTitle>
                <CardDescription>{Object.keys(reportsByRede).length} rede(s) com relatórios</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(reportsByRede).length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Rede</TableHead>
                          <TableHead>Líder de Rede</TableHead>
                          <TableHead className="text-center">Coord.</TableHead>
                          <TableHead className="text-center">Células</TableHead>
                          <TableHead className="text-center">Membros</TableHead>
                          <TableHead className="text-center">Líd. Trein.</TableHead>
                          <TableHead className="text-center">Disc.</TableHead>
                          <TableHead className="text-center">Visit.</TableHead>
                          <TableHead className="text-center">Crianças</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportsByRede).map(([redeId, rede]) => {
                          const total = rede.totals.members_present + rede.totals.leaders_in_training + rede.totals.discipleships + rede.totals.visitors + rede.totals.children;
                          return (
                            <TableRow key={redeId} className="hover:bg-muted/30">
                              <TableCell className="font-medium">{rede.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {(() => {
                                  const redeData = redes?.find(r => r.id === redeId);
                                  return redeData?.leadership_couple
                                    ? `${redeData.leadership_couple.spouse1?.name} & ${redeData.leadership_couple.spouse2?.name}`
                                    : '—';
                                })()}
                              </TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{rede.coordenacoes.length}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{rede.cellCount}</Badge></TableCell>
                              <TableCell className="text-center">{rede.totals.members_present}</TableCell>
                              <TableCell className="text-center">{rede.totals.leaders_in_training}</TableCell>
                              <TableCell className="text-center">{rede.totals.discipleships}</TableCell>
                              <TableCell className="text-center">{rede.totals.visitors}</TableCell>
                              <TableCell className="text-center">{rede.totals.children}</TableCell>
                              <TableCell className="text-center"><Badge>{total}</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-primary/10 font-bold border-t-2">
                          <TableCell>TOTAL GERAL</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-center"><Badge variant="outline">{coordenacoes?.length || 0}</Badge></TableCell>
                          <TableCell className="text-center"><Badge variant="outline">{currentReports.length}</Badge></TableCell>
                          <TableCell className="text-center">{grandTotals.members_present}</TableCell>
                          <TableCell className="text-center">{grandTotals.leaders_in_training}</TableCell>
                          <TableCell className="text-center">{grandTotals.discipleships}</TableCell>
                          <TableCell className="text-center">{grandTotals.visitors}</TableCell>
                          <TableCell className="text-center">{grandTotals.children}</TableCell>
                          <TableCell className="text-center">
                            <Badge>{grandTotals.members_present + grandTotals.leaders_in_training + grandTotals.discipleships + grandTotals.visitors + grandTotals.children}</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Nenhum relatório enviado neste período</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movimento">
          <MultiplicacoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
