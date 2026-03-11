import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinContasReceber, useFinContaReceberMutations } from '@/hooks/useFinanceiro';
import { ContaReceberFormDialog } from '@/components/financeiro/ContaReceberFormDialog';
import { ImportFinanceiroDialog } from '@/components/financeiro/ImportFinanceiroDialog';
import { Plus, Search, CheckCircle, Trash2, Edit, ArrowUpRight, Copy, RefreshCw, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDemoScope } from '@/hooks/useDemoScope';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const statusConfig: Record<string, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'bg-warning/10 text-warning border-warning/20' },
  recebido: { label: 'Recebido', class: 'bg-vida/10 text-vida border-vida/20' },
  atrasado: { label: 'Atrasado', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function ContasReceber() {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [periodoFrom, setPeriodoFrom] = useState('');
  const [periodoTo, setPeriodoTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { campoId } = useDemoScope();
  const queryClient = useQueryClient();

  const periodo = periodoFrom && periodoTo ? { from: periodoFrom, to: periodoTo } : undefined;
  const { data: contas, isLoading } = useFinContasReceber({ status: statusFilter, periodo });
  const { markReceived, duplicate, remove } = useFinContaReceberMutations();

  const today = new Date().toISOString().split('T')[0];
  const filtered = useMemo(() => {
    return (contas || [])
      .filter((c) => c.descricao.toLowerCase().includes(search.toLowerCase()) || c.origem?.toLowerCase().includes(search.toLowerCase()))
      .map((c) => ({ ...c, displayStatus: c.status === 'pendente' && c.data_prevista < today ? 'atrasado' : c.status }));
  }, [contas, search, today]);

  const summaryTotal = filtered.reduce((s, c) => s + Number(c.valor), 0);
  const summaryPending = filtered.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);

  return (
    <AppLayout title="Contas a Receber">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1" /> Importar
              </Button>
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Novo Recebível
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground shrink-0">Período:</span>
            <Input type="date" value={periodoFrom} onChange={(e) => setPeriodoFrom(e.target.value)} className="w-36 h-8 text-xs" />
            <span className="text-xs text-muted-foreground">a</span>
            <Input type="date" value={periodoTo} onChange={(e) => setPeriodoTo(e.target.value)} className="w-36 h-8 text-xs" />
            {(periodoFrom || periodoTo) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setPeriodoFrom(''); setPeriodoTo(''); }}>Limpar</Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArrowUpRight className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum recebível encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Descrição</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Data Prevista</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => {
                        const sc = statusConfig[c.displayStatus] || statusConfig.pendente;
                        return (
                          <TableRow key={c.id} className="group">
                            <TableCell className="font-medium max-w-[180px] truncate">
                              {c.descricao}
                              {c.recorrencia && (
                                <span title={`Recorrente: ${c.recorrencia}`}><RefreshCw className="inline h-3 w-3 ml-1 text-primary opacity-60" /></span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{c.origem || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{c.categoria?.nome || '—'}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{formatBRL(c.valor)}</TableCell>
                            <TableCell>{new Date(c.data_prevista).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px]', sc.class)}>{sc.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {c.status !== 'recebido' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markReceived.mutate(c.id)} title="Marcar recebido">
                                    <CheckCircle className="h-3.5 w-3.5 text-vida" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate.mutate(c)} title="Duplicar">
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setDialogOpen(true); }} title="Editar">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove.mutate(c.id)} title="Excluir">
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs">
                  <span className="text-muted-foreground">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">Pendente: <span className="font-semibold text-foreground">{formatBRL(summaryPending)}</span></span>
                    <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatBRL(summaryTotal)}</span></span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <ContaReceberFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
      {campoId && (
        <ImportFinanceiroDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          tipo="receber"
          campoId={campoId}
          onImported={() => {
            queryClient.invalidateQueries({ queryKey: ['fin_contas_receber'] });
            queryClient.invalidateQueries({ queryKey: ['fin_dashboard_kpis'] });
          }}
        />
      )}
    </AppLayout>
  );
}
