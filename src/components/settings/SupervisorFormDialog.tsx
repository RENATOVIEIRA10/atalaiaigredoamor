import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineCoupleFields } from '@/components/leadership/InlineCoupleFields';
import { useCreateCoupleFromNames } from '@/hooks/useCreateCoupleFromNames';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  coordenacao_id: z.string().min(1, 'Coordenação é obrigatória'),
  spouse1_name: z.string().min(1, 'Nome do esposo é obrigatório'),
  spouse2_name: z.string().min(1, 'Nome da esposa é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface SupervisorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCoordenacaoId?: string;
}

export function SupervisorFormDialog({ open, onOpenChange, defaultCoordenacaoId }: SupervisorFormDialogProps) {
  const { data: coordenacoes } = useCoordenacoes();
  const { createOrUpdateCouple } = useCreateCoupleFromNames();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coordenacao_id: defaultCoordenacaoId || '',
      spouse1_name: '',
      spouse2_name: '',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setSubmitting(true);
      const coupleId = await createOrUpdateCouple(data.spouse1_name, data.spouse2_name);
      if (!coupleId) throw new Error('Erro ao criar casal');

      // Get the spouse1 profile to use as profile_id for the supervisor
      const { data: couple } = await supabase
        .from('leadership_couples')
        .select('spouse1_id')
        .eq('id', coupleId)
        .single();

      if (!couple) throw new Error('Casal não encontrado');

      const { error } = await supabase
        .from('supervisores')
        .insert({
          profile_id: couple.spouse1_id,
          coordenacao_id: data.coordenacao_id,
          leadership_couple_id: coupleId,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      toast({ title: 'Supervisor cadastrado com sucesso!' });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Supervisor (Casal)</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="coordenacao_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordenação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coordenacoes?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <InlineCoupleFields form={form} label="Supervisores (Casal)" />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
