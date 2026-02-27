import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UnifiedLeader, UnifiedFunction, getScopeTypeForAccessKey } from '@/hooks/useLeadershipFunctions';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leader: UnifiedLeader;
  fn: UnifiedFunction;
}

export function RemoveLeadershipFunctionDialog({ open, onOpenChange, leader, fn }: Props) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = leader.isCouple
    ? [leader.person1?.name, leader.person2?.name].filter(Boolean).join(' & ')
    : leader.person1?.name || '';

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      // 1. Remove structural link
      if (fn.functionType === 'celula_leader' && fn.scopeEntityId) {
        await supabase.from('celulas').update({ leadership_couple_id: null }).eq('id', fn.scopeEntityId);
      } else if (fn.functionType === 'supervisor' && fn.scopeEntityId) {
        await supabase.from('celulas').update({ supervisor_id: null }).eq('supervisor_id', fn.scopeEntityId);
        await supabase.from('supervisoes').delete().eq('supervisor_id', fn.scopeEntityId);
        await supabase.from('supervisores').delete().eq('id', fn.scopeEntityId);
      } else if (fn.functionType === 'coordenador' && fn.scopeEntityId) {
        await supabase.from('coordenacoes').update({ leadership_couple_id: null }).eq('id', fn.scopeEntityId);
      } else if (fn.functionType === 'rede_leader' && fn.scopeEntityId) {
        await supabase.from('redes').update({ leadership_couple_id: null }).eq('id', fn.scopeEntityId);
      } else if (fn.functionType === 'pastor_de_campo' && fn.scopeEntityId && leader.profileId) {
        await supabase.from('campo_pastores').delete().eq('profile_id', leader.profileId).eq('campo_id', fn.scopeEntityId);
      }

      // 2. Deactivate leadership_function
      await supabase.from('leadership_functions').update({ active: false }).eq('id', fn.id);

      // 3. Deactivate access key
      const akScopeType = getScopeTypeForAccessKey(fn.functionType);
      if (fn.scopeEntityId) {
        await supabase.from('access_keys').update({ active: false }).eq('scope_type', akScopeType).eq('scope_id', fn.scopeEntityId);
      } else {
        await supabase.from('access_keys').update({ active: false }).eq('scope_type', akScopeType).is('scope_id', null);
      }

      // 4. Invalidate
      queryClient.invalidateQueries({ queryKey: ['leadership_functions_unified'] });
      queryClient.invalidateQueries({ queryKey: ['access_keys'] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      queryClient.invalidateQueries({ queryKey: ['redes'] });

      toast({ title: 'Função removida', description: `${fn.functionLabel} removido de ${displayName}.` });
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
          <DialogTitle>Remover Função</DialogTitle>
          <DialogDescription>Remover {fn.functionLabel} de {displayName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Atenção</p>
              <p className="text-sm text-muted-foreground mt-1">
                A função <strong>{fn.functionLabel}</strong>
                {fn.scopeEntityName && <> vinculada a <strong>{fn.scopeEntityName}</strong></>}
                {' '}será removida e o código de acesso desativado.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={handleRemove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Remoção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
