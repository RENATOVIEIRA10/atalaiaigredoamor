import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Heart, UserPlus, Baby, Loader2, LayoutGrid, Eye, ClipboardCheck, Image, FileSpreadsheet, Sparkles, History, Plus, Activity } from 'lucide-react';
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

export function CoordinatorDashboard() {
  const { toast } = useToast();
  const { data: coordenacoes, isLoading: coordenacoesLoading } = useCoordenacoes();
  const { data: celulas } = useCelulas();
  
  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>('');
  const { scopeId, scopeType } = useRole();
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: subDays(new Date(), 6), to: new Date() });
  const [selectedCelula, setSelectedCelula] = useState<{ id: string; name: string } | null>(null);
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  
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

  const handleExportExcel = () => {
    if (!reports?.length || !celulas || !coordenacoes) { toast({ title: 'Aviso', description: 'Nenhum dado para exportar', variant: 'destructive' }); return; }
    const coord = coordenacoes.filter(c => c.id === selectedCoordenacao);
    const coordCelulas = celulas.filter(c => c.coordenacao_id === selectedCoordenacao);
    exportToExcel({ reports, celulas: coordCelulas, coordenacoes: coord, periodLabel: formatDateRangeDisplay() });
    toast({ title: 'Sucesso!', description: 'Excel exportado' });
  };

  const userCoordenacoes = scopeType === 'coordenacao' && scopeId 
    ? (coordenacoes || []).filter(c => c.id === scopeId)
    : coordenacoes || [];
  
  // Auto-select if scoped
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

  if (coordenacoesLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard do Coordenador"
        subtitle={`Período: ${formatDateRangeDisplay()}`}
        icon={LayoutGrid}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
            {selectedCoordenacao && currentReports.length > 0 && (
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Exportar
              </Button>
            )}
          </div>
        }
      />

      <MissionVerse role="coordenador" />

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Coordenação:</p>
            <Select value={selectedCoordenacao} onValueChange={setSelectedCoordenacao}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecione uma coordenação" />
              </SelectTrigger>
              <SelectContent>
                {userCoordenacoes.map((coord) => (
                  <SelectItem key={coord.id} value={coord.id}>{coord.name}</SelectItem>
                ))}
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
                <p className="font-semibold">
                  {selectedCoordData.leadership_couple.spouse1?.name} & {selectedCoordData.leadership_couple.spouse2?.name}
                </p>
                <p className="text-xs text-muted-foreground">Coordenadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCoordenacao && (
        <>
          <LeaderBirthdayAlert coordenacaoId={selectedCoordenacao} />

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Users} label="Membros" value={totals.members_present} />
            <StatCard icon={UserCheck} label="Líd. Treinamento" value={totals.leaders_in_training} />
            <StatCard icon={Heart} label="Discipulados" value={totals.discipleships} />
            <StatCard icon={UserPlus} label="Visitantes" value={totals.visitors} />
            <StatCard icon={Baby} label="Crianças" value={totals.children} />
            <StatCard icon={ClipboardCheck} label="Supervisões" value={supervisoes?.length || 0} />
          </div>

          <Tabs defaultValue="relatorios" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="pulso" className="gap-1.5"><Activity className="h-4 w-4" />Pulso</TabsTrigger>
              <TabsTrigger value="relatorios" className="gap-1.5"><LayoutGrid className="h-4 w-4" />Relatórios</TabsTrigger>
              <TabsTrigger value="historico" className="gap-1.5"><History className="h-4 w-4" />Histórico</TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" />Insights IA</TabsTrigger>
              <TabsTrigger value="fotos" className="gap-1.5"><Image className="h-4 w-4" />Fotos</TabsTrigger>
              <TabsTrigger value="supervisoes" className="gap-1.5"><ClipboardCheck className="h-4 w-4" />Supervisões</TabsTrigger>
            </TabsList>

            <TabsContent value="pulso">
              <PulsoRedeSection scopeType="coordenacao" scopeId={selectedCoordenacao} title="Pulso da Coordenação" />
            </TabsContent>

            <TabsContent value="insights">
              <AIInsightsPanel reports={currentReports} periodLabel={formatDateRangeDisplay()} context="coordenacao" />
            </TabsContent>

            <TabsContent value="relatorios">
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
                    {celulas?.filter(c => c.coordenacao_id === selectedCoordenacao).map((celula) => {
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
            </TabsContent>

            <TabsContent value="historico">
              <ReportsHistoryTable reports={currentReports} onEdit={handleEditReport} onDelete={handleDeleteReport} />
            </TabsContent>

            <TabsContent value="fotos">
              <CelulaPhotoGallery reports={currentReports} />
            </TabsContent>

            <TabsContent value="supervisoes">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setShowSupervisorForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />Adicionar Supervisor
                  </Button>
                </div>
                {supervisoes && supervisoes.length > 0 ? (
                  <SupervisoesList supervisoes={supervisoes} />
                ) : (
                  <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description="Adicione supervisores para começar" />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedCoordenacao && (
        <EmptyState icon={LayoutGrid} title="Selecione uma coordenação" description="Escolha sua coordenação para visualizar os dados" />
      )}

      {selectedCelula && (
        <CelulaDetailsDialog open={!!selectedCelula} onOpenChange={(open) => !open && setSelectedCelula(null)} celulaId={selectedCelula.id} celulaName={selectedCelula.name} />
      )}

      <SupervisorFormDialog 
        open={showSupervisorForm} 
        onOpenChange={setShowSupervisorForm} 
        defaultCoordenacaoId={selectedCoordenacao} 
        lockCoordenacao 
      />
    </div>
  );
}
