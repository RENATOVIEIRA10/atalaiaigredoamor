import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFinCentrosCusto, useFinCentroCustoMutations } from '@/hooks/useFinanceiro';
import { useCampos } from '@/hooks/useCampos';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CentrosCusto() {
  const { data: centros, isLoading } = useFinCentrosCusto();
  const { data: campos } = useCampos();
  const { create, update } = useFinCentroCustoMutations();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', campo_id: '_none_' });

  const filtered = (centros || []).filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setForm({ nome: '', descricao: '', campo_id: '' }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ nome: c.nome, descricao: c.descricao || '', campo_id: c.campo_id || '' }); setDialogOpen(true); };

  const handleSave = () => {
    const payload = { nome: form.nome, descricao: form.descricao || null, campo_id: form.campo_id || null };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <AppLayout title="Centros de Custo">
      <div className="space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Centro</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum centro de custo</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="group">
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.descricao || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{(campos || []).find((ca: any) => ca.id === c.campo_id)?.nome || 'Global'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(c)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Campus</Label>
              <Select value={form.campo_id} onValueChange={(v) => setForm({ ...form, campo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Global (todos)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global</SelectItem>
                  {(campos || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome || create.isPending || update.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
