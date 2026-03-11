import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFinFornecedores, useFinFornecedorMutations } from '@/hooks/useFinanceiro';
import { useCampos } from '@/hooks/useCampos';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Fornecedores() {
  const { data: fornecedores, isLoading } = useFinFornecedores();
  const { data: campos } = useCampos();
  const { create, update, remove } = useFinFornecedorMutations();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', categoria: '', cidade: '', observacoes: '', campo_id: '_none_' });

  const filtered = (fornecedores || []).filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase()) || f.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({ nome: '', telefone: '', email: '', categoria: '', cidade: '', observacoes: '', campo_id: '_none_' }); setDialogOpen(true); };
  const openEdit = (f: any) => {
    setEditing(f);
    setForm({ nome: f.nome, telefone: f.telefone || '', email: f.email || '', categoria: f.categoria || '', cidade: f.cidade || '', observacoes: f.observacoes || '', campo_id: f.campo_id || '_none_' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      nome: form.nome,
      telefone: form.telefone || null,
      email: form.email || null,
      categoria: form.categoria || null,
      cidade: form.cidade || null,
      observacoes: form.observacoes || null,
      campo_id: form.campo_id && form.campo_id !== '_none_' ? form.campo_id : null,
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <AppLayout title="Fornecedores">
      <div className="space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Fornecedor</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Building2 className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum fornecedor cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((f) => (
                      <TableRow key={f.id} className="group">
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{f.categoria || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{f.telefone || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{f.cidade || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove.mutate(f.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Gráfica, Alimentação" /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
            </div>
            <div>
              <Label>Campus</Label>
              <Select value={form.campo_id} onValueChange={(v) => setForm({ ...form, campo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum (global)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhum</SelectItem>
                  {(campos || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
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
