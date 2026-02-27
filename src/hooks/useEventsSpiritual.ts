import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SpiritualEvent {
  id: string;
  type: 'batismo' | 'aclamacao';
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  person_type: 'vida' | 'membro';
  vida_id: string | null;
  membro_id: string | null;
  full_name: string;
  whatsapp: string | null;
  coordenacao_id: string | null;
  celula_id: string | null;
  rede_id: string | null;
  status: 'inscrito' | 'pendente' | 'aprovado' | 'realizado' | 'recusado';
  notes: string | null;
  created_by_user_id: string | null;
  created_by_name: string | null;
  created_at: string;
  // joined
  event?: SpiritualEvent;
  celula?: { id: string; name: string } | null;
}

export function useSpiritualEvents(type?: 'batismo' | 'aclamacao') {
  return useQuery({
    queryKey: ['events_spiritual', type],
    queryFn: async () => {
      let query = supabase
        .from('events_spiritual')
        .select('*')
        .order('event_date', { ascending: false });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SpiritualEvent[];
    },
  });
}

export function useActiveEvents() {
  return useQuery({
    queryKey: ['events_spiritual_active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_spiritual')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data || []) as SpiritualEvent[];
    },
  });
}

export function useCreateSpiritualEvent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (event: Omit<SpiritualEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('events_spiritual')
        .insert(event as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events_spiritual'] });
      qc.invalidateQueries({ queryKey: ['events_spiritual_active'] });
      toast({ title: 'Evento criado com sucesso!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useEventRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ['event_registrations', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, celula:celulas!event_registrations_celula_id_fkey(id, name)')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EventRegistration[];
    },
  });
}

export function useCreateEventRegistration() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (reg: Partial<EventRegistration>) => {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert(reg as any)
        .select()
        .single();
      if (error) throw error;

      // Auto-encaminhar para Central de Células se inscrição sem célula
      if (!reg.celula_id) {
        // Se já tem vida_id, apenas garantir que está visível na Central
        if (reg.vida_id) {
          await supabase
            .from('novas_vidas')
            .update({ status: 'nova' } as any)
            .eq('id', reg.vida_id)
            .in('status', ['integrada', 'convertida_membro', 'nao_convertida']);
        } else if (!reg.membro_id) {
          // Registro manual sem vida vinculada — criar nova_vida para Central de Células
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('novas_vidas').insert({
            nome: reg.full_name || 'Sem nome',
            whatsapp: reg.whatsapp || null,
            status: 'nova',
            created_by_user_id: user?.id || null,
            observacao: `Inscrição Batismo/Aclamação sem célula (ID: ${data.id})`,
          } as any);
        }
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event_registrations'] });
      qc.invalidateQueries({ queryKey: ['events_spiritual'] });
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      toast({ title: 'Inscrição realizada!' });
    },
    onError: (e: any) => toast({ title: 'Erro na inscrição', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateRegistrationStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: any = { status };
      if (notes !== undefined) update.notes = notes;
      const { error } = await supabase
        .from('event_registrations')
        .update(update)
        .eq('id', id);
      if (error) throw error;

      // If realizado, auto-mark spiritual milestone on member
      if (status === 'realizado') {
        const { data: reg } = await supabase
          .from('event_registrations')
          .select('*, event:events_spiritual!event_registrations_event_id_fkey(*)')
          .eq('id', id)
          .single();
        if (reg && reg.membro_id) {
          const eventType = (reg.event as any)?.type;
          if (eventType === 'batismo') {
            await supabase.from('members').update({ batismo: true } as any).eq('id', reg.membro_id);
          }
          // aclamacao doesn't have a column yet, but we mark it if it exists
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event_registrations'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
