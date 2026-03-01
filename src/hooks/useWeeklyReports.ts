import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from '@/hooks/useDemoScope';

export interface WeeklyReport {
  id: string;
  celula_id: string;
  week_start: string;
  meeting_date: string | null;
  members_present: number;
  leaders_in_training: number;
  discipleships: number;
  visitors: number;
  children: number;
  notes: string | null;
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  celula?: {
    id: string;
    name: string;
    coordenacao_id: string;
    coordenacao?: {
      id: string;
      name: string;
      rede_id: string;
      rede?: {
        id: string;
        name: string;
      };
    };
  };
}

export interface WeeklyReportInput {
  celula_id: string;
  week_start: string;
  meeting_date?: string | null;
  members_present: number;
  leaders_in_training: number;
  discipleships: number;
  visitors: number;
  children: number;
  notes?: string;
  photo_url?: string | null;
  mensagem_whatsapp?: string;
  paixao_whatsapp?: string;
  cultura_whatsapp?: string;
  campo_id?: string;
}

export interface DateRangeFilter {
  from: string;
  to: string;
}

// Get the Monday of the week that contains the given date
export function getWeekStartFromDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay();
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

export function getCurrentWeekStart(): string {
  const now = new Date();
  return getWeekStartFromDate(now.toISOString().split('T')[0]);
}

export function useWeeklyReports(celulaId?: string, dateRange?: DateRangeFilter, campoId?: string | null) {
  const { isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['weekly-reports', celulaId, dateRange?.from, dateRange?.to, campoId, ...queryKeyExtra],
    queryFn: async () => {
      let query = supabase
        .from('weekly_reports')
        .select(`
          *,
          celula:celulas(
            id,
            name,
            coordenacao_id,
            coordenacao:coordenacoes(
              id,
              name,
              rede_id,
              rede:redes(id, name)
            )
          )
        `)
        .order('meeting_date', { ascending: false, nullsFirst: false })
        .order('week_start', { ascending: false });
      
      if (celulaId) {
        query = query.eq('celula_id', celulaId);
      }


      if (campoId) {
        query = query.eq('campo_id', campoId);
      }
      
      if (dateRange) {
        query = query.or(
          `and(meeting_date.gte.${dateRange.from},meeting_date.lte.${dateRange.to}),and(week_start.gte.${dateRange.from},week_start.lte.${dateRange.to})`
        );
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as WeeklyReport[];
    },
  });
}

export function useWeeklyReportsByCoordenacao(coordenacaoId?: string, dateRange?: DateRangeFilter) {
  const { isDemoActive, seedRunId, queryKeyExtra, campoId } = useDemoScope();

  return useQuery({
    queryKey: ['weekly-reports-coordenacao', coordenacaoId, dateRange?.from, dateRange?.to, ...queryKeyExtra],
    queryFn: async () => {
      let celulasQ = supabase.from('celulas').select('id').eq('coordenacao_id', coordenacaoId);
      if (campoId) celulasQ = celulasQ.eq('campo_id', campoId);
      const { data: celulas } = await celulasQ;
      
      if (!celulas || celulas.length === 0) return [];
      
      const celulaIds = celulas.map(c => c.id);
      
      let query = supabase
        .from('weekly_reports')
        .select(`*, celula:celulas(id, name, coordenacao_id)`)
        .in('celula_id', celulaIds)
        .order('meeting_date', { ascending: false, nullsFirst: false })
        .order('week_start', { ascending: false });

      if (campoId) query = query.eq('campo_id', campoId);
      
      if (dateRange) {
        query = query.or(
          `and(meeting_date.gte.${dateRange.from},meeting_date.lte.${dateRange.to}),and(week_start.gte.${dateRange.from},week_start.lte.${dateRange.to})`
        );
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as WeeklyReport[];
    },
    enabled: !!coordenacaoId,
  });
}

export function useWeeklyReportsByRede(redeId?: string, dateRange?: DateRangeFilter) {
  const { isDemoActive, seedRunId, queryKeyExtra, campoId } = useDemoScope();

  return useQuery({
    queryKey: ['weekly-reports-rede', redeId, dateRange?.from, dateRange?.to, ...queryKeyExtra],
    queryFn: async () => {
      let coordQ = supabase.from('coordenacoes').select('id, name').eq('rede_id', redeId);
      if (campoId) coordQ = coordQ.eq('campo_id', campoId);
      const { data: coordenacoes } = await coordQ;
      
      if (!coordenacoes || coordenacoes.length === 0) return { reports: [], coordenacoes: [] };
      
      const coordenacaoIds = coordenacoes.map(c => c.id);
      
      let celulasQ = supabase.from('celulas').select('id, coordenacao_id').in('coordenacao_id', coordenacaoIds);
      if (campoId) celulasQ = celulasQ.eq('campo_id', campoId);
      const { data: celulas } = await celulasQ;
      
      if (!celulas || celulas.length === 0) return { reports: [], coordenacoes };
      
      const celulaIds = celulas.map(c => c.id);
      
      let query = supabase
        .from('weekly_reports')
        .select(`*, celula:celulas(id, name, coordenacao_id, coordenacao:coordenacoes(id, name))`)
        .in('celula_id', celulaIds)
        .order('meeting_date', { ascending: false, nullsFirst: false })
        .order('week_start', { ascending: false });

      if (campoId) query = query.eq('campo_id', campoId);
      
      if (dateRange) {
        query = query.or(
          `and(meeting_date.gte.${dateRange.from},meeting_date.lte.${dateRange.to}),and(week_start.gte.${dateRange.from},week_start.lte.${dateRange.to})`
        );
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { 
        reports: data as unknown as WeeklyReport[], 
        coordenacoes,
        celulas 
      };
    },
    enabled: !!redeId,
  });
}

export function useCreateWeeklyReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: WeeklyReportInput) => {
      const { data: existingReport } = await supabase
        .from('weekly_reports')
        .select('id')
        .eq('celula_id', input.celula_id)
        .eq('week_start', input.week_start)
        .maybeSingle();
      
      if (existingReport) {
        const { data, error } = await supabase
          .from('weekly_reports')
          .update({
            meeting_date: input.meeting_date,
            members_present: input.members_present,
            leaders_in_training: input.leaders_in_training,
            discipleships: input.discipleships,
            visitors: input.visitors,
            children: input.children,
            notes: input.notes,
            photo_url: input.photo_url,
            mensagem_whatsapp: input.mensagem_whatsapp,
            paixao_whatsapp: input.paixao_whatsapp,
            cultura_whatsapp: input.cultura_whatsapp,
          })
          .eq('id', existingReport.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Derive campo_id from celula if not provided
        let insertData: any = { ...input };
        if (!insertData.campo_id) {
          const { data: celula } = await supabase.from('celulas').select('campo_id').eq('id', input.celula_id).single();
          if (celula) insertData.campo_id = celula.campo_id;
        }
        const { data, error } = await supabase
          .from('weekly_reports')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports-coordenacao'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports-rede'] });
    },
  });
}

export function useUpdateWeeklyReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<WeeklyReportInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('weekly_reports')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports-coordenacao'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports-rede'] });
    },
  });
}

export function useDeleteWeeklyReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weekly_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports-coordenacao'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports-rede'] });
    },
  });
}
