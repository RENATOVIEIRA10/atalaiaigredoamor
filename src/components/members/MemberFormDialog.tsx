import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateMember } from '@/hooks/useMembers';
import { useCelulas } from '@/hooks/useCelulas';
import { useProfiles } from '@/hooks/useProfiles';
import { useMembers } from '@/hooks/useMembers';
import { useCampo } from '@/contexts/CampoContext';

const formSchema = z.object({
  profile_id: z.string().min(1, 'Selecione um perfil'),
  celula_id: z.string().min(1, 'Selecione uma célula'),
});

type FormData = z.infer<typeof formSchema>;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberFormDialog({ open, onOpenChange }: MemberFormDialogProps) {
  const { data: celulas } = useCelulas();
  const { data: profiles } = useProfiles();
  const { data: existingMembers } = useMembers();
  const createMember = useCreateMember();
  const { activeCampoId } = useCampo();
  
  // Filter out profiles that are already members
  const existingProfileIds = new Set(existingMembers?.map(m => m.profile_id) || []);
  const availableProfiles = profiles?.filter(p => !existingProfileIds.has(p.id)) || [];
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profile_id: '',
      celula_id: '',
    },
  });
  
  async function onSubmit(data: FormData) {
    try {
      const selectedCelula = celulas?.find(c => c.id === data.celula_id);
      const campoIdToUse = selectedCelula?.campo_id || activeCampoId;
      if (!campoIdToUse) throw new Error('Campus não definido');

      await createMember.mutateAsync({
        profile_id: data.profile_id,
        celula_id: data.celula_id,
        campo_id: campoIdToUse,
        rede_id: selectedCelula?.rede_id || '',
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="profile_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pessoa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma pessoa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProfiles.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Todas as pessoas já são membros de alguma célula
                        </div>
                      ) : (
                        availableProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="celula_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Célula</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma célula" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {celulas?.map((celula) => (
                        <SelectItem key={celula.id} value={celula.id}>
                          {celula.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMember.isPending}>
                Adicionar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
