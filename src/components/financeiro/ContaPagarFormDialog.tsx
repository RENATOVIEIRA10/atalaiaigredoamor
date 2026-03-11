import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinCategorias, useFinFornecedores, useFinCentrosCusto, useFinContaPagarMutations, RECORRENCIA_OPTIONS } from '@/hooks/useFinanceiro';
import { useCampos } from '@/hooks/useCampos';
import { useDemoScope } from '@/hooks/useDemoScope';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any;
}

export function ContaPagarFormDialog({ open, onOpenChange, editing }: Props) {
  const { campoId } = useDemoScope();
  const { data: categorias } = useFinCategorias();
  const { data: fornecedores } = useFinFornecedores();
  const { data: centros } = useFinCentrosCusto();
  const { data: campos } = useCampos();
  const { create, update } = useFinContaPagarMutations();

  const [form, setForm] = useState({
    descricao: '', valor: '', data_vencimento: '', categoria_id: '_none_', fornecedor_id: '_none_',
    centro_custo_id: '_none_', campo_id: '', observacoes: '', recorrencia: '_none_', recorrencia_fim: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        descricao: editing.descricao,
        valor: String(editing.valor),
        data_vencimento: editing.data_vencimento,
        categoria_id: editing.categoria_id || '_none_',
        fornecedor_id: editing.fornecedor_id || '_none_',
        centro_custo_id: editing.centro_custo_id || '_none_',
        campo_id: editing.campo_id || '',
        observacoes: editing.observacoes || '',
        recorrencia: editing.recorrencia || '_none_',
        recorrencia_fim: editing.recorrencia_fim || '',
      });
    } else {
      setForm({
        descricao: '', valor: '', data_vencimento: '', categoria_id: '_none_', fornecedor_id: '_none_',
        centro_custo_id: '_none_', campo_id: campoId || '', observacoes: '', recorrencia: '_none_', recorrencia_fim: '',
      });
    }
  }, [editing, open, campoId]);

  const val = (v: string) => v && v !== '_none_' ? v : null;

  const handleSave = () => {
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor) || 0,
      data_vencimento: form.data_vencimento,
      categoria_id: val(form.categoria_id),
      fornecedor_id: val(form.fornecedor_id),
      centro_custo_id: val(form.centro_custo_id),
      campo_id: form.campo_id,
      observacoes: form.observacoes || null,
      recorrencia: val(form.recorrencia),
      recorrencia_fim: form.recorrencia_fim || null,
    };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload as any, { onSuccess: () => onOpenChange(false) });
    }
  };

  const cats = (categorias || []).filter((c) => c.tipo === 'despesa' || c.tipo === 'ambos');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Descrição *</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
            <div><Label>Vencimento *</Label><Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhuma</SelectItem>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.fornecedor_id} onValueChange={(v) => setForm({ ...form, fornecedor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhum</SelectItem>
                  {(fornecedores || []).map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Centro de Custo</Label>
              <Select value={form.centro_custo_id} onValueChange={(v) => setForm({ ...form, centro_custo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhum</SelectItem>
                  {(centros || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campus *</Label>
              <Select value={form.campo_id} onValueChange={(v) => setForm({ ...form, campo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(campos || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Recorrência</Label>
              <Select value={form.recorrencia} onValueChange={(v) => setForm({ ...form, recorrencia: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhuma</SelectItem>
                  {RECORRENCIA_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.recorrencia && form.recorrencia !== '_none_' && (
              <div>
                <Label>Recorrência até</Label>
                <Input type="date" value={form.recorrencia_fim} onChange={(e) => setForm({ ...form, recorrencia_fim: e.target.value })} placeholder="Sem limite" />
              </div>
            )}
          </div>
          <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.descricao || !form.valor || !form.data_vencimento || !form.campo_id || create.isPending || update.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
