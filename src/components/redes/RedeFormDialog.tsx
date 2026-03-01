import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateRede, useUpdateRede, Rede } from '@/hooks/useRedes';
import { InlineCoupleFields } from '@/components/leadership/InlineCoupleFields';
import { useCreateCoupleFromNames } from '@/hooks/useCreateCoupleFromNames';
import { getCoupleDisplayName } from '@/hooks/useLeadershipCouples';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCampo } from '@/contexts/CampoContext';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  spouse1_name: z.string().min(1, 'Nome do esposo é obrigatório'),
  spouse2_name: z.string().min(1, 'Nome da esposa é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface RedeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rede?: Rede | null;
}

export function RedeFormDialog({ open, onOpenChange, rede }: RedeFormDialogProps) {
  const createRede = useCreateRede();
  const updateRede = useUpdateRede();
  const { createOrUpdateCouple } = useCreateCoupleFromNames();
  const [submitting, setSubmitting] = useState(false);
  const { activeCampoId } = useCampo();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rede?.name || '',
      spouse1_name: rede?.leadership_couple?.spouse1?.name || '',
      spouse2_name: rede?.leadership_couple?.spouse2?.name || '',
    },
  });
  
  async function onSubmit(data: FormData) {
    try {
      setSubmitting(true);
      const coupleId = await createOrUpdateCouple(
        data.spouse1_name,
        data.spouse2_name,
        rede?.leadership_couple_id
      );
      
      if (!activeCampoId) throw new Error('Campus não definido');

      const payload = {
        name: data.name,
        leadership_couple_id: coupleId,
        campo_id: activeCampoId,
      };
      
      if (rede) {
        await updateRede.mutateAsync({ id: rede.id, ...payload });
      } else {
        await createRede.mutateAsync(payload);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rede ? 'Editar Rede' : 'Nova Rede'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Rede</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rede Norte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <InlineCoupleFields
              form={form}
              label="Líderes da Rede (Casal)"
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {rede ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
