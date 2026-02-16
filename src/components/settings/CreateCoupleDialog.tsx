import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Network, FolderTree, ClipboardCheck, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCreateCoupleFromNames } from '@/hooks/useCreateCoupleFromNames';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type FunctionRole = 'celula_leader' | 'supervisor' | 'coordenador' | 'rede_leader';

interface PendingFunction {
  role: FunctionRole;
  entityId: string;
  entityName: string;
}

const roleLabels: Record<FunctionRole, string> = {
  rede_leader: 'Líder de Rede',
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  celula_leader: 'Líder de Célula',
};

const roleIcons: Record<FunctionRole, any> = {
  rede_leader: Network,
  coordenador: FolderTree,
  supervisor: ClipboardCheck,
  celula_leader: Home,
};

export function CreateCoupleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { createOrUpdateCouple } = useCreateCoupleFromNames();
  const { data: redes } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();

  const [spouse1Name, setSpouse1Name] = useState('');
  const [spouse2Name, setSpouse2Name] = useState('');
  const [functions, setFunctions] = useState<PendingFunction[]>([]);
  const [currentRole, setCurrentRole] = useState<FunctionRole | ''>('');
  const [currentEntity, setCurrentEntity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const entityOptions = currentRole === 'rede_leader'
    ? (redes || []).map(r => ({ id: r.id, name: r.name }))
    : currentRole === 'coordenador'
    ? (coordenacoes || []).map(c => ({ id: c.id, name: c.name }))
    : currentRole === 'supervisor'
    ? (coordenacoes || []).map(c => ({ id: c.id, name: `Coord. ${c.name}` }))
    : currentRole === 'celula_leader'
    ? (celulas || []).map(c => ({ id: c.id, name: c.name }))
    : [];

  const addFunction = () => {
    if (!currentRole || !currentEntity) return;
    const entity = entityOptions.find(e => e.id === currentEntity);
    if (!entity) return;
    setFunctions([...functions, { role: currentRole, entityId: currentEntity, entityName: entity.name }]);
    setCurrentRole('');
    setCurrentEntity('');
  };

  const removeFunction = (index: number) => {
    setFunctions(functions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!spouse1Name.trim() || !spouse2Name.trim()) {
      toast({ variant: 'destructive', title: 'Preencha os nomes do casal' });
      return;
    }
    if (functions.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione pelo menos uma função' });
      return;
    }

    setIsSubmitting(true);
    try {
      const coupleId = await createOrUpdateCouple(spouse1Name, spouse2Name);
      if (!coupleId) throw new Error('Erro ao criar casal');

      // Now link functions
      for (const fn of functions) {
        if (fn.role === 'celula_leader') {
          await supabase.from('celulas').update({ leadership_couple_id: coupleId }).eq('id', fn.entityId);
        } else if (fn.role === 'supervisor') {
          // Get spouse1 profile_id for supervisor record
          const { data: couple } = await supabase
            .from('leadership_couples')
            .select('spouse1_id')
            .eq('id', coupleId)
            .single();
          if (couple) {
            await supabase.from('supervisores').insert({
              profile_id: couple.spouse1_id,
              coordenacao_id: fn.entityId,
              leadership_couple_id: coupleId,
            });
          }
        } else if (fn.role === 'coordenador') {
          await supabase.from('coordenacoes').update({ leadership_couple_id: coupleId }).eq('id', fn.entityId);
        } else if (fn.role === 'rede_leader') {
          await supabase.from('redes').update({ leadership_couple_id: coupleId }).eq('id', fn.entityId);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });

      toast({ title: 'Casal criado com sucesso!', description: `${spouse1Name} & ${spouse2Name} vinculados à estrutura.` });
      resetAndClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSpouse1Name('');
    setSpouse2Name('');
    setFunctions([]);
    setCurrentRole('');
    setCurrentEntity('');
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Casal na Estrutura</DialogTitle>
          <DialogDescription>Crie um casal e vincule suas funções na hierarquia.</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Passo 1 – Casal</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome Pessoa 1 *</Label>
                <Input placeholder="Nome completo" value={spouse1Name} onChange={e => setSpouse1Name(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nome Pessoa 2 *</Label>
                <Input placeholder="Nome completo" value={spouse2Name} onChange={e => setSpouse2Name(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!spouse1Name.trim() || !spouse2Name.trim()}>
              Próximo
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Passo 2 – Funções</p>

            {functions.length > 0 && (
              <div className="space-y-2">
                {functions.map((fn, i) => {
                  const Icon = roleIcons[fn.role];
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{roleLabels[fn.role]}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{fn.entityName}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFunction(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Adicionar função:</p>
              <Select value={currentRole} onValueChange={v => { setCurrentRole(v as FunctionRole); setCurrentEntity(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celula_leader">Líder de Célula</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                  <SelectItem value="rede_leader">Líder de Rede</SelectItem>
                </SelectContent>
              </Select>

              {currentRole && (
                <Select value={currentEntity} onValueChange={setCurrentEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar vínculo" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityOptions.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="secondary" size="sm" onClick={addFunction} disabled={!currentRole || !currentEntity} className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Adicionar função
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={functions.length === 0}>Próximo</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Passo 3 – Confirmar</p>

            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <p className="font-semibold text-sm">{spouse1Name} & {spouse2Name}</p>
              <p className="text-xs text-muted-foreground">serão:</p>
              {functions.map((fn, i) => {
                const Icon = roleIcons[fn.role];
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{roleLabels[fn.role]}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{fn.entityName}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar e Vincular
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
