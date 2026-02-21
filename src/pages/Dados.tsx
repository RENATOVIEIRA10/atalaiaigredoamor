import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Network, FolderTree, Home, Users, UserPlus, FileText,
  GitBranch, Trophy, Loader2, FileSpreadsheet, Database
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DateRangeSelector, DateRangeValue, getDateString } from '@/components/dashboard/DateRangeSelector';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useMembers } from '@/hooks/useMembers';
import { useWeeklyReports, DateRangeFilter } from '@/hooks/useWeeklyReports';
import { useMultiplicacoes } from '@/hooks/useMultiplicacoes';
import { useDadosAggregations } from '@/hooks/useDadosReports';
import { useMemberRanking, RankedMember } from '@/hooks/useMemberRanking';
import { exportToExcel } from '@/utils/exportReports';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';

const milestoneLabels: Record<string, string> = {
  batismo: 'Batismo', encontro_com_deus: 'Encontro', renovo: 'Renovo',
  encontro_de_casais: 'Casais', curso_lidere: 'Lidere',
  is_discipulado: 'Discipulado', is_lider_em_treinamento: 'Líder Trein.',
};

const medalEmojis = ['🥇', '🥈', '🥉'];

export default function Dados() {
  const { isSupervisor, isCelulaLeader, isAdmin, isRedeLeader, isCoordenador } = useRole();

  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: subDays(new Date(), 29), to: new Date() });
  const { scopeType, scopeId } = useRole();

  // Coordenador: lock filters to their own coordenação
  const isCoordScope = isCoordenador && !isAdmin && !isRedeLeader && scopeType === 'coordenacao' && scopeId;

  const [filterRede, setFilterRede] = useState<string>('all');
  const [filterCoord, setFilterCoord] = useState<string>(isCoordScope ? scopeId : 'all');

  const dateRangeFilter: DateRangeFilter = { from: getDateString(dateRange.from), to: getDateString(dateRange.to) };

  // Ensure coord filter stays locked for coordenador scope
  const effectiveFilterCoord = isCoordScope ? scopeId : filterCoord;

  const { data: redes, isLoading: l1 } = useRedes();
  const { data: coordenacoes, isLoading: l2 } = useCoordenacoes();
  const { data: celulas, isLoading: l3 } = useCelulas();
  const { data: members, isLoading: l4 } = useMembers();
  const { data: reports, isLoading: l5 } = useWeeklyReports(undefined, dateRangeFilter);
  const { data: multiplicacoes } = useMultiplicacoes();

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const filteredCoords = useMemo(() => {
    if (!coordenacoes) return [];
    if (isCoordScope) return coordenacoes.filter(c => c.id === scopeId);
    if (filterRede === 'all') return coordenacoes;
    return coordenacoes.filter(c => c.rede_id === filterRede);
  }, [coordenacoes, filterRede, isCoordScope, scopeId]);

  const filteredCelulas = useMemo(() => {
    if (!celulas) return [];
    const validCoordIds = filteredCoords.map(c => c.id);
    let result = celulas.filter(c => validCoordIds.includes(c.coordenacao_id));
    if (effectiveFilterCoord !== 'all') result = result.filter(c => c.coordenacao_id === effectiveFilterCoord);
    return result;
  }, [celulas, filteredCoords, effectiveFilterCoord]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    const validCelulaIds = new Set(filteredCelulas.map(c => c.id));
    return reports.filter(r => validCelulaIds.has(r.celula_id));
  }, [reports, filteredCelulas]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    const validCelulaIds = new Set(filteredCelulas.map(c => c.id));
    return members.filter(m => validCelulaIds.has(m.celula_id));
  }, [members, filteredCelulas]);

  const { byRede, byCoordenacao, byCelula, byLider, kpis } = useDadosAggregations(
    isCoordScope ? [] : (filterRede === 'all' ? redes : redes?.filter(r => r.id === filterRede)),
    effectiveFilterCoord === 'all' ? filteredCoords : filteredCoords.filter(c => c.id === effectiveFilterCoord),
    filteredCelulas, filteredMembers, filteredReports,
  );

  const ranking = useMemberRanking(filteredMembers);

  const filteredMultiplicacoes = useMemo(() => {
    if (!multiplicacoes) return [];
    return multiplicacoes.filter(m => m.data_multiplicacao >= dateRangeFilter.from && m.data_multiplicacao <= dateRangeFilter.to);
  }, [multiplicacoes, dateRangeFilter]);
  const scopedCoordName = isCoordScope ? coordenacoes?.find(c => c.id === scopeId)?.name : null;
  const periodLabel = `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;

  const handleExportCSV = () => {
    exportToExcel({
      reports: filteredReports, celulas: filteredCelulas, coordenacoes: filteredCoords,
      redes: redes || [], members: filteredMembers, periodLabel, byRede, byCoordenacao, byCelula, byLider, ranking, kpis,
    });
  };

  if ((isSupervisor || isCelulaLeader) && !isAdmin && !isRedeLeader && !isCoordenador) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Central de Dados"
          subtitle={scopedCoordName ? `${scopedCoordName} · ${periodLabel}` : `Período: ${periodLabel}`}
          icon={Database}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Exportar
              </Button>
            </div>
          }
        />

        {/* Filters - hidden for coordenador (scope is locked) */}
        {!isCoordScope && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <Select value={filterRede} onValueChange={(v) => { setFilterRede(v); setFilterCoord('all'); }}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas as Redes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Redes</SelectItem>
                    {redes?.map(r => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterCoord} onValueChange={setFilterCoord}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todas Coordenações" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Coordenações</SelectItem>
                    {filteredCoords.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        {kpis && (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard icon={Home} label="Células" value={kpis.totalCelulas} />
            <StatCard icon={Users} label="Membros" value={kpis.totalMembers} />
            <StatCard icon={UserPlus} label="Visitantes" value={kpis.totalVisitors} />
            <StatCard icon={FileText} label="Relatórios" value={kpis.totalReports} />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue={isCoordScope ? "celulas" : "redes"} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {!isCoordScope && <TabsTrigger value="redes" className="gap-1.5"><Network className="h-4 w-4" />Redes</TabsTrigger>}
            {!isCoordScope && <TabsTrigger value="coordenacoes" className="gap-1.5"><FolderTree className="h-4 w-4" />Coordenações</TabsTrigger>}
            <TabsTrigger value="celulas" className="gap-1.5"><Home className="h-4 w-4" />Células</TabsTrigger>
            <TabsTrigger value="lideres" className="gap-1.5"><Users className="h-4 w-4" />Líderes</TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-1.5"><FileText className="h-4 w-4" />Relatórios</TabsTrigger>
            <TabsTrigger value="multiplicacoes" className="gap-1.5"><GitBranch className="h-4 w-4" />Multiplicações</TabsTrigger>
            <TabsTrigger value="ranking" className="gap-1.5"><Trophy className="h-4 w-4" />Ranking</TabsTrigger>
          </TabsList>

          {/* Por Rede */}
          <TabsContent value="redes">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados por Rede</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Rede</TableHead><TableHead>Líder</TableHead>
                        <TableHead className="text-center">Coord.</TableHead><TableHead className="text-center">Células</TableHead>
                        <TableHead className="text-center">Membros</TableHead><TableHead className="text-center">Visit.</TableHead>
                        <TableHead className="text-center">Relatórios</TableHead><TableHead className="text-center">% Envio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byRede.map(r => (
                        <TableRow key={r.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.leaderCouple || '—'}</TableCell>
                          <TableCell className="text-center"><Badge variant="outline">{r.coordenacoesCount}</Badge></TableCell>
                          <TableCell className="text-center"><Badge variant="outline">{r.celulasCount}</Badge></TableCell>
                          <TableCell className="text-center">{r.membersCount}</TableCell>
                          <TableCell className="text-center">{r.visitors}</TableCell>
                          <TableCell className="text-center">{r.reportsCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={Number(r.submissionRate) >= 80 ? "default" : Number(r.submissionRate) >= 50 ? "secondary" : "destructive"}>
                              {r.submissionRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Coordenação */}
          <TabsContent value="coordenacoes">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados por Coordenação</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Coordenação</TableHead><TableHead>Rede</TableHead><TableHead>Coordenador</TableHead>
                        <TableHead className="text-center">Células</TableHead><TableHead className="text-center">Membros</TableHead>
                        <TableHead className="text-center">Visit.</TableHead><TableHead className="text-center">Relatórios</TableHead>
                        <TableHead className="text-center">% Envio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byCoordenacao.map(c => (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.redeName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.leaderCouple || '—'}</TableCell>
                          <TableCell className="text-center"><Badge variant="outline">{c.celulasCount}</Badge></TableCell>
                          <TableCell className="text-center">{c.membersCount}</TableCell>
                          <TableCell className="text-center">{c.visitors}</TableCell>
                          <TableCell className="text-center">{c.reportsCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={Number(c.submissionRate) >= 80 ? "default" : Number(c.submissionRate) >= 50 ? "secondary" : "destructive"}>
                              {c.submissionRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Célula */}
          <TabsContent value="celulas">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados por Célula</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Célula</TableHead><TableHead>Coordenação</TableHead><TableHead>Líderes</TableHead>
                        <TableHead className="text-center">Membros</TableHead><TableHead className="text-center">Visit.</TableHead>
                        <TableHead className="text-center">Relatórios</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byCelula.map(c => (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.coordenacaoName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.leaderCouple || '—'}</TableCell>
                          <TableCell className="text-center">{c.membersCount}</TableCell>
                          <TableCell className="text-center">{c.visitors}</TableCell>
                          <TableCell className="text-center">{c.reportsCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Líder */}
          <TabsContent value="lideres">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados por Líder</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Casal Líder</TableHead><TableHead>Célula</TableHead>
                        <TableHead className="text-center">Relatórios</TableHead><TableHead className="text-center">Méd. Visit.</TableHead>
                        <TableHead className="text-center">Membros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byLider.map(l => (
                        <TableRow key={l.coupleId} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{l.coupleName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.celulaName}</TableCell>
                          <TableCell className="text-center">{l.reportsCount}</TableCell>
                          <TableCell className="text-center">{l.avgVisitors}</TableCell>
                          <TableCell className="text-center">{l.totalMembers}</TableCell>
                        </TableRow>
                      ))}
                      {byLider.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum líder com célula vinculada</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relatórios Detalhados</CardTitle>
                <CardDescription>{filteredReports.length} relatório(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Data</TableHead><TableHead>Célula</TableHead>
                        <TableHead className="text-center">Membros</TableHead><TableHead className="text-center">Visit.</TableHead>
                        <TableHead className="text-center">Crianças</TableHead><TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.slice(0, 50).map(r => (
                        <TableRow key={r.id} className="hover:bg-muted/30">
                          <TableCell className="text-sm">
                            {r.meeting_date ? format(parseISO(r.meeting_date), 'dd/MM/yyyy', { locale: ptBR }) : format(parseISO(r.week_start), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{r.celula?.name || '—'}</TableCell>
                          <TableCell className="text-center">{r.members_present}</TableCell>
                          <TableCell className="text-center">{r.visitors}</TableCell>
                          <TableCell className="text-center">{r.children}</TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{r.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {filteredReports.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum relatório no período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multiplicações */}
          <TabsContent value="multiplicacoes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Multiplicações no Período</CardTitle>
                <CardDescription>{filteredMultiplicacoes.length} multiplicação(ões)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Data</TableHead><TableHead>Célula Origem</TableHead>
                        <TableHead>Célula Destino</TableHead><TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMultiplicacoes.map(m => (
                        <TableRow key={m.id} className="hover:bg-muted/30">
                          <TableCell>{format(parseISO(m.data_multiplicacao), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                          <TableCell className="font-medium">{m.celula_origem?.name || '—'}</TableCell>
                          <TableCell className="font-medium">{m.celula_destino?.name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {filteredMultiplicacoes.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma multiplicação no período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />Ranking de Membros
                </CardTitle>
                <CardDescription>Pontuação: tempo de igreja (1 pt/mês) + marcos espirituais (10 pts cada)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">#</TableHead><TableHead>Nome</TableHead><TableHead>Célula</TableHead>
                        <TableHead className="text-center">Meses</TableHead><TableHead>Marcos</TableHead>
                        <TableHead className="text-center">Pontuação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.slice(0, 100).map((r, i) => (
                        <TableRow key={r.memberId} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-muted-foreground">
                            {i < 3 ? <span className="text-lg">{medalEmojis[i]}</span> : i + 1}
                          </TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.celulaName}</TableCell>
                          <TableCell className="text-center">{r.monthsInChurch}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(r.milestones).map(([key, val]) =>
                                val ? (<Badge key={key} variant="secondary" className="text-xs">{milestoneLabels[key]}</Badge>) : null
                              )}
                              {r.milestonesCount === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center"><Badge>{r.totalScore}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {ranking.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum membro encontrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
