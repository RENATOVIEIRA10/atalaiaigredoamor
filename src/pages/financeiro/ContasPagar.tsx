import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinContasPagar, useFinContaPagarMutations } from '@/hooks/useFinanceiro';
import { ContaPagarFormDialog } from '@/components/financeiro/ContaPagarFormDialog';
import { ImportFinanceiroDialog } from '@/components/financeiro/ImportFinanceiroDialog';
import { Plus, Search, CheckCircle, Trash2, Edit, AlertTriangle, Receipt, Copy, RefreshCw, CheckCheck, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDemoScope } from '@/hooks/useDemoScope';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const statusConfig: Record<string, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'bg-warning/10 text-warning border-warning/20' },
  pago: { label: 'Pago', class: 'bg-vida/10 text-vida border-vida/20' },
  vencido: { label: 'Vencido', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function ContasPagar() {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [periodoFrom, setPeriodoFrom] = useState('');
  const [periodoTo, setPeriodoTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const { campoId } = useDemoScope();
  const queryClient = useQueryClient();

  const periodo = periodoFrom && periodoTo ? { from: periodoFrom, to: periodoTo } : undefined;
  const { data: contas, isLoading } = useFinContasPagar({ status: statusFilter, periodo });
  const { markPaid, batchMarkPaid, duplicate, remove } = useFinContaPagarMutations();

  const today = new Date().toISOString().split('T')[0];

  const withStatus = useMemo(() => {
    const filtered = (contas || []).filter((c) =>
      c.descricao.toLowerCase().includes(search.toLowerCase()) ||
      c.fornecedor?.nome?.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.map((c) => ({
      ...c,
      displayStatus: c.status === 'pendente' && c.data_vencimento < today ? 'vencido' : c.status,
    }));
  }, [contas, search, today]);

  const pendingItems = withStatus.filter(c => c.status === 'pendente');
  const summaryTotal = withStatus.reduce((s, c) => s + Number(c.valor), 0);
  const summaryPending = pendingItems.reduce((s, c) => s + Number(c.valor), 0);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === pendingItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingItems.map(c => c.id)));
    }
  };

  const handleBatchPay = () => {
    if (selected.size === 0) return;
    batchMarkPaid.mutate(Array.from(selected), { onSuccess: () => setSelected(new Set()) });
  };

  return (
    <AppLayout title="Contas a Pagar">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar descrição ou fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <Button variant="outline" size="sm" onClick={handleBatchPay} disabled={batchMarkPaid.isPending}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Pagar {selected.size}
                </Button>
              )}
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1" /> Importar
              </Button>
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Nova Conta
              </Button>
            </div>
          </div>
          {/* Period filter */}
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : withStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Receipt className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhuma conta encontrada</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-10">
                          <Checkbox checked={selected.size > 0 && selected.size === pendingItems.length} onCheckedChange={toggleAll} />
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withStatus.map((c) => {
                        const sc = statusConfig[c.displayStatus] || statusConfig.pendente;
                        return (
                          <TableRow key={c.id} className="group">
                            <TableCell>
                              {c.status === 'pendente' && (
                                <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                              )}
                            </TableCell>
                            <TableCell className="font-medium max-w-[180px] truncate">
                              {c.descricao}
                              {c.recorrencia && (
                                <span title={`Recorrente: ${c.recorrencia}`}><RefreshCw className="inline h-3 w-3 ml-1 text-primary opacity-60" /></span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{c.fornecedor?.nome || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{c.categoria?.nome || '—'}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{formatBRL(c.valor)}</TableCell>
                            <TableCell>{new Date(c.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px]', sc.class)}>
                                {c.displayStatus === 'vencido' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {c.status !== 'pago' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markPaid.mutate(c.id)} title="Marcar como pago">
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
                {/* Summary footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs">
                  <span className="text-muted-foreground">{withStatus.length} registro{withStatus.length !== 1 ? 's' : ''}</span>
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

      <ContaPagarFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
      {campoId && (
        <ImportFinanceiroDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          tipo="pagar"
          campoId={campoId}
          onImported={() => {
            queryClient.invalidateQueries({ queryKey: ['fin_contas_pagar'] });
            queryClient.invalidateQueries({ queryKey: ['fin_dashboard_kpis'] });
            queryClient.invalidateQueries({ queryKey: ['fin_analytics'] });
          }}
        />
      )}
    </AppLayout>
  );
}
