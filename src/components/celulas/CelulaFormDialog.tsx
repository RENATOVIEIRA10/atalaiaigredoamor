import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCelula, useUpdateCelula, Celula } from '@/hooks/useCelulas';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { InlineCoupleFields } from '@/components/leadership/InlineCoupleFields';
import { useCreateCoupleFromNames } from '@/hooks/useCreateCoupleFromNames';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  coordenacao_id: z.string().min(1, 'Coordenação é obrigatória'),
  spouse1_name: z.string().min(1, 'Nome do esposo é obrigatório'),
  spouse2_name: z.string().min(1, 'Nome da esposa é obrigatório'),
  address: z.string().optional(),
  meeting_day: z.string().optional(),
  meeting_time: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  instagram_lider1: z.string().optional(),
  instagram_lider2: z.string().optional(),
  instagram_celula: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CelulaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celula?: Celula | null;
}

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export function CelulaFormDialog({ open, onOpenChange, celula }: CelulaFormDialogProps) {
  const { data: coordenacoes } = useCoordenacoes();
  const createCelula = useCreateCelula();
  const updateCelula = useUpdateCelula();
  const { createOrUpdateCouple } = useCreateCoupleFromNames();
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: celula?.name || '',
      coordenacao_id: celula?.coordenacao_id || '',
      spouse1_name: celula?.leadership_couple?.spouse1?.name || '',
      spouse2_name: celula?.leadership_couple?.spouse2?.name || '',
      address: celula?.address || '',
      meeting_day: celula?.meeting_day || '',
      meeting_time: celula?.meeting_time || '',
      bairro: (celula as any)?.bairro || '',
      cidade: (celula as any)?.cidade || '',
      instagram_lider1: (celula as any)?.instagram_lider1 || '',
      instagram_lider2: (celula as any)?.instagram_lider2 || '',
      instagram_celula: (celula as any)?.instagram_celula || '',
    },
  });
  
  async function onSubmit(data: FormData) {
    try {
      setSubmitting(true);
      const coupleId = await createOrUpdateCouple(
        data.spouse1_name,
        data.spouse2_name,
        celula?.leadership_couple_id
      );
      
      const payload = {
        name: data.name,
        coordenacao_id: data.coordenacao_id,
        leadership_couple_id: coupleId,
        address: data.address || null,
        meeting_day: data.meeting_day || null,
        meeting_time: data.meeting_time || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        instagram_lider1: data.instagram_lider1 || null,
        instagram_lider2: data.instagram_lider2 || null,
        instagram_celula: data.instagram_celula || null,
      };
      
      if (celula) {
        await updateCelula.mutateAsync({ id: celula.id, ...payload });
      } else {
        await createCelula.mutateAsync(payload);
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{celula ? 'Editar Célula' : 'Nova Célula'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Célula</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Célula dos Jovens" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="coordenacao_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordenação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coordenação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coordenacoes?.map((coord) => (
                        <SelectItem key={coord.id} value={coord.id}>
                          {coord.name}
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
              label="Líderes da Célula (Casal)"
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Flores, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meeting_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Encontro</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Instagram (opcional)</p>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="instagram_lider1"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="@instagram do líder 1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagram_lider2"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="@instagram do líder 2" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagram_celula"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="@instagram da célula" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
              <FormField
                control={form.control}
                name="meeting_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {celula ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
