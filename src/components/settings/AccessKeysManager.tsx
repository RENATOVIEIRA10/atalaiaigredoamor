import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { KeyRound, RefreshCw, Search, Shield, Copy, Power, Loader2, Plus, Trash2, AlertTriangle, Zap } from 'lucide-react';
import { useAccessKeys, useRegenerateAccessCode, useToggleAccessKey, AccessKey } from '@/hooks/useAccessKeys';
import { useCelulas } from '@/hooks/useCelulas';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useRedes } from '@/hooks/useRedes';
import { useSupervisores } from '@/hooks/useSupervisoes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const scopeLabels: Record<string, string> = {
  admin: 'Admin',
  rede: 'Rede',
  coordenacao: 'Coordenação',
  supervisor: 'Supervisor',
  celula: 'Célula',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'redeamor-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AccessKeysManager() {
  const { data: keys, isLoading } = useAccessKeys();
  const regenerate = useRegenerateAccessCode();
  const toggleKey = useToggleAccessKey();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createScopeType, setCreateScopeType] = useState('');
  const [createScopeId, setCreateScopeId] = useState('');
  const [createManualCode, setCreateManualCode] = useState('');
  const [createAutoCode, setCreateAutoCode] = useState(true);
  const [creating, setCreating] = useState(false);

  // Delete dialog
  const [deleteKey, setDeleteKey] = useState<AccessKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk generate
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Entity data
  const { data: celulas } = useCelulas();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: redes } = useRedes();
  const { data: supervisores } = useSupervisores();

  const filteredKeys = (keys || []).filter(k => {
    if (filterType !== 'all' && k.scope_type !== filterType) return false;
    if (filterStatus === 'active' && !k.active) return false;
    if (filterStatus === 'inactive' && k.active) return false;
    if (search) {
      const s = search.toLowerCase();
      return k.code.toLowerCase().includes(s) || 
             (k.entity_name || '').toLowerCase().includes(s) ||
             k.scope_type.toLowerCase().includes(s);
    }
    return true;
  });

  const adminKey = filteredKeys.find(k => k.scope_type === 'admin');
  const otherKeys = filteredKeys.filter(k => k.scope_type !== 'admin');

  // Pending items (entities without access codes)
  const activeKeys = keys || [];
  const pendingCelulas = (celulas || []).filter(c => !activeKeys.some(k => k.scope_type === 'celula' && k.scope_id === c.id && k.active));
  const pendingSupervisores = (supervisores || []).filter(s => !activeKeys.some(k => k.scope_type === 'supervisor' && k.scope_id === s.id && k.active));
  const pendingCoordenacoes = (coordenacoes || []).filter(c => !activeKeys.some(k => k.scope_type === 'coordenacao' && k.scope_id === c.id && k.active));
  const pendingRedes = (redes || []).filter(r => !activeKeys.some(k => k.scope_type === 'rede' && k.scope_id === r.id && k.active));
  const totalPending = pendingCelulas.length + pendingSupervisores.length + pendingCoordenacoes.length + pendingRedes.length;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Código copiado!' });
  };

  const getEntityOptions = () => {
    if (createScopeType === 'celula') return (celulas || []).map(c => ({ id: c.id, name: c.name }));
    if (createScopeType === 'supervisor') return (supervisores || []).map(s => {
      const lc = s.leadership_couple as any;
      const coupleName = lc ? `${lc.spouse1?.name || ''} & ${lc.spouse2?.name || ''}` : s.profile?.name || 'Supervisor';
      return { id: s.id, name: coupleName };
    });
    if (createScopeType === 'coordenacao') return (coordenacoes || []).map(c => ({ id: c.id, name: c.name }));
    if (createScopeType === 'rede') return (redes || []).map(r => ({ id: r.id, name: r.name }));
    return [];
  };

  const handleCreate = async () => {
    if (!createScopeType || !createScopeId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    const code = createAutoCode ? generateCode() : createManualCode.trim();
    if (!code) {
      toast({ title: 'Informe o código', variant: 'destructive' });
      return;
    }
    // Check duplicate code
    const existing = activeKeys.find(k => k.code === code && k.active);
    if (existing) {
      toast({ title: 'Código já existe', description: 'Escolha outro código.', variant: 'destructive' });
      return;
    }
    // Check existing active key for same scope
    const existingScope = activeKeys.find(k => k.scope_type === createScopeType && k.scope_id === createScopeId && k.active);
    if (existingScope) {
      // Deactivate old
      await supabase.from('access_keys').update({ active: false }).eq('id', existingScope.id);
    }
    setCreating(true);
    const { error } = await supabase.from('access_keys').insert({ scope_type: createScopeType, scope_id: createScopeId, code, active: true });
    setCreating(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['access_keys'] });
    toast({ title: 'Código criado!', description: `Código: ${code}` });
    setCreateOpen(false);
    setCreateScopeType('');
    setCreateScopeId('');
    setCreateManualCode('');
    setCreateAutoCode(true);
  };

  const handleDelete = async () => {
    if (!deleteKey) return;
    setDeleting(true);
    await supabase.from('access_keys').delete().eq('id', deleteKey.id);
    setDeleting(false);
    queryClient.invalidateQueries({ queryKey: ['access_keys'] });
    toast({ title: 'Código removido!' });
    setDeleteKey(null);
  };

  const handleGenerateForItem = async (scopeType: string, scopeId: string) => {
    const code = generateCode();
    const { error } = await supabase.from('access_keys').insert({ scope_type: scopeType, scope_id: scopeId, code, active: true });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    queryClient.invalidateQueries({ queryKey: ['access_keys'] });
    toast({ title: 'Código gerado!', description: `Código: ${code}` });
  };

  const handleBulkGenerate = async (type: string, items: { id: string }[]) => {
    setBulkGenerating(true);
    for (const item of items) {
      const code = generateCode();
      await supabase.from('access_keys').insert({ scope_type: type, scope_id: item.id, code, active: true });
    }
    setBulkGenerating(false);
    queryClient.invalidateQueries({ queryKey: ['access_keys'] });
    toast({ title: `${items.length} código(s) gerado(s)!` });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Admin Key */}
      {adminKey && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Código Admin (fixo)</CardTitle>
            </div>
            <CardDescription>Este código dá acesso total ao sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono font-bold tracking-wider">{adminKey.code}</code>
              <Button variant="ghost" size="icon" onClick={() => copyCode(adminKey.code)}><Copy className="h-4 w-4" /></Button>
              <Badge variant={adminKey.active ? 'default' : 'secondary'}>{adminKey.active ? 'Ativo' : 'Inativo'}</Badge>
              {adminKey.last_used_at && <span className="text-xs text-muted-foreground">Último uso: {new Date(adminKey.last_used_at).toLocaleDateString('pt-BR')}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Items */}
      {totalPending > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">Pendências de Código ({totalPending})</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingCelulas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Células sem código ({pendingCelulas.length})</span>
                  <Button size="sm" variant="outline" disabled={bulkGenerating} onClick={() => handleBulkGenerate('celula', pendingCelulas)}>
                    <Zap className="h-3 w-3 mr-1" />Gerar para todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingCelulas.slice(0, 10).map(c => (
                    <Badge key={c.id} variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => handleGenerateForItem('celula', c.id)}>
                      {c.name} <Plus className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  {pendingCelulas.length > 10 && <Badge variant="secondary">+{pendingCelulas.length - 10} mais</Badge>}
                </div>
              </div>
            )}
            {pendingSupervisores.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Supervisores sem código ({pendingSupervisores.length})</span>
                  <Button size="sm" variant="outline" disabled={bulkGenerating} onClick={() => handleBulkGenerate('supervisor', pendingSupervisores)}>
                    <Zap className="h-3 w-3 mr-1" />Gerar para todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingSupervisores.map(s => {
                    const lc = s.leadership_couple as any;
                    const name = lc ? `${lc.spouse1?.name || ''} & ${lc.spouse2?.name || ''}` : s.profile?.name || 'Supervisor';
                    return (
                      <Badge key={s.id} variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => handleGenerateForItem('supervisor', s.id)}>
                        {name} <Plus className="h-3 w-3 ml-1" />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {pendingCoordenacoes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Coordenações sem código ({pendingCoordenacoes.length})</span>
                  <Button size="sm" variant="outline" disabled={bulkGenerating} onClick={() => handleBulkGenerate('coordenacao', pendingCoordenacoes)}>
                    <Zap className="h-3 w-3 mr-1" />Gerar para todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingCoordenacoes.map(c => (
                    <Badge key={c.id} variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => handleGenerateForItem('coordenacao', c.id)}>
                      {c.name} <Plus className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {pendingRedes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Redes sem código ({pendingRedes.length})</span>
                  <Button size="sm" variant="outline" disabled={bulkGenerating} onClick={() => handleBulkGenerate('rede', pendingRedes)}>
                    <Zap className="h-3 w-3 mr-1" />Gerar para todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingRedes.map(r => (
                    <Badge key={r.id} variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => handleGenerateForItem('rede', r.id)}>
                      {r.name} <Plus className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Keys Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Códigos de Acesso
              </CardTitle>
              <CardDescription>{otherKeys.length} código(s)</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Criar Código
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="rede">Rede</SelectItem>
                <SelectItem value="coordenacao">Coordenação</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="celula">Célula</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherKeys.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum código encontrado.</TableCell></TableRow>
                ) : otherKeys.map(key => (
                  <TableRow key={key.id}>
                    <TableCell><Badge variant="outline" className="text-xs">{scopeLabels[key.scope_type] || key.scope_type}</Badge></TableCell>
                    <TableCell className="font-medium text-sm">{key.entity_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{key.code}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(key.code)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={key.active ? 'default' : 'secondary'} className="text-xs">{key.active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {key.active && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => regenerate.mutate(key.id)} disabled={regenerate.isPending} title="Regenerar código">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleKey.mutate({ id: key.id, active: !key.active })} disabled={toggleKey.isPending} title={key.active ? 'Desativar' : 'Ativar'}>
                          <Power className={`h-4 w-4 ${key.active ? 'text-destructive' : 'text-green-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteKey(key)} title="Apagar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Código de Acesso</DialogTitle>
            <DialogDescription>Gere um código para uma entidade do sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={createScopeType} onValueChange={(v) => { setCreateScopeType(v); setCreateScopeId(''); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="celula">Célula</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="coordenacao">Coordenação</SelectItem>
                  <SelectItem value="rede">Rede</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createScopeType && (
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select value={createScopeId} onValueChange={setCreateScopeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {getEntityOptions().map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={createAutoCode} onCheckedChange={setCreateAutoCode} />
              <Label>{createAutoCode ? 'Gerar automaticamente' : 'Definir manualmente'}</Label>
            </div>
            {!createAutoCode && (
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={createManualCode} onChange={(e) => setCreateManualCode(e.target.value)} placeholder="redeamor-XXXXXX" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKey} onOpenChange={(open) => !open && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar código?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteKey?.scope_type === 'admin'
                ? '⚠️ ATENÇÃO: Você está prestes a apagar o código ADMIN. Isso pode impedir o acesso administrativo. Tem certeza absoluta?'
                : `O código "${deleteKey?.code}" para ${deleteKey?.entity_name || 'esta entidade'} será removido permanentemente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
