import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinContasPagar, useFinContaPagarMutations } from '@/hooks/useFinanceiro';
import { ContaPagarFormDialog } from '@/components/financeiro/ContaPagarFormDialog';
import { Plus, Search, CheckCircle, Trash2, Edit, AlertTriangle, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: contas, isLoading } = useFinContasPagar({ status: statusFilter });
  const { markPaid, remove } = useFinContaPagarMutations();

  const filtered = (contas || []).filter((c) =>
    c.descricao.toLowerCase().includes(search.toLowerCase()) ||
    c.fornecedor?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-detect overdue
  const today = new Date().toISOString().split('T')[0];
  const withStatus = filtered.map((c) => ({
    ...c,
    displayStatus: c.status === 'pendente' && c.data_vencimento < today ? 'vencido' : c.status,
  }));

  return (
    <AppLayout title="Contas a Pagar">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            Nova Conta
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : withStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Receipt className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhuma conta encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
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
                          <TableCell className="font-medium max-w-[200px] truncate">{c.descricao}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>

      <ContaPagarFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </AppLayout>
  );
}
