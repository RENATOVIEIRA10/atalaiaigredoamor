import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CoupleWithFunctions, CoupleFunction } from '@/hooks/useCoupleFunctions';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type FunctionRole = 'celula_leader' | 'supervisor' | 'coordenador' | 'rede_leader';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  couple: CoupleWithFunctions;
  existingFunction: CoupleFunction | null;
  mode: 'add' | 'edit';
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'redeamor-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const scopeTypeMap: Record<FunctionRole, string> = {
  celula_leader: 'celula',
  supervisor: 'supervisor',
  coordenador: 'coordenacao',
  rede_leader: 'rede',
};

export function EditFunctionDialog({ open, onOpenChange, couple, existingFunction, mode }: Props) {
  const queryClient = useQueryClient();
  const { data: redes } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();

  const [role, setRole] = useState<FunctionRole | ''>(existingFunction?.role || '');
  const [entityId, setEntityId] = useState(existingFunction?.entityId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRole(existingFunction?.role || '');
    setEntityId(existingFunction?.entityId || '');
  }, [existingFunction]);

  const entityOptions = role === 'rede_leader'
    ? (redes || []).map(r => ({ id: r.id, name: r.name }))
    : role === 'coordenador'
    ? (coordenacoes || []).map(c => ({ id: c.id, name: c.name }))
    : role === 'supervisor'
    ? (coordenacoes || []).map(c => ({ id: c.id, name: `Coord. ${c.name}` }))
    : role === 'celula_leader'
    ? (celulas || []).map(c => ({ id: c.id, name: c.name }))
    : [];

  const coupleName = [couple.spouse1?.name, couple.spouse2?.name].filter(Boolean).join(' & ');

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['celulas'] }),
      queryClient.invalidateQueries({ queryKey: ['supervisores'] }),
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] }),
      queryClient.invalidateQueries({ queryKey: ['redes'] }),
      queryClient.invalidateQueries({ queryKey: ['leadership_couples'] }),
      queryClient.invalidateQueries({ queryKey: ['access_keys'] }),
    ]);
  };

  const handleSubmit = async () => {
    if (!role || !entityId) return;
    setIsSubmitting(true);

    try {
      // If editing, first remove old link
      if (mode === 'edit' && existingFunction) {
        await removeLink(existingFunction);
      }

      let newEntityId = entityId; // The scope_id for the access key

      // Create new link
      if (role === 'celula_leader') {
        const { error } = await supabase.from('celulas').update({ leadership_couple_id: couple.coupleId }).eq('id', entityId);
        if (error) throw error;
      } else if (role === 'supervisor') {
        const { data: lc, error: lcErr } = await supabase.from('leadership_couples').select('spouse1_id').eq('id', couple.coupleId).single();
        if (lcErr) throw lcErr;
        const { data: newSup, error: supErr } = await supabase.from('supervisores').insert({
          profile_id: lc.spouse1_id,
          coordenacao_id: entityId,
          leadership_couple_id: couple.coupleId,
        }).select('id').single();
        if (supErr) throw supErr;
        newEntityId = newSup.id; // The supervisor record ID is the scope_id
      } else if (role === 'coordenador') {
        const { error } = await supabase.from('coordenacoes').update({ leadership_couple_id: couple.coupleId }).eq('id', entityId);
        if (error) throw error;
      } else if (role === 'rede_leader') {
        const { error } = await supabase.from('redes').update({ leadership_couple_id: couple.coupleId }).eq('id', entityId);
        if (error) throw error;
      }

      // Auto-create access_key for this new function
      await ensureAccessKey(role, newEntityId);

      await invalidateAll();
      toast({ title: mode === 'add' ? 'Função adicionada!' : 'Vínculo atualizado!' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar função:', error);
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Adicionar Função' : 'Editar Vínculo'}</DialogTitle>
          <DialogDescription>
            {coupleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Função</Label>
            <Select value={role} onValueChange={v => { setRole(v as FunctionRole); setEntityId(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celula_leader">Líder de Célula</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="coordenador">Coordenador</SelectItem>
                <SelectItem value="rede_leader">Líder de Rede</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role && (
            <div className="space-y-1.5">
              <Label>Vínculo</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={!role || !entityId || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'add' ? 'Adicionar' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function removeLink(fn: CoupleFunction) {
  if (fn.role === 'celula_leader') {
    const { error } = await supabase.from('celulas').update({ leadership_couple_id: null }).eq('id', fn.entityId);
    if (error) throw error;
  } else if (fn.role === 'supervisor') {
    // Clear supervisor_id from cells first
    await supabase.from('celulas').update({ supervisor_id: null }).eq('supervisor_id', fn.entityId);
    // Delete supervisão records
    await supabase.from('supervisoes').delete().eq('supervisor_id', fn.entityId);
    // Delete supervisor record
    const { error } = await supabase.from('supervisores').delete().eq('id', fn.entityId);
    if (error) throw error;
  } else if (fn.role === 'coordenador') {
    const { error } = await supabase.from('coordenacoes').update({ leadership_couple_id: null }).eq('id', fn.entityId);
    if (error) throw error;
  } else if (fn.role === 'rede_leader') {
    const { error } = await supabase.from('redes').update({ leadership_couple_id: null }).eq('id', fn.entityId);
    if (error) throw error;
  }

  // Deactivate old access key
  const scopeType = scopeTypeMap[fn.role];
  if (scopeType) {
    await supabase
      .from('access_keys')
      .update({ active: false })
      .eq('scope_type', scopeType)
      .eq('scope_id', fn.entityId);
  }
}

async function ensureAccessKey(role: FunctionRole, scopeId: string) {
  const scopeType = scopeTypeMap[role];
  if (!scopeType) return;

  // Check if an active key already exists for this scope
  const { data: existing } = await supabase
    .from('access_keys')
    .select('id')
    .eq('scope_type', scopeType)
    .eq('scope_id', scopeId)
    .eq('active', true)
    .maybeSingle();

  if (existing) return; // Already has an active key

  // Create a new access key
  const code = generateAccessCode();
  await supabase.from('access_keys').insert({
    scope_type: scopeType,
    scope_id: scopeId,
    code,
    active: true,
  });
}
