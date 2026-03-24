import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Image as ImageIcon, Users, GraduationCap, BookOpen, UserPlus, Baby, Calendar } from 'lucide-react';
import { WeeklyReport } from '@/hooks/useWeeklyReports';
import { ReportEditDialog } from './ReportEditDialog';
import { ReportDeleteDialog } from './ReportDeleteDialog';
import { formatDataRealizacao, formatWeekLabelOperacional } from '@/lib/weekUtils';

interface ReportsHistoryTableProps {
  reports: WeeklyReport[];
  onEdit: (data: {
    id: string;
    members_present: number;
    leaders_in_training: number;
    discipleships: number;
    visitors: number;
    children: number;
    notes: string | null;
  }) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  showCelulaColumn?: boolean;
  showCoordenacaoColumn?: boolean;
}

export function ReportsHistoryTable({
  reports,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting,
  showCelulaColumn = true,
  showCoordenacaoColumn = true,
}: ReportsHistoryTableProps) {
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<WeeklyReport | null>(null);

  const handleEdit = (data: Parameters<typeof onEdit>[0]) => {
    onEdit(data);
    setEditingReport(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum relatório encontrado para o período selecionado.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data
              </div>
            </TableHead>
            {showCelulaColumn && <TableHead>Célula</TableHead>}
            {showCoordenacaoColumn && <TableHead>Coordenação</TableHead>}
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
                Disc.
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <UserPlus className="h-4 w-4" />
                Vis.
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Baby className="h-4 w-4" />
                Crianças
              </div>
            </TableHead>
            <TableHead className="text-center">Foto</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
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
                {showCelulaColumn && (
                  <TableCell className="font-medium">
                    {report.celula?.name || 'N/A'}
                  </TableCell>
                )}
                {showCoordenacaoColumn && (
                  <TableCell>
                    {report.celula?.coordenacao?.name || 'N/A'}
                  </TableCell>
                )}
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
                <TableCell className="text-center">
                  {report.photo_url ? (
                    <a href={report.photo_url} target="_blank" rel="noopener noreferrer">
                      <ImageIcon className="h-4 w-4 text-primary hover:text-primary/80 mx-auto" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingReport(report)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingReport(report)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ReportEditDialog
        open={!!editingReport}
        onOpenChange={(open) => !open && setEditingReport(null)}
        report={editingReport}
        onSave={handleEdit}
        isLoading={isUpdating}
      />

      <ReportDeleteDialog
        open={!!deletingReport}
        onOpenChange={(open) => !open && setDeletingReport(null)}
        report={deletingReport}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
