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
        await supabase.from('celulas').update({ leadership_couple_id: null }).eq('id', fn.entityId);
      } else if (fn.role === 'supervisor') {
        await supabase.from('supervisores').delete().eq('id', fn.entityId);
      } else if (fn.role === 'coordenador') {
        await supabase.from('coordenacoes').update({ leadership_couple_id: null }).eq('id', fn.entityId);
      } else if (fn.role === 'rede_leader') {
        await supabase.from('redes').update({ leadership_couple_id: null }).eq('id', fn.entityId);
      }

      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });

      toast({ title: 'Função removida', description: `${fn.roleLabel} removido de ${coupleName}.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const warningMessage = fn.role === 'celula_leader'
    ? `A célula "${fn.entityName}" ficará sem liderança.`
    : fn.role === 'supervisor'
    ? `As células supervisionadas ficarão sem supervisão.`
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
