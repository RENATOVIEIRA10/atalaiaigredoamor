import { useState } from 'react';
import { useCampos, Campo } from '@/hooks/useCampos';
import { useCampoPastores, useAddCampoPastor, useRemoveCampoPastor } from '@/hooks/useCampoPastores';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Plus, Trash2, UserPlus, X, Loader2, Church, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function CamposManager() {
  const { data: campos = [], isLoading } = useCampos();
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampo, setEditingCampo] = useState<Campo | null>(null);
  const [form, setForm] = useState({ nome: '', cidade: '', estado: '', endereco: '', horarios_culto: '' });
  const [saving, setSaving] = useState(false);

  // Pastor assignment
  const [pastorDialogCampoId, setPastorDialogCampoId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('pastor_de_campo');
  const { data: campoPastores = [] } = useCampoPastores(pastorDialogCampoId);
  const addPastor = useAddCampoPastor();
  const removePastor = useRemoveCampoPastor();

  const openCreate = () => {
    setEditingCampo(null);
    setForm({ nome: '', cidade: '', estado: '', endereco: '', horarios_culto: '' });
    setDialogOpen(true);
  };

  const openEdit = (campo: Campo) => {
    setEditingCampo(campo);
    setForm({
      nome: campo.nome,
      cidade: campo.cidade || '',
      estado: campo.estado || '',
      endereco: campo.endereco || '',
      horarios_culto: campo.horarios_culto || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      if (editingCampo) {
        const { error } = await supabase.from('campos').update({
          nome: form.nome.trim(),
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          endereco: form.endereco.trim() || null,
          horarios_culto: form.horarios_culto.trim() || null,
        }).eq('id', editingCampo.id);
        if (error) throw error;
        toast({ title: 'Campo atualizado' });
      } else {
        const { error } = await supabase.from('campos').insert({
          nome: form.nome.trim(),
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          endereco: form.endereco.trim() || null,
          horarios_culto: form.horarios_culto.trim() || null,
        });
        if (error) throw error;
        toast({ title: 'Campo criado' });
      }
      qc.invalidateQueries({ queryKey: ['campos'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campo: Campo) => {
    try {
      const { error } = await supabase.from('campos').update({ ativo: false }).eq('id', campo.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['campos'] });
      toast({ title: 'Campo desativado' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddPastor = async () => {
    if (!pastorDialogCampoId || !selectedProfileId) return;
    try {
      await addPastor.mutateAsync({ campo_id: pastorDialogCampoId, profile_id: selectedProfileId, tipo: selectedTipo });
      setSelectedProfileId('');
      toast({ title: 'Pastor vinculado ao campo' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemovePastor = async (id: string) => {
    try {
      await removePastor.mutateAsync(id);
      toast({ title: 'Pastor desvinculado' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // Filter profiles not already assigned to this campo
  const assignedProfileIds = new Set(campoPastores.map(p => p.profile_id));
  const availableProfiles = profiles.filter(p => !assignedProfileIds.has(p.id));

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Campos (Unidades)</h2>
          <p className="text-sm text-muted-foreground">Gerencie os campos/unidades da igreja e seus pastores.</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Campo
        </Button>
      </div>

      <div className="grid gap-3">
        {campos.map(campo => {
          return (
            <Card key={campo.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Church className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{campo.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {[campo.cidade, campo.estado].filter(Boolean).join(' – ') || 'Sem localização'}
                      </p>
                      {campo.endereco && <p className="text-xs text-muted-foreground truncate">{campo.endereco}</p>}
                      {campo.horarios_culto && (
                        <p className="text-xs text-muted-foreground mt-0.5">🕐 {campo.horarios_culto}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPastorDialogCampoId(campo.id)} title="Pastores">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(campo)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Desativar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desativar campo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O campo "{campo.nome}" será desativado. Os dados não serão perdidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(campo)}>Desativar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {campos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum campo cadastrado.</p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCampo ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Paulista (Sede)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Paulista" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="PE" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número, bairro" />
            </div>
            <div className="space-y-2">
              <Label>Horários de Culto</Label>
              <Input value={form.horarios_culto} onChange={e => setForm(f => ({ ...f, horarios_culto: e.target.value }))} placeholder="Dom 9h, 18h | Qua 19h30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingCampo ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pastor Assignment Dialog */}
      <Dialog open={!!pastorDialogCampoId} onOpenChange={open => { if (!open) setPastorDialogCampoId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pastores do Campo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current pastors */}
            {campoPastores.length > 0 ? (
              <div className="space-y-2">
                {campoPastores.map(cp => (
                  <div key={cp.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={cp.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{cp.profile?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cp.profile?.name || 'Sem nome'}</p>
                      <Badge variant="secondary" className="text-[10px]">{cp.tipo === 'pastor_senior_global' ? 'Pastor Sênior' : 'Pastor de Campo'}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemovePastor(cp.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum pastor vinculado.</p>
            )}

            {/* Add pastor */}
            <div className="border-t pt-3 space-y-3">
              <Label className="text-xs font-medium">Vincular Pastor</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pastor_de_campo">Pastor de Campo</SelectItem>
                  <SelectItem value="pastor_senior_global">Pastor Sênior Global</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAddPastor} disabled={!selectedProfileId || addPastor.isPending} className="w-full">
                {addPastor.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                <UserPlus className="h-4 w-4 mr-1" />
                Vincular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
