import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCoordenacao, useUpdateCoordenacao, Coordenacao } from '@/hooks/useCoordenacoes';
import { useRedes } from '@/hooks/useRedes';
import { InlineCoupleFields } from '@/components/leadership/InlineCoupleFields';
import { useCreateCoupleFromNames } from '@/hooks/useCreateCoupleFromNames';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCampo } from '@/contexts/CampoContext';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  rede_id: z.string().min(1, 'Rede é obrigatória'),
  spouse1_name: z.string().min(1, 'Nome do esposo é obrigatório'),
  spouse2_name: z.string().min(1, 'Nome da esposa é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface CoordenacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordenacao?: Coordenacao | null;
}

export function CoordenacaoFormDialog({ open, onOpenChange, coordenacao }: CoordenacaoFormDialogProps) {
  const { data: redes } = useRedes();
  const createCoordenacao = useCreateCoordenacao();
  const updateCoordenacao = useUpdateCoordenacao();
  const { createOrUpdateCouple } = useCreateCoupleFromNames();
  const [submitting, setSubmitting] = useState(false);
  const { activeCampoId } = useCampo();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: coordenacao?.name || '',
      rede_id: coordenacao?.rede_id || '',
      spouse1_name: coordenacao?.leadership_couple?.spouse1?.name || '',
      spouse2_name: coordenacao?.leadership_couple?.spouse2?.name || '',
    },
  });
  
  async function onSubmit(data: FormData) {
    try {
      setSubmitting(true);
      const coupleId = await createOrUpdateCouple(
        data.spouse1_name,
        data.spouse2_name,
        coordenacao?.leadership_couple_id
      );
      
      const selectedRede = redes?.find(r => r.id === data.rede_id);
      const campoIdToUse = selectedRede?.campo_id || activeCampoId;
      if (!campoIdToUse) throw new Error('Campus não definido');

      const payload = {
        name: data.name,
        rede_id: data.rede_id,
        leadership_couple_id: coupleId,
        campo_id: campoIdToUse,
      };
      
      if (coordenacao) {
        await updateCoordenacao.mutateAsync({ id: coordenacao.id, ...payload });
      } else {
        await createCoordenacao.mutateAsync(payload);
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
          <DialogTitle>{coordenacao ? 'Editar Coordenação' : 'Nova Coordenação'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Coordenação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Coordenação Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rede_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rede</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma rede" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {redes?.map((rede) => (
                        <SelectItem key={rede.id} value={rede.id}>
                          {rede.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <InlineCoupleFields
              form={form}
              label="Coordenadores (Casal)"
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {coordenacao ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
