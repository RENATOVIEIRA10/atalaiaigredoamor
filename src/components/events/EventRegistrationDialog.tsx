import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useActiveEvents, useCreateEventRegistration } from '@/hooks/useEventsSpiritual';
import { useAuth } from '@/contexts/AuthContext';
import { useCampoFilter } from '@/hooks/useCampoFilter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personType: 'vida' | 'membro';
  vidaId?: string | null;
  membroId?: string | null;
  fullName: string;
  whatsapp?: string | null;
  celulaId?: string | null;
  redeId?: string | null;
}

export function EventRegistrationDialog({
  open, onOpenChange, personType, vidaId, membroId,
  fullName, whatsapp, celulaId, redeId,
}: Props) {
  const { user } = useAuth();
  const campoId = useCampoFilter();
  const { data: events, isLoading } = useActiveEvents(campoId);
  const createReg = useCreateEventRegistration();
  const [selectedEventId, setSelectedEventId] = useState('');

  // Get operator name
  const { data: profile } = useQuery({
    queryKey: ['my-profile-name', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
  });

  const handleSubmit = () => {
    if (!selectedEventId) return;
    createReg.mutate({
      event_id: selectedEventId,
      person_type: personType,
      vida_id: personType === 'vida' ? vidaId : null,
      membro_id: personType === 'membro' ? membroId : null,
      full_name: fullName,
      whatsapp: whatsapp || null,
      celula_id: celulaId || null,
      rede_id: redeId || null,
      created_by_user_id: user?.id || null,
      created_by_name: profile?.name || 'Operador',
    } as any, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscrever em Evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Pessoa</p>
            <p className="font-medium text-foreground">{fullName}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !events?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento futuro cadastrado.</p>
          ) : (
            <div className="space-y-3">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o evento..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map(ev => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title} — {new Date(ev.event_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedEventId || createReg.isPending}
                  className="flex-1"
                >
                  {createReg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Inscrever
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
