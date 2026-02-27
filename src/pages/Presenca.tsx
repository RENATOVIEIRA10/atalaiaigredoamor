import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Users, UserCheck, Heart, UserPlus, Baby, Search, Database, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';
import { useWeeklyReports } from '@/hooks/useWeeklyReports';
import { useCelulas } from '@/hooks/useCelulas';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportToExcel } from '@/utils/exportReports';

type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months';

export default function Presenca() {
  const { isCelulaLeader, isSupervisor, isCoordenador, isRedeLeader, isAdmin, isPastor } = useRole();
  const [selectedCelula, setSelectedCelula] = useState<string>('all');
  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: celulas } = useCelulas();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: allReports, isLoading } = useWeeklyReports();


  // Filter celulas by coordenacao
  
  // Filter celulas by coordenacao
  const filteredCelulas = useMemo(() => {
    if (!celulas) return [];
    if (selectedCoordenacao === 'all') return celulas;
    return celulas.filter(c => c.coordenacao_id === selectedCoordenacao);
  }, [celulas, selectedCoordenacao]);
  
  // Filter reports
  const filteredReports = useMemo(() => {
    if (!allReports) return [];
    
    let reports = [...allReports];
    
    // Filter by coordenacao (through celula)
    if (selectedCoordenacao !== 'all') {
      const celulaIds = filteredCelulas.map(c => c.id);
      reports = reports.filter(r => celulaIds.includes(r.celula_id));
    }
    
    // Filter by celula
    if (selectedCelula !== 'all') {
      reports = reports.filter(r => r.celula_id === selectedCelula);
    }
    
    // Filter by period
    const now = new Date();
    if (periodFilter === 'this_month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      reports = reports.filter(r => {
        const date = parseISO(r.week_start);
        return date >= start && date <= end;
      });
    } else if (periodFilter === 'last_month') {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      reports = reports.filter(r => {
        const date = parseISO(r.week_start);
        return date >= start && date <= end;
      });
    } else if (periodFilter === 'last_3_months') {
      const threeMonthsAgo = subMonths(now, 3);
      reports = reports.filter(r => {
        const date = parseISO(r.week_start);
        return date >= threeMonthsAgo;
      });
    }
    
    // Filter by search term (celula name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      reports = reports.filter(r => {
        const celula = celulas?.find(c => c.id === r.celula_id);
        return celula?.name.toLowerCase().includes(term);
      });
    }
    
    // Sort by date descending
    return reports.sort((a, b) => 
      new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
    );
  }, [allReports, selectedCelula, selectedCoordenacao, periodFilter, searchTerm, celulas, filteredCelulas]);
  
  // Calculate totals
  const totals = useMemo(() => {
    return filteredReports.reduce((acc, r) => ({
      members_present: acc.members_present + r.members_present,
      leaders_in_training: acc.leaders_in_training + r.leaders_in_training,
      discipleships: acc.discipleships + r.discipleships,
      visitors: acc.visitors + r.visitors,
      children: acc.children + r.children,
    }), {
      members_present: 0,
      leaders_in_training: 0,
      discipleships: 0,
      visitors: 0,
      children: 0,
    });
  }, [filteredReports]);

  // Cell leaders cannot access the general reports page
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;
  if (isCellLeaderOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  const getCelulaName = (celulaId: string) => {
    return celulas?.find(c => c.id === celulaId)?.name || 'Célula não encontrada';
  };
  
  const getCoordenacaoName = (celulaId: string) => {
    const celula = celulas?.find(c => c.id === celulaId);
    if (!celula) return '-';
    const coordenacao = coordenacoes?.find(co => co.id === celula.coordenacao_id);
    return coordenacao?.name || '-';
  };
  
  const statCards = [
    { icon: Users, label: 'Membros Presentes', value: totals.members_present, color: 'text-blue-600' },
    { icon: UserCheck, label: 'Líderes em Treinamento', value: totals.leaders_in_training, color: 'text-green-600' },
    { icon: Heart, label: 'Discipulados', value: totals.discipleships, color: 'text-red-600' },
    { icon: UserPlus, label: 'Visitantes', value: totals.visitors, color: 'text-purple-600' },
    { icon: Baby, label: 'Crianças', value: totals.children, color: 'text-orange-600' },
  ];

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'this_month':
        return format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
      case 'last_month':
        return format(subMonths(new Date(), 1), "MMMM 'de' yyyy", { locale: ptBR });
      case 'last_3_months':
        return 'Últimos 3 meses';
      default:
        return 'Todo o período';
    }
  };

  const handleExport = async () => {
    if (!celulas || !coordenacoes) return;
    
    await exportToExcel({
      reports: filteredReports,
      celulas,
      coordenacoes,
      periodLabel: getPeriodLabel(),
    });
  };
  
  return (
    <AppLayout title="Banco de Dados - Relatórios">
      <div className="space-y-6">
        {/* Header with description */}
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <p className="text-muted-foreground text-sm">
              Repositório consolidado de todos os relatórios semanais enviados pelos líderes de célula
            </p>
          </div>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Coordenação</label>
                <Select value={selectedCoordenacao} onValueChange={(value) => {
                  setSelectedCoordenacao(value);
                  setSelectedCelula('all'); // Reset celula when coordenacao changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as coordenações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as coordenações</SelectItem>
                    {coordenacoes?.map((coord) => (
                      <SelectItem key={coord.id} value={coord.id}>
                        {coord.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Célula</label>
                <Select value={selectedCelula} onValueChange={setSelectedCelula}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as células" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as células</SelectItem>
                    {filteredCelulas?.map((celula) => (
                      <SelectItem key={celula.id} value={celula.id}>
                        {celula.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Período</label>
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="this_month">Este mês</SelectItem>
                    <SelectItem value="last_month">Mês passado</SelectItem>
                    <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Buscar célula</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Relatórios ({filteredReports.length})
              </CardTitle>
              <Button 
                onClick={handleExport}
                disabled={filteredReports.length === 0 || isLoading}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum relatório encontrado com os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semana</TableHead>
                      <TableHead>Coordenação</TableHead>
                      <TableHead>Célula</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="hidden sm:inline">Membros</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UserCheck className="h-4 w-4" />
                          <span className="hidden sm:inline">Líderes</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span className="hidden sm:inline">Disc.</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UserPlus className="h-4 w-4" />
                          <span className="hidden sm:inline">Visitas</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Baby className="h-4 w-4" />
                          <span className="hidden sm:inline">Crianças</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(parseISO(report.week_start), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {getCoordenacaoName(report.celula_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCelulaName(report.celula_id)}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {report.members_present}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {report.leaders_in_training}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {report.discipleships}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {report.visitors}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {report.children}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
