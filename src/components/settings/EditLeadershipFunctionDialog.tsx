import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UnifiedLeader, UnifiedFunction, getFunctionLabel, getScopeTypeForAccessKey, GLOBAL_FUNCTION_TYPES } from '@/hooks/useLeadershipFunctions';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useCampos } from '@/hooks/useCampos';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SCOPE_REQUIREMENTS: Record<string, { entityType: string; label: string } | null> = {
  celula_leader: { entityType: 'celula', label: 'Célula' },
  supervisor: { entityType: 'coordenacao', label: 'Coordenação' },
  coordenador: { entityType: 'coordenacao', label: 'Coordenação' },
  rede_leader: { entityType: 'rede', label: 'Rede' },
  pastor_de_campo: { entityType: 'campo', label: 'Campo' },
  pastor_senior_global: null,
  admin: null,
  lider_recomeco_central: null,
  lider_batismo_aclamacao: null,
  central_batismo_aclamacao: null,
  central_celulas: null,
  recomeco_cadastro: null,
  recomeco_operador: null,
  recomeco_leitura: null,
};

const ALL_FUNCTION_TYPES = [
  { value: 'pastor_senior_global', label: 'Pastor Sênior Global' },
  { value: 'pastor_de_campo', label: 'Pastor de Campo' },
  { value: 'admin', label: 'Administrador' },
  { value: 'rede_leader', label: 'Líder de Rede' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'celula_leader', label: 'Líder de Célula' },
  { value: 'lider_recomeco_central', label: 'Líder Recomeço + Central' },
  { value: 'lider_batismo_aclamacao', label: 'Líder Batismo / Aclamação' },
  { value: 'central_batismo_aclamacao', label: 'Central Batismo / Aclamação' },
  { value: 'central_celulas', label: 'Central de Células' },
  { value: 'recomeco_cadastro', label: 'Recomeço (Cadastro)' },
];

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'redeamor-';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leader: UnifiedLeader;
  existingFunction: UnifiedFunction | null;
  mode: 'add' | 'edit';
}

export function EditLeadershipFunctionDialog({ open, onOpenChange, leader, existingFunction, mode }: Props) {
  const queryClient = useQueryClient();
  const { data: redes } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();
  const { data: campos } = useCampos();

  const [fnType, setFnType] = useState(existingFunction?.functionType || '');
  const [entityId, setEntityId] = useState(existingFunction?.scopeEntityId || '');
  const [campoId, setCampoId] = useState(existingFunction?.campoId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFnType(existingFunction?.functionType || '');
    setEntityId(existingFunction?.scopeEntityId || '');
    setCampoId(existingFunction?.campoId || '');
  }, [existingFunction]);

  const scopeReq = fnType ? SCOPE_REQUIREMENTS[fnType] : undefined;
  const needsEntity = scopeReq !== null && scopeReq !== undefined;
  const isGlobal = GLOBAL_FUNCTION_TYPES.includes(fnType);
  const needsExplicitCampus = fnType && !needsEntity && !isGlobal;

  const entityOptions = !fnType || !needsEntity ? [] :
    scopeReq?.entityType === 'celula' ? (celulas || []).filter(c => !campoId || c.campo_id === campoId).map(c => ({ id: c.id, name: c.name })) :
    scopeReq?.entityType === 'coordenacao' ? (coordenacoes || []).filter(c => !campoId || c.campo_id === campoId).map(c => ({ id: c.id, name: c.name })) :
    scopeReq?.entityType === 'rede' ? (redes || []).filter(r => !campoId || r.campo_id === campoId).map(r => ({ id: r.id, name: r.name })) :
    scopeReq?.entityType === 'campo' ? (campos || []).map(c => ({ id: c.id, name: c.nome })) :
    [];

  const displayName = leader.isCouple
    ? [leader.person1?.name, leader.person2?.name].filter(Boolean).join(' & ')
    : leader.person1?.name || '';

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['leadership_functions_unified'] });
    queryClient.invalidateQueries({ queryKey: ['access_keys'] });
    queryClient.invalidateQueries({ queryKey: ['celulas'] });
    queryClient.invalidateQueries({ queryKey: ['supervisores'] });
    queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
    queryClient.invalidateQueries({ queryKey: ['redes'] });
    queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });
  };

  const canSubmit = fnType && (
    isGlobal ||
    (needsEntity && entityId && (scopeReq?.entityType === 'campo' || campoId)) ||
    (needsExplicitCampus && campoId)
  ) && !isSubmitting;

  const handleSubmit = async () => {
    if (!fnType) return;
    if (needsEntity && !entityId) return;
    if (!isGlobal && !campoId && scopeReq?.entityType !== 'campo') return;
    setIsSubmitting(true);

    try {
      if (mode === 'edit' && existingFunction) {
        await supabase.from('leadership_functions').update({ active: false }).eq('id', existingFunction.id);
      }

      let scopeEntityId = needsEntity ? entityId : null;

      if (leader.coupleId) {
        if (fnType === 'celula_leader' && scopeEntityId) {
          await supabase.from('celulas').update({ leadership_couple_id: leader.coupleId }).eq('id', scopeEntityId);
        } else if (fnType === 'supervisor' && scopeEntityId) {
          const { data: lc } = await supabase.from('leadership_couples').select('spouse1_id').eq('id', leader.coupleId).single();
          if (lc) {
            const { data: newSup } = await supabase.from('supervisores').insert({
              profile_id: lc.spouse1_id, coordenacao_id: scopeEntityId, leadership_couple_id: leader.coupleId,
            }).select('id').single();
            if (newSup) scopeEntityId = newSup.id;
          }
        } else if (fnType === 'coordenador' && scopeEntityId) {
          await supabase.from('coordenacoes').update({ leadership_couple_id: leader.coupleId }).eq('id', scopeEntityId);
        } else if (fnType === 'rede_leader' && scopeEntityId) {
          await supabase.from('redes').update({ leadership_couple_id: leader.coupleId }).eq('id', scopeEntityId);
        }
      }

      // Determine campo/rede ids
      let resolvedCampoId: string | null = campoId || null;
      let redeId: string | null = null;
      if (scopeReq?.entityType === 'campo') {
        resolvedCampoId = scopeEntityId;
      } else if (scopeReq?.entityType === 'rede' && scopeEntityId) {
        const r = (redes || []).find(r => r.id === scopeEntityId);
        if (!resolvedCampoId) resolvedCampoId = r?.campo_id || null;
        redeId = scopeEntityId;
      } else if (scopeReq?.entityType === 'coordenacao' && entityId) {
        const c = (coordenacoes || []).find(c => c.id === entityId);
        if (!resolvedCampoId) resolvedCampoId = c?.campo_id || null;
        redeId = c?.rede_id || null;
      } else if (scopeReq?.entityType === 'celula' && entityId) {
        const c = (celulas || []).find(c => c.id === entityId);
        if (!resolvedCampoId) resolvedCampoId = c?.campo_id || null;
        redeId = c?.rede_id || null;
      }

      await supabase.from('leadership_functions').insert({
        leadership_couple_id: leader.coupleId,
        profile_id: leader.profileId,
        function_type: fnType,
        scope_entity_id: scopeEntityId,
        scope_entity_type: scopeReq?.entityType || null,
        campo_id: resolvedCampoId,
        rede_id: redeId,
        active: true,
      });

      // Auto-create access key if none exists
      const akScopeType = getScopeTypeForAccessKey(fnType);
      const { data: existingKeys } = await supabase
        .from('access_keys')
        .select('id, scope_id, active')
        .eq('scope_type', akScopeType)
        .eq('active', true);

      const existingKey = (existingKeys || []).find(k =>
        scopeEntityId ? (k as any).scope_id === scopeEntityId : !(k as any).scope_id
      );

      if (!existingKey) {
        const code = generateAccessCode();
        await supabase.from('access_keys').insert({
          scope_type: akScopeType,
          scope_id: scopeEntityId,
          code, active: true,
          rede_id: redeId,
          campo_id: resolvedCampoId,
        });
      }

      invalidateAll();
      toast({ title: mode === 'add' ? 'Função adicionada!' : 'Função atualizada!' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Adicionar Função' : 'Editar Função'}</DialogTitle>
          <DialogDescription>{displayName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Campus selector for non-global functions */}
          {!isGlobal && fnType !== 'pastor_de_campo' && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Campus *
              </Label>
              <Select value={campoId} onValueChange={v => { setCampoId(v); setEntityId(''); }}>
                <SelectTrigger><SelectValue placeholder="Selecionar campus" /></SelectTrigger>
                <SelectContent>
                  {(campos || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Função</Label>
            <Select value={fnType} onValueChange={v => { setFnType(v); setEntityId(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecionar função" /></SelectTrigger>
              <SelectContent>
                {ALL_FUNCTION_TYPES.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fnType && needsEntity && scopeReq?.entityType !== 'campo' && (
            <div className="space-y-1.5">
              <Label>{scopeReq?.label}</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger><SelectValue placeholder={`Selecionar ${scopeReq?.label}`} /></SelectTrigger>
                <SelectContent>
                  {entityOptions.length === 0 ? (
                    <SelectItem disabled value="__empty">
                      {campoId ? 'Nenhuma entidade neste campus' : 'Selecione o campus primeiro'}
                    </SelectItem>
                  ) : entityOptions.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* For pastor_de_campo, entity IS the campo */}
          {fnType === 'pastor_de_campo' && (
            <div className="space-y-1.5">
              <Label>Campo</Label>
              <Select value={entityId} onValueChange={v => { setEntityId(v); setCampoId(v); }}>
                <SelectTrigger><SelectValue placeholder="Selecionar Campo" /></SelectTrigger>
                <SelectContent>
                  {(campos || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'add' ? 'Adicionar' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
