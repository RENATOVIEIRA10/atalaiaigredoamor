import { useState } from 'react';
import { useWeeklyReports } from '@/hooks/useWeeklyReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Users, GraduationCap, BookOpen, UserPlus, Baby, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDataRealizacao, formatWeekLabelOperacional } from '@/lib/weekUtils';

export function WeeklyReportsHistory() {
  const { data: reports, isLoading } = useWeeklyReports();
  const [filterWeek, setFilterWeek] = useState<string>('all');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Get unique week_starts for filter — derived from meeting_date (source of truth)
  const uniqueWeeks = [...new Set(reports?.map(r => r.week_start) || [])].sort().reverse();

  const filteredReports = filterWeek === 'all'
    ? reports
    : reports?.filter(r => r.week_start === filterWeek);

  // Calculate totals
  const totals = filteredReports?.reduce(
    (acc, report) => ({
      members_present: acc.members_present + report.members_present,
      leaders_in_training: acc.leaders_in_training + report.leaders_in_training,
      discipleships: acc.discipleships + report.discipleships,
      visitors: acc.visitors + report.visitors,
      children: acc.children + report.children,
    }),
    { members_present: 0, leaders_in_training: 0, discipleships: 0, visitors: 0, children: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Relatórios Semanais
            </CardTitle>
            <CardDescription>
              Relatórios ordenados por data de realização da célula
            </CardDescription>
          </div>
          <Select value={filterWeek} onValueChange={setFilterWeek}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filtrar por semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as semanas</SelectItem>
              {uniqueWeeks.map((week) => (
                <SelectItem key={week} value={week}>
                  {formatWeekLabelOperacional(week).replace('Semana (Seg→Sáb): ', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        {totals && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Membros</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{totals.members_present}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-purple-700">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm font-medium">Líderes</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{totals.leaders_in_training}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Discipulados</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{totals.discipleships}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm font-medium">Visitantes</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{totals.visitors}</p>
              </CardContent>
            </Card>
            <Card className="bg-pink-50 border-pink-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-pink-700">
                  <Baby className="h-4 w-4" />
                  <span className="text-sm font-medium">Crianças</span>
                </div>
                <p className="text-2xl font-bold text-pink-900">{totals.children}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Table */}
        {filteredReports && filteredReports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Semana
                  </div>
                </TableHead>
                <TableHead>Célula</TableHead>
                <TableHead>Coordenação</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    Membros
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Líderes
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Discipulados
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <UserPlus className="h-4 w-4" />
                    Visitantes
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Baby className="h-4 w-4" />
                    Crianças
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const reportDate = report.meeting_date || report.week_start;
                return (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Badge variant="outline" className="font-medium">
                        {formatDataRealizacao(reportDate)}
                      </Badge>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {formatWeekLabelOperacional(reportDate)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {report.celula?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {report.celula?.coordenacao?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{report.members_present}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{report.leaders_in_training}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{report.discipleships}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{report.visitors}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{report.children}</Badge>
                  </TableCell>
                </TableRow>
                );
              })}

            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum relatório encontrado para o período selecionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
