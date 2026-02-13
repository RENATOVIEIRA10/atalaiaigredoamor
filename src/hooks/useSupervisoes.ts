import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supervisor {
  id: string;
  profile_id: string;
  coordenacao_id: string;
  leadership_couple_id?: string | null;
  ordem?: number;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    name: string;
  };
  coordenacao?: {
    id: string;
    name: string;
  };
  leadership_couple?: {
    id: string;
    spouse1_id: string;
    spouse2_id: string;
    spouse1?: { id: string; name: string; avatar_url: string | null; email: string | null };
    spouse2?: { id: string; name: string; avatar_url: string | null; email: string | null };
  } | null;
}

export interface Supervisao {
  id: string;
  celula_id: string;
  supervisor_id: string;
  data_supervisao: string;
  horario_inicio: string;
  horario_termino: string;
  celula_realizada: boolean;
  motivo_cancelamento: string | null;
  oracao_inicial: boolean;
  louvor: boolean;
  apresentacao_visitantes: boolean;
  momento_visao_triade: boolean;
  avisos: boolean;
  quebra_gelo: boolean;
  licao: boolean;
  cadeira_amor: boolean;
  oracao_final: boolean;
  selfie: boolean;
  comunhao: boolean;
  pontualidade: boolean;
  dinamica: boolean;
  organizacao: boolean;
  interatividade: boolean;
  pontos_alinhar: string | null;
  pontos_positivos: string | null;
  created_at: string;
  updated_at: string;
  celula?: {
    id: string;
    name: string;
    leader_id: string | null;
    leader?: {
      id: string;
      name: string;
    };
    coordenacao_id: string;
    coordenacao?: {
      id: string;
      name: string;
      rede_id: string;
    };
  };
  supervisor?: Supervisor;
}

export interface SupervisaoInput {
  celula_id: string;
  supervisor_id: string;
  data_supervisao: string;
  horario_inicio: string;
  horario_termino: string;
  celula_realizada: boolean;
  motivo_cancelamento?: string | null;
  oracao_inicial?: boolean;
  louvor?: boolean;
  apresentacao_visitantes?: boolean;
  momento_visao_triade?: boolean;
  avisos?: boolean;
  quebra_gelo?: boolean;
  licao?: boolean;
  cadeira_amor?: boolean;
  oracao_final?: boolean;
  selfie?: boolean;
  comunhao?: boolean;
  pontualidade?: boolean;
  dinamica?: boolean;
  organizacao?: boolean;
  interatividade?: boolean;
  pontos_alinhar?: string | null;
  pontos_positivos?: string | null;
}

// Hook para buscar supervisores de uma coordenação
export function useSupervisoresByCoordenacao(coordenacaoId: string) {
  return useQuery({
    queryKey: ['supervisores', 'coordenacao', coordenacaoId],
    queryFn: async () => {
      if (!coordenacaoId) return [];
      const { data, error } = await supabase
        .from('supervisores')
        .select(`
          *,
          profile:profiles!supervisores_profile_id_fkey(id, name),
          coordenacao:coordenacoes(id, name),
          leadership_couple:leadership_couples(
            id, spouse1_id, spouse2_id,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url, email),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url, email)
          )
        `)
        .eq('coordenacao_id', coordenacaoId)
        .order('ordem');
      if (error) throw error;
      return data as Supervisor[];
    },
    enabled: !!coordenacaoId,
  });
}

// Hook para buscar todos os supervisores
export function useSupervisores() {
  return useQuery({
    queryKey: ['supervisores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supervisores')
        .select(`
          *,
          profile:profiles!supervisores_profile_id_fkey(id, name),
          coordenacao:coordenacoes(id, name),
          leadership_couple:leadership_couples(
            id, spouse1_id, spouse2_id,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url, email),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url, email)
          )
        `)
        .order('ordem');
      if (error) throw error;
      return data as Supervisor[];
    },
  });
}

// Hook para buscar supervisões de uma coordenação
export function useSupervisoesByCoordenacao(coordenacaoId: string) {
  return useQuery({
    queryKey: ['supervisoes', 'coordenacao', coordenacaoId],
    queryFn: async () => {
      if (!coordenacaoId) return [];
      const { data, error } = await supabase
        .from('supervisoes')
        .select(`
          *,
          celula:celulas(
            id, 
            name, 
            leader_id,
            coordenacao_id,
            coordenacao:coordenacoes(id, name, rede_id)
          ),
          supervisor:supervisores(
            id,
            profile:profiles(id, name),
            coordenacao:coordenacoes(id, name)
          )
        `)
        .eq('celula.coordenacao_id', coordenacaoId)
        .order('data_supervisao', { ascending: false });
      
      if (error) throw error;
      
      // Filter out results where celula is null (join didn't match)
      const filteredData = (data || []).filter(s => s.celula !== null);
      return filteredData as Supervisao[];
    },
    enabled: !!coordenacaoId,
  });
}

// Hook para buscar supervisões por supervisor
export function useSupervisoesBySupervisor(supervisorId: string) {
  return useQuery({
    queryKey: ['supervisoes', 'supervisor', supervisorId],
    queryFn: async () => {
      if (!supervisorId) return [];
      const { data, error } = await supabase
        .from('supervisoes')
        .select(`
          *,
          celula:celulas(
            id, 
            name, 
            leader_id,
            coordenacao_id,
            coordenacao:coordenacoes(id, name, rede_id)
          ),
          supervisor:supervisores(
            id,
            profile:profiles(id, name),
            coordenacao:coordenacoes(id, name)
          )
        `)
        .eq('supervisor_id', supervisorId)
        .order('data_supervisao', { ascending: false });
      
      if (error) throw error;
      return data as Supervisao[];
    },
    enabled: !!supervisorId,
  });
}

// Hook para buscar supervisões por rede
export function useSupervisoesByRede(redeId: string) {
  return useQuery({
    queryKey: ['supervisoes', 'rede', redeId],
    queryFn: async () => {
      if (!redeId) return [];
      const { data, error } = await supabase
        .from('supervisoes')
        .select(`
          *,
          celula:celulas(
            id, 
            name, 
            leader_id,
            coordenacao_id,
            coordenacao:coordenacoes(id, name, rede_id)
          ),
          supervisor:supervisores(
            id,
            profile:profiles(id, name),
            coordenacao:coordenacoes(id, name)
          )
        `)
        .order('data_supervisao', { ascending: false });
      
      if (error) throw error;
      
      // Filter by rede
      const filteredData = (data || []).filter(s => 
        s.celula?.coordenacao?.rede_id === redeId
      );
      return filteredData as Supervisao[];
    },
    enabled: !!redeId,
  });
}

// Hook para criar supervisão
export function useCreateSupervisao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: SupervisaoInput) => {
      const { data, error } = await supabase
        .from('supervisoes')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisoes'] });
      toast({
        title: 'Sucesso!',
        description: 'Supervisão registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao registrar supervisão: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para atualizar supervisão
export function useUpdateSupervisao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: SupervisaoInput & { id: string }) => {
      const { data, error } = await supabase
        .from('supervisoes')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisoes'] });
      toast({
        title: 'Sucesso!',
        description: 'Supervisão atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar supervisão: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para deletar supervisão
export function useDeleteSupervisao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supervisoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisoes'] });
      toast({
        title: 'Sucesso!',
        description: 'Supervisão removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao remover supervisão: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para criar supervisor
export function useCreateSupervisor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { profile_id: string; coordenacao_id: string }) => {
      const { data, error } = await supabase
        .from('supervisores')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      toast({
        title: 'Sucesso!',
        description: 'Supervisor cadastrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar supervisor: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para deletar supervisor
export function useDeleteSupervisor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supervisores')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      toast({
        title: 'Sucesso!',
        description: 'Supervisor removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao remover supervisor: ' + error.message,
        variant: 'destructive',
      });
    },
  });
}
