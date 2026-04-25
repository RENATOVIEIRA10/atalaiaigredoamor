import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { emitToAuriosHQ } from '@/lib/aurios-bridge';

export type Meeting = Tables<'meetings'> & {
  celula?: { id: string; name: string } | null;
  _count?: { attendances: number; visitors: number };
};

export type Attendance = Tables<'attendances'> & {
  member?: { 
    id: string; 
    profile?: { id: string; name: string; avatar_url: string | null } | null 
  } | null;
};

export function useMeetings(celulaId?: string) {
  return useQuery({
    queryKey: ['meetings', celulaId],
    queryFn: async () => {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          celula:celulas!meetings_celula_id_fkey(id, name)
        `)
        .order('date', { ascending: false });
      
      if (celulaId) {
        query = query.eq('celula_id', celulaId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get attendance and visitor counts
      const meetingIds = data.map(m => m.id);
      
      const [{ data: attendances }, { data: visitors }] = await Promise.all([
        supabase.from('attendances').select('meeting_id').in('meeting_id', meetingIds),
        supabase.from('visitors').select('meeting_id').in('meeting_id', meetingIds),
      ]);
      
      const attMap = attendances?.reduce((acc, a) => {
        acc[a.meeting_id] = (acc[a.meeting_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const visMap = visitors?.reduce((acc, v) => {
        acc[v.meeting_id] = (acc[v.meeting_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return data.map(m => ({
        ...m,
        _count: { 
          attendances: attMap[m.id] || 0,
          visitors: visMap[m.id] || 0 
        }
      })) as Meeting[];
    },
  });
}

export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: ['meetings', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          celula:celulas!meetings_celula_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Meeting;
    },
    enabled: !!id,
  });
}

export function useMeetingAttendances(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['attendances', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          member:members!attendances_member_id_fkey(
            id,
            profile:profiles!members_profile_id_fkey(id, name, avatar_url)
          )
        `)
        .eq('meeting_id', meetingId);
      
      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!meetingId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meeting: TablesInsert<'meetings'>) => {
      const { data, error } = await supabase
        .from('meetings')
        .insert(meeting)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'Reunião criada com sucesso!' });
      // AUR.IOs HQ telemetry — contagem culto iniciada
      emitToAuriosHQ('contagem_culto_iniciada', {
        meeting_id: (data as any)?.id,
        celula_id: (data as any)?.celula_id,
        date: (data as any)?.date,
        summary: 'Contagem de culto iniciada',
      }).catch(() => {});
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar reunião', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSaveAttendances() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ meetingId, attendances }: { 
      meetingId: string; 
      attendances: { member_id: string; present: boolean }[] 
    }) => {
      // Delete existing attendances for this meeting
      await supabase
        .from('attendances')
        .delete()
        .eq('meeting_id', meetingId);
      
      // Insert new attendances
      if (attendances.length > 0) {
        const { error } = await supabase
          .from('attendances')
          .insert(attendances.map(a => ({ ...a, meeting_id: meetingId })));
        
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'Presenças salvas com sucesso!' });
      // AUR.IOs HQ telemetry — contagem culto encerrada
      const presentes = variables.attendances.filter((a) => a.present).length;
      emitToAuriosHQ('contagem_culto_encerrada', {
        meeting_id: variables.meetingId,
        total_marcados: variables.attendances.length,
        total_presentes: presentes,
        summary: 'Contagem de culto encerrada — ' + presentes + ' presentes',
      }).catch(() => {});
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar presenças', description: error.message, variant: 'destructive' });
    },
  });
}
