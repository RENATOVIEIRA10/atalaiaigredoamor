import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCreateMember } from '@/hooks/useMembers';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Cake, Church } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  joined_church_at: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MemberFormDialogSimpleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celulaId: string;
}

export function MemberFormDialogSimple({ open, onOpenChange, celulaId }: MemberFormDialogSimpleProps) {
  const createMember = useCreateMember();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      birth_date: '',
      joined_church_at: '',
    },
  });
  
  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // First, create a profile for the new member
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          name: data.name,
          email: data.email || null,
          user_id: crypto.randomUUID(),
          birth_date: data.birth_date || null,
          joined_church_at: data.joined_church_at || null,
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
      // Then, create the member linked to this profile and celula
      await createMember.mutateAsync({
        profile_id: profile.id,
        celula_id: celulaId,
      });
      
      toast({ title: 'Membro adicionado com sucesso!' });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao adicionar membro', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Membro</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do membro" className="h-12 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" type="email" className="h-12 text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Cake className="h-4 w-4" />
                      Nascimento
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="joined_church_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Church className="h-4 w-4" />
                      Entrada na Igreja
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="sticky bottom-0 bg-background pt-3 pb-1 -mx-4 px-4 border-t border-border/50 flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 text-base">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 text-base font-semibold">
                {isSubmitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                Adicionar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
