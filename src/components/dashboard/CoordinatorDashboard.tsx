import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Heart, UserPlus, Baby, Loader2, LayoutGrid, Eye, ClipboardCheck, Image, FileSpreadsheet, Sparkles, History, Plus, Activity, Calendar, DoorOpen, BookOpen, AlertTriangle, Sprout, Home, TrendingUp, HeartPulse } from 'lucide-react';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReportsByCoordenacao, useUpdateWeeklyReport, useDeleteWeeklyReport } from '@/hooks/useWeeklyReports';
import { useSupervisoesByCoordenacao } from '@/hooks/useSupervisoes';
import { useToast } from '@/hooks/use-toast';
import { DateRangeSelector, DateRangeValue, getDateString } from './DateRangeSelector';
import { CelulaDetailsDialog } from './CelulaDetailsDialog';
import { SupervisoesList } from './SupervisoesList';
import { LeaderBirthdayAlert } from './LeaderBirthdayAlert';
import { CelulaPhotoGallery } from './CelulaPhotoGallery';
import { AIInsightsPanel } from './AIInsightsPanel';
import { ReportsHistoryTable } from '@/components/reports/ReportsHistoryTable';
import { exportToExcel } from '@/utils/exportReports';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from './MissionVerse';
import { EmptyState } from '@/components/ui/empty-state';
import { useRole } from '@/contexts/RoleContext';
import { SupervisorFormDialog } from '@/components/settings/SupervisorFormDialog';
import { PulsoRedeSection } from './PulsoRedeSection';
import { RadarSaudePanel } from './RadarSaudePanel';
import { PlanejamentoCoordenadorPanel } from './coordenador/PlanejamentoCoordenadorPanel';
import { RecomecoCoordTab } from './recomeco/RecomecoCoordTab';
import { DiscipuladoCoordView } from './discipulado/DiscipuladoCoordView';
import { RevelaShortcut } from './RevelaShortcut';
import { DashboardScopeBanner } from './DashboardScopeBanner';
import { InitialViewGate } from './InitialViewGate';
import { SectionLabel } from './SectionLabel';
import { useMembers } from '@/hooks/useMembers';
import { PotenciaisServirCard } from './PotenciaisServirCard';
import { LeadershipRecommendationDialog } from './LeadershipRecommendationDialog';
import { CuidadoEspiritualConsolidado } from './CuidadoEspiritualPanel';
import { VitalidadeCascataPanel } from './VitalidadeRelacionalPanel';

export function CoordinatorDashboard() {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const defaultMainTab = urlTab === 'acompanhamento' || urlTab === 'movimento'
    ? 'acompanhamento'
    : urlTab === 'analises' || urlTab === 'pulso'
      ? 'analises'
      : 'visao-geral';
  const defaultAcompanhamentoTab = urlTab === 'movimento' ? 'movimento' : 'semanal';
  const { toast } = useToast();
  const { data: coordenacoes, isLoading: coordenacoesLoading } = useCoordenacoes();
  const { data: celulas } = useCelulas();
  const { data: members } = useMembers();
  
  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>('');
  const { scopeId, scopeType } = useRole();
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: subDays(new Date(), 6), to: new Date() });
  const [selectedCelula, setSelectedCelula] = useState<{ id: string; name: string } | null>(null);
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  
  const dateRangeFilter = { from: getDateString(dateRange.from), to: getDateString(dateRange.to) };
  const { data: reports, isLoading: reportsLoading } = useWeeklyReportsByCoordenacao(selectedCoordenacao, dateRangeFilter);
  const { data: supervisoes, isLoading: supervisoesLoading } = useSupervisoesByCoordenacao(selectedCoordenacao);
  const updateReport = useUpdateWeeklyReport();
  const deleteReport = useDeleteWeeklyReport();

  const handleEditReport = (data: { id: string; members_present: number; leaders_in_training: number; discipleships: number; visitors: number; children: number; notes: string | null; }) => {
    updateReport.mutate(data, {
      onSuccess: () => toast({ title: 'Sucesso!', description: 'Relatório atualizado' }),
      onError: () => toast({ title: 'Erro', description: 'Não foi possível atualizar', variant: 'destructive' }),
    });
  };

  const handleDeleteReport = (id: string) => {
    deleteReport.mutate(id, {
      onSuccess: () => toast({ title: 'Sucesso!', description: 'Relatório excluído' }),
      onError: () => toast({ title: 'Erro', description: 'Não foi possível excluir', variant: 'destructive' }),
    });
  };

  const formatDateRangeDisplay = () => `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;

  const handleExportExcel = async () => {
    if (!reports?.length || !celulas || !coordenacoes) { toast({ title: 'Aviso', description: 'Nenhum dado para exportar', variant: 'destructive' }); return; }
    const coord = coordenacoes.filter(c => c.id === selectedCoordenacao);
    const coordCelulas = celulas.filter(c => c.coordenacao_id === selectedCoordenacao);
    await exportToExcel({ reports, celulas: coordCelulas, coordenacoes: coord, periodLabel: formatDateRangeDisplay() });
    toast({ title: 'Sucesso!', description: 'Excel exportado' });
  };

  const userCoordenacoes = scopeType === 'coordenacao' && scopeId 
    ? (coordenacoes || []).filter(c => c.id === scopeId)
    : coordenacoes || [];
  
  if (scopeType === 'coordenacao' && scopeId && !selectedCoordenacao && userCoordenacoes.length > 0) {
    setSelectedCoordenacao(scopeId);
  }

  const selectedCoordData = userCoordenacoes.find(c => c.id === selectedCoordenacao);
  const currentReports = reports || [];

  const totals = currentReports.reduce((acc, report) => ({
    members_present: acc.members_present + report.members_present,
    leaders_in_training: acc.leaders_in_training + report.leaders_in_training,
    discipleships: acc.discipleships + report.discipleships,
    visitors: acc.visitors + report.visitors,
    children: acc.children + report.children,
  }), { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 });

  const coordCelulas = celulas?.filter(c => c.coordenacao_id === selectedCoordenacao) || [];
  const celulasComRelatorio = new Set(currentReports.map(r => r.celula_id));
  const celulasPendentes = coordCelulas.filter(c => !celulasComRelatorio.has(c.id));

  // Structural member count for this coordination
  const coordMembersCount = members?.filter(m => coordCelulas.some(c => c.id === m.celula_id) && m.is_active)?.length || 0;

  if (coordenacoesLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <DashboardScopeBanner />
      <PageHeader title="Dashboard do Coordenador" subtitle="Visão estrutural da coordenação" icon={LayoutGrid} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MissionVerse role="coordenador" />
        <RevelaShortcut />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Coordenação:</p>
            <Select value={selectedCoordenacao} onValueChange={setSelectedCoordenacao}>
              <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Selecione uma coordenação" /></SelectTrigger>
              <SelectContent>
                {userCoordenacoes.map((coord) => (<SelectItem key={coord.id} value={coord.id}>{coord.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedCoordData?.leadership_couple && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {selectedCoordData.leadership_couple.spouse1 && (
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={selectedCoordData.leadership_couple.spouse1.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{selectedCoordData.leadership_couple.spouse1.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                {selectedCoordData.leadership_couple.spouse2 && (
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={selectedCoordData.leadership_couple.spouse2.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{selectedCoordData.leadership_couple.spouse2.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedCoordData.leadership_couple.spouse1?.name} & {selectedCoordData.leadership_couple.spouse2?.name}</p>
                <p className="text-xs text-muted-foreground">Coordenadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCoordenacao && (
        <div className="space-y-6">
          <Tabs defaultValue={defaultMainTab} className="space-y-4">
            <TabsList className="w-full h-auto justify-start gap-1 overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
              <TabsTrigger value="analises">Movimento, Saúde e Cuidado</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral" className="space-y-6">
              <LeaderBirthdayAlert coordenacaoId={selectedCoordenacao} />
              <SectionLabel title="Dados Estruturais" subtitle="Visão consolidada da coordenação" />
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <StatCard icon={Home} label="Células" value={coordCelulas.length} />
                <StatCard icon={Users} label="Membros Ativos" value={coordMembersCount} />
                <StatCard icon={ClipboardCheck} label="Supervisões" value={supervisoes?.length || 0} subtitle="registradas" />
              </div>

              <SectionLabel title="Potenciais para Servir" subtitle="Membros prontos para novos desafios" />
              <PotenciaisServirCard coordenacaoId={selectedCoordenacao} />

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowRecommendationDialog(true)}>
                  Indicar para Supervisor
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="acompanhamento" className="space-y-4">
              <Tabs defaultValue={defaultAcompanhamentoTab} className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="semanal" className="gap-1.5"><Calendar className="h-4 w-4" />Acompanhamento Semanal</TabsTrigger>
              <TabsTrigger value="movimento" className="gap-1.5"><Sprout className="h-4 w-4" />Movimento do Reino</TabsTrigger>
            </TabsList>

            <TabsContent value="semanal">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
                  {selectedCoordenacao && currentReports.length > 0 && (
                    <Button onClick={handleExportExcel} variant="outline" size="sm">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />Exportar
                    </Button>
                  )}
                </div>

                <SectionLabel title="Acompanhamento Semanal" subtitle="Período selecionado" />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={AlertTriangle} label="Pendentes" value={celulasPendentes.length} subtitle="sem relatório no período" className={celulasPendentes.length > 0 ? 'border-amber-500/30' : ''} />
                  <StatCard icon={Users} label="Membros (semana)" value={totals.members_present} subtitle="no período" />
                  <StatCard icon={UserPlus} label="Visitantes" value={totals.visitors} subtitle="no período" />
                  <StatCard icon={Heart} label="Discipulados" value={totals.discipleships} subtitle="no período" />
                </div>

                {celulasPendentes.length > 0 && (
                  <Card className="border-l-4 border-l-amber-500/50">
                    <CardContent className="py-3 px-5">
                      <p className="text-sm font-medium">{celulasPendentes.length} célula(s) sem relatório no período</p>
                      <p className="text-xs text-muted-foreground">{celulasPendentes.map(c => c.name).join(', ')}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Tabela de relatórios por célula */}
                <div className="rounded-lg border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Célula</TableHead>
                        <TableHead>Líderes</TableHead>
                        <TableHead className="text-center">Membros</TableHead>
                        <TableHead className="text-center">Líd. Trein.</TableHead>
                        <TableHead className="text-center">Disc.</TableHead>
                        <TableHead className="text-center">Visit.</TableHead>
                        <TableHead className="text-center">Crianças</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coordCelulas.map((celula) => {
                        const cellReports = currentReports.filter(r => r.celula_id === celula.id);
                        const cellTotals = cellReports.reduce((acc, r) => ({
                          members_present: acc.members_present + r.members_present,
                          leaders_in_training: acc.leaders_in_training + r.leaders_in_training,
                          discipleships: acc.discipleships + r.discipleships,
                          visitors: acc.visitors + r.visitors,
                          children: acc.children + r.children,
                        }), { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 });

                        return (
                          <TableRow key={celula.id} className="hover:bg-muted/30">
                            <TableCell>
                              <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setSelectedCelula({ id: celula.id, name: celula.name })}>
                                {celula.name}
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {celula.leadership_couple ? `${celula.leadership_couple.spouse1?.name} & ${celula.leadership_couple.spouse2?.name}` : '—'}
                            </TableCell>
                            <TableCell className="text-center">{cellTotals.members_present}</TableCell>
                            <TableCell className="text-center">{cellTotals.leaders_in_training}</TableCell>
                            <TableCell className="text-center">{cellTotals.discipleships}</TableCell>
                            <TableCell className="text-center">{cellTotals.visitors}</TableCell>
                            <TableCell className="text-center">{cellTotals.children}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedCelula({ id: celula.id, name: celula.name })}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="movimento">
              <div className="space-y-6">
                <RecomecoCoordTab coordenacaoId={selectedCoordenacao} />
                <DiscipuladoCoordView coordId={selectedCoordenacao} redeId={selectedCoordData?.rede_id} />
              </div>
            </TabsContent>
          </Tabs>
            </TabsContent>

            <TabsContent value="analises" className="space-y-4">
              <InitialViewGate>
                <Tabs defaultValue={urlTab === 'pulso' ? 'pulso' : 'planejamento'} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="planejamento" className="gap-1.5"><Calendar className="h-4 w-4" />Planejamento</TabsTrigger>
                <TabsTrigger value="pulso" className="gap-1.5"><Activity className="h-4 w-4" />Visão Pastoral</TabsTrigger>
                <TabsTrigger value="saude" className="gap-1.5"><Heart className="h-4 w-4" />Saúde da Rede</TabsTrigger>
                <TabsTrigger value="historico" className="gap-1.5"><History className="h-4 w-4" />Histórico</TabsTrigger>
                <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" />Insights IA</TabsTrigger>
                <TabsTrigger value="fotos" className="gap-1.5"><Image className="h-4 w-4" />Fotos</TabsTrigger>
                <TabsTrigger value="cuidado-espiritual" className="gap-1.5"><HeartPulse className="h-4 w-4" />Cuidado Espiritual</TabsTrigger>
                <TabsTrigger value="vitalidade" className="gap-1.5"><Activity className="h-4 w-4" />Vitalidade</TabsTrigger>
                <TabsTrigger value="supervisoes" className="gap-1.5"><ClipboardCheck className="h-4 w-4" />Cuidado e Supervisão</TabsTrigger>
              </TabsList>

              <TabsContent value="planejamento"><PlanejamentoCoordenadorPanel coordenacaoId={selectedCoordenacao} /></TabsContent>
              <TabsContent value="pulso"><PulsoRedeSection scopeType="coordenacao" scopeId={selectedCoordenacao} title="Visão Pastoral da Coordenação" /></TabsContent>
              <TabsContent value="saude"><RadarSaudePanel scopeType="coordenacao" scopeId={selectedCoordenacao} title="Saúde da Rede" /></TabsContent>
              <TabsContent value="historico"><ReportsHistoryTable reports={currentReports} onEdit={handleEditReport} onDelete={handleDeleteReport} /></TabsContent>
              <TabsContent value="insights"><AIInsightsPanel reports={currentReports} periodLabel={formatDateRangeDisplay()} context="coordenacao" /></TabsContent>
              <TabsContent value="fotos"><CelulaPhotoGallery reports={currentReports} /></TabsContent>
              <TabsContent value="cuidado-espiritual"><CuidadoEspiritualConsolidado coordenacaoId={selectedCoordenacao} groupBy="celula" /></TabsContent>
              <TabsContent value="vitalidade">
                <div className="space-y-6">
                  <VitalidadeCascataPanel mode="membros" coordenacaoId={selectedCoordenacao} title="Vitalidade Relacional — Membros" description="Saúde relacional dos membros da coordenação" />
                  <VitalidadeCascataPanel mode="lideres" coordenacaoId={selectedCoordenacao} title="Vitalidade Ministerial — Líderes" description="Engajamento ministerial dos líderes de célula" />
                </div>
              </TabsContent>
              <TabsContent value="supervisoes">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setShowSupervisorForm(true)} size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar Supervisor</Button>
                  </div>
                  {supervisoes && supervisoes.length > 0 ? (
                    <SupervisoesList supervisoes={supervisoes} />
                  ) : (
                    <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description="Adicione supervisores para começar" />
                  )}
                </div>
              </TabsContent>
                </Tabs>
              </InitialViewGate>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!selectedCoordenacao && (
        <EmptyState icon={LayoutGrid} title="Selecione uma coordenação" description="Escolha sua coordenação para visualizar os dados" />
      )}

      {selectedCelula && (
        <CelulaDetailsDialog open={!!selectedCelula} onOpenChange={(open) => !open && setSelectedCelula(null)} celulaId={selectedCelula.id} celulaName={selectedCelula.name} />
      )}

      <LeadershipRecommendationDialog
        open={showRecommendationDialog}
        onOpenChange={setShowRecommendationDialog}
        recommendationType="supervisor"
        title="Indicar para análise: Supervisor"
      />

      <SupervisorFormDialog open={showSupervisorForm} onOpenChange={setShowSupervisorForm} defaultCoordenacaoId={selectedCoordenacao} lockCoordenacao />
    </div>
  );
}
