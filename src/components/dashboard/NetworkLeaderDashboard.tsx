import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, Heart, UserPlus, Baby, Loader2, Network, FileSpreadsheet, ChevronDown, ChevronUp, Eye, ClipboardCheck, Image, Sparkles, History, GitBranch, User, Activity, Mail } from 'lucide-react';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReportsByRede, WeeklyReport, useUpdateWeeklyReport, useDeleteWeeklyReport } from '@/hooks/useWeeklyReports';
import { useSupervisoesByRede } from '@/hooks/useSupervisoes';
import { useToast } from '@/hooks/use-toast';
import { DateRangeSelector, DateRangeValue, getDateString } from './DateRangeSelector';
import { CelulaDetailsDialog } from './CelulaDetailsDialog';
import { SupervisoesList } from './SupervisoesList';
import { LeaderBirthdayAlert } from './LeaderBirthdayAlert';
import { CelulaPhotoGallery } from './CelulaPhotoGallery';
import { AIInsightsPanel } from './AIInsightsPanel';
import { MultiplicacoesTab } from './MultiplicacoesTab';
import { MultiplicacoesVisual } from './MultiplicacoesVisual';
import { ReportsHistoryTable } from '@/components/reports/ReportsHistoryTable';
import { exportToExcel } from '@/utils/exportReports';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from './MissionVerse';
import { EmptyState } from '@/components/ui/empty-state';
import { useRole } from '@/contexts/RoleContext';
import { PulsoRedeSection } from './PulsoRedeSection';
import { AniversariantesSemanaCard } from './AniversariantesSemanaCard';
import { RedeEmailReportDialog } from './RedeEmailReportDialog';

export function NetworkLeaderDashboard() {
  const { toast } = useToast();
  const { data: redes, isLoading: redesLoading } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();
  
  const [selectedRede, setSelectedRede] = useState<string>('');
  const { scopeId, scopeType } = useRole();
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: subDays(new Date(), 6), to: new Date() });
  const [expandedCoords, setExpandedCoords] = useState<Set<string>>(new Set());
  const [selectedCelula, setSelectedCelula] = useState<{ id: string; name: string } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  
  const dateRangeFilter = { from: getDateString(dateRange.from), to: getDateString(dateRange.to) };
  const { data: redeData, isLoading: reportsLoading } = useWeeklyReportsByRede(selectedRede, dateRangeFilter);
  const { data: supervisoes } = useSupervisoesByRede(selectedRede);
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

  const toggleCoord = (coordId: string) => {
    setExpandedCoords(prev => { const next = new Set(prev); if (next.has(coordId)) next.delete(coordId); else next.add(coordId); return next; });
  };

  const formatDateRangeDisplay = () => `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;

  const handleExportExcel = () => {
    if (!redeData?.reports?.length || !celulas || !coordenacoes) { toast({ title: 'Aviso', description: 'Não há dados suficientes.', variant: 'destructive' }); return; }
    const redeName = redes?.find(r => r.id === selectedRede)?.name || 'Rede';
    exportToExcel({ reports: redeData.reports, celulas, coordenacoes, periodLabel: `Relatorio_${redeName}_${getDateString(dateRange.from)}_${getDateString(dateRange.to)}` });
    toast({ title: 'Sucesso', description: 'Relatório exportado!' });
  };

  if (redesLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const userRedes = redes || [];
  
  // Auto-select if scoped
  if (scopeType === 'rede' && scopeId && !selectedRede && userRedes.length > 0) {
    setSelectedRede(scopeId);
  }
  const currentReports = redeData?.reports || [];
  const redeCelulas = redeData?.celulas || [];
  const redeCoordenacoes = redeData?.coordenacoes || [];

  const totals = currentReports.reduce((acc, r) => ({
    members_present: acc.members_present + r.members_present,
    leaders_in_training: acc.leaders_in_training + r.leaders_in_training,
    discipleships: acc.discipleships + r.discipleships,
    visitors: acc.visitors + r.visitors,
    children: acc.children + r.children,
  }), { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 });

  const reportsByCoordenacao: Record<string, { name: string; reports: WeeklyReport[]; totals: typeof totals }> = {};
  redeCoordenacoes.forEach(coord => {
    const coordCelulaIds = redeCelulas.filter(c => c.coordenacao_id === coord.id).map(c => c.id);
    const coordReports = currentReports.filter(r => coordCelulaIds.includes(r.celula_id));
    const coordTotals = coordReports.reduce((acc, r) => ({
      members_present: acc.members_present + r.members_present, leaders_in_training: acc.leaders_in_training + r.leaders_in_training,
      discipleships: acc.discipleships + r.discipleships, visitors: acc.visitors + r.visitors, children: acc.children + r.children,
    }), { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 });
    if (coordReports.length > 0) {
      reportsByCoordenacao[coord.id] = { name: coord.name, reports: coordReports, totals: coordTotals };
    }
  });

  const selectedRedeData = userRedes.find(r => r.id === selectedRede);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão da Rede"
        subtitle="Acompanhe o desempenho das coordenações"
        icon={Network}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
            {selectedRede && (
              <>
                <Button variant="outline" size="icon" onClick={handleExportExcel} title="Exportar Excel">
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={() => setEmailDialogOpen(true)} className="gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Enviar Relatório</span>
                  <span className="sm:hidden">E-mail</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      <MissionVerse role="rede_leader" />

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Rede:</p>
            <Select value={selectedRede} onValueChange={setSelectedRede}>
              <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Selecione uma rede" /></SelectTrigger>
              <SelectContent>
                {userRedes.map((rede) => (<SelectItem key={rede.id} value={rede.id}>{rede.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedRedeData?.leadership_couple && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {selectedRedeData.leadership_couple.spouse1 && (
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={selectedRedeData.leadership_couple.spouse1.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{selectedRedeData.leadership_couple.spouse1.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                {selectedRedeData.leadership_couple.spouse2 && (
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={selectedRedeData.leadership_couple.spouse2.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{selectedRedeData.leadership_couple.spouse2.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedRedeData.leadership_couple.spouse1?.name} & {selectedRedeData.leadership_couple.spouse2?.name}</p>
                <p className="text-xs text-muted-foreground">Líderes de Rede</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRede && (
        <>
          <LeaderBirthdayAlert redeId={selectedRede} />

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Users} label="Membros" value={totals.members_present} />
            <StatCard icon={UserCheck} label="Líd. Treino" value={totals.leaders_in_training} />
            <StatCard icon={Heart} label="Discipulados" value={totals.discipleships} />
            <StatCard icon={UserPlus} label="Visitantes" value={totals.visitors} />
            <StatCard icon={Baby} label="Crianças" value={totals.children} />
            <StatCard icon={FileSpreadsheet} label="Células" value={currentReports.length} />
          </div>

          <Tabs defaultValue="coordenacoes" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="pulso" className="gap-1.5"><Activity className="h-4 w-4" />Pulso</TabsTrigger>
              <TabsTrigger value="coordenacoes" className="gap-1.5"><Network className="h-4 w-4" />Coordenações</TabsTrigger>
              <TabsTrigger value="multiplicacoes" className="gap-1.5"><GitBranch className="h-4 w-4" />Multiplicação</TabsTrigger>
              <TabsTrigger value="multiplicacoes-visual" className="gap-1.5"><GitBranch className="h-4 w-4" />Visual</TabsTrigger>
              <TabsTrigger value="historico" className="gap-1.5"><History className="h-4 w-4" />Histórico</TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="h-4 w-4" />IA</TabsTrigger>
              <TabsTrigger value="fotos" className="gap-1.5"><Image className="h-4 w-4" />Fotos</TabsTrigger>
              {supervisoes && supervisoes.length > 0 && (
                <TabsTrigger value="supervisoes" className="gap-1.5"><ClipboardCheck className="h-4 w-4" />Supervisões</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="pulso">
              <div className="space-y-6">
                <PulsoRedeSection scopeType="rede" scopeId={selectedRede} title="Pulso da Rede" />
                <AniversariantesSemanaCard scopeType="rede" scopeId={selectedRede} />
              </div>
            </TabsContent>

            <TabsContent value="multiplicacoes"><MultiplicacoesTab /></TabsContent>
            <TabsContent value="multiplicacoes-visual"><MultiplicacoesVisual celulas={celulas || []} /></TabsContent>
            <TabsContent value="insights"><AIInsightsPanel reports={currentReports} periodLabel={formatDateRangeDisplay()} context="rede" /></TabsContent>

            <TabsContent value="coordenacoes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Network className="h-5 w-5 text-primary" />Dados por Coordenação</CardTitle>
                  <CardDescription>{Object.keys(reportsByCoordenacao).length} coordenação(ões) com relatórios</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : Object.keys(reportsByCoordenacao).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(reportsByCoordenacao).map(([coordId, coord]) => {
                        const total = coord.totals.members_present + coord.totals.leaders_in_training + coord.totals.discipleships + coord.totals.visitors + coord.totals.children;
                        const isExpanded = expandedCoords.has(coordId);
                        
                        return (
                          <Collapsible key={coordId} open={isExpanded} onOpenChange={() => toggleCoord(coordId)}>
                            <Card className="border-l-4 border-l-primary/40">
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <CardTitle className="text-sm font-semibold">{coord.name}</CardTitle>
                                      {(() => {
                                        const coordObj = coordenacoes?.find(c => c.id === coordId);
                                        const couple = coordObj?.leadership_couple;
                                        const coupleName = couple?.spouse1?.name && couple?.spouse2?.name
                                          ? `${couple.spouse1.name} & ${couple.spouse2.name}`
                                          : couple?.spouse1?.name || couple?.spouse2?.name || null;
                                        return coupleName ? (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" />Coordenadores: {coupleName}
                                          </p>
                                        ) : null;
                                      })()}
                                      <CardDescription className="text-xs">{coord.reports.length} célula(s) • Total: {total}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>Membros: {coord.totals.members_present}</span>
                                        <span>•</span>
                                        <span>Visitantes: {coord.totals.visitors}</span>
                                      </div>
                                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="pt-0">
                                  <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/50">
                                          <TableHead>Célula</TableHead>
                                          <TableHead className="text-center">Membros</TableHead>
                                          <TableHead className="text-center">Líderes</TableHead>
                                          <TableHead className="text-center">Disc.</TableHead>
                                          <TableHead className="text-center">Vis.</TableHead>
                                          <TableHead className="text-center">Crianças</TableHead>
                                          <TableHead className="text-center">Ações</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {coord.reports.map(report => (
                                          <TableRow key={report.id} className="hover:bg-muted/30">
                                            <TableCell className="font-medium text-sm">{report.celula?.name}</TableCell>
                                            <TableCell className="text-center">{report.members_present}</TableCell>
                                            <TableCell className="text-center">{report.leaders_in_training}</TableCell>
                                            <TableCell className="text-center">{report.discipleships}</TableCell>
                                            <TableCell className="text-center">{report.visitors}</TableCell>
                                            <TableCell className="text-center">{report.children}</TableCell>
                                            <TableCell className="text-center">
                                              <Button variant="ghost" size="sm" onClick={() => setSelectedCelula({ id: report.celula_id, name: report.celula?.name || '' })}>
                                                <Eye className="h-4 w-4" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState icon={Network} title="Nenhum relatório" description="Nenhum relatório encontrado para esta semana." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico">
              <ReportsHistoryTable reports={currentReports} onEdit={handleEditReport} onDelete={handleDeleteReport} />
            </TabsContent>

            <TabsContent value="fotos"><CelulaPhotoGallery reports={currentReports} /></TabsContent>
            
            {supervisoes && supervisoes.length > 0 && (
              <TabsContent value="supervisoes"><SupervisoesList supervisoes={supervisoes} /></TabsContent>
            )}
          </Tabs>
        </>
      )}

      {!selectedRede && (
        <EmptyState icon={Network} title="Selecione uma rede" description="Escolha a rede para visualizar os relatórios" />
      )}

      {selectedCelula && (
        <CelulaDetailsDialog open={!!selectedCelula} onOpenChange={(open) => { if (!open) setSelectedCelula(null); }} celulaId={selectedCelula.id} celulaName={selectedCelula.name} />
      )}

      {selectedRede && (
        <RedeEmailReportDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          redeId={selectedRede}
          redeName={selectedRedeData?.name || 'Rede Amor a 2'}
          redeLeaderName={
            selectedRedeData?.leadership_couple?.spouse1?.name && selectedRedeData?.leadership_couple?.spouse2?.name
              ? `${selectedRedeData.leadership_couple.spouse1.name} & ${selectedRedeData.leadership_couple.spouse2.name}`
              : selectedRedeData?.leadership_couple?.spouse1?.name || 'Liderança'
          }
        />
      )}
    </div>
  );
}
