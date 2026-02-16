import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CoupleWithFunctions, CoupleFunction } from '@/hooks/useCoupleFunctions';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  couple: CoupleWithFunctions;
  fn: CoupleFunction;
}

export function RemoveFunctionDialog({ open, onOpenChange, couple, fn }: Props) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coupleName = [couple.spouse1?.name, couple.spouse2?.name].filter(Boolean).join(' & ');

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      if (fn.role === 'celula_leader') {
        const { error } = await supabase.from('celulas').update({ leadership_couple_id: null }).eq('id', fn.entityId);
        if (error) throw error;
      } else if (fn.role === 'supervisor') {
        // 1. Clear supervisor_id from all cells supervised by this supervisor
        const { error: celClearError } = await supabase
          .from('celulas')
          .update({ supervisor_id: null })
          .eq('supervisor_id', fn.entityId);
        if (celClearError) throw celClearError;

        // 2. Delete any supervisão records linked to this supervisor
        const { error: supVisitError } = await supabase
          .from('supervisoes')
          .delete()
          .eq('supervisor_id', fn.entityId);
        if (supVisitError) throw supVisitError;

        // 3. Delete the supervisor record itself
        const { error: supError } = await supabase
          .from('supervisores')
          .delete()
          .eq('id', fn.entityId);
        if (supError) throw supError;
      } else if (fn.role === 'coordenador') {
        const { error } = await supabase.from('coordenacoes').update({ leadership_couple_id: null }).eq('id', fn.entityId);
        if (error) throw error;
      } else if (fn.role === 'rede_leader') {
        const { error } = await supabase.from('redes').update({ leadership_couple_id: null }).eq('id', fn.entityId);
        if (error) throw error;
      }

      // 4. Deactivate the access_key for this specific function/scope
      await deactivateAccessKey(fn);

      // 5. Force re-fetch all related data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['celulas'] }),
        queryClient.invalidateQueries({ queryKey: ['supervisores'] }),
        queryClient.invalidateQueries({ queryKey: ['coordenacoes'] }),
        queryClient.invalidateQueries({ queryKey: ['redes'] }),
        queryClient.invalidateQueries({ queryKey: ['leadership_couples'] }),
        queryClient.invalidateQueries({ queryKey: ['access_keys'] }),
      ]);

      // Wait for refetch to settle
      await queryClient.refetchQueries({ queryKey: ['supervisores'] });

      toast({ title: 'Função removida', description: `${fn.roleLabel} removido de ${coupleName}.` });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao remover função:', error);
      toast({ variant: 'destructive', title: 'Erro ao remover', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const warningMessage = fn.role === 'celula_leader'
    ? `A célula "${fn.entityName}" ficará sem liderança.`
    : fn.role === 'supervisor'
    ? `As células supervisionadas ficarão sem supervisão e os registros de supervisão serão removidos.`
    : fn.role === 'coordenador'
    ? `A coordenação "${fn.entityName}" ficará sem coordenador.`
    : `A rede "${fn.entityName}" ficará sem líder.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remover Função</DialogTitle>
          <DialogDescription>
            Remover {fn.roleLabel} de {coupleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Atenção</p>
              <p className="text-sm text-muted-foreground mt-1">{warningMessage}</p>
              <p className="text-sm text-muted-foreground mt-1">O código de acesso desta função será desativado.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
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

async function deactivateAccessKey(fn: CoupleFunction) {
  const scopeTypeMap: Record<string, string> = {
    celula_leader: 'celula',
    supervisor: 'supervisor',
    coordenador: 'coordenacao',
    rede_leader: 'rede',
  };
  const scopeType = scopeTypeMap[fn.role];
  if (!scopeType) return;

  await supabase
    .from('access_keys')
    .update({ active: false })
    .eq('scope_type', scopeType)
    .eq('scope_id', fn.entityId);
}
