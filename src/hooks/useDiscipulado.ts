import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DiscipuladoEncontro {
  id: string;
  celula_id: string;
  rede_id: string | null;
  data_encontro: string;
  realizado: boolean;
  observacao: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  presencas?: DiscipuladoPresenca[];
  celula?: { id: string; name: string; coordenacao_id: string } | null;
}

export interface DiscipuladoPresenca {
  id: string;
  encontro_id: string;
  member_id: string;
  presente: boolean;
  created_at: string;
  member?: {
    id: string;
    profile: { id: string; name: string; avatar_url: string | null } | null;
  } | null;
}

// ── Encontros por célula ──
export function useDiscipuladoEncontros(celulaId?: string) {
  return useQuery({
    queryKey: ['discipulado-encontros', celulaId],
    queryFn: async () => {
      let query = supabase
        .from('discipulado_encontros')
        .select(`
          id, celula_id, rede_id, data_encontro, realizado, observacao,
          created_by, created_at, updated_at
        `)
        .order('data_encontro', { ascending: false });

      if (celulaId) query = query.eq('celula_id', celulaId);

      const { data, error } = await query;
      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!celulaId,
  });
}

// ── Encontros com presenças (para visão detalhada) ──
export function useDiscipuladoEncontroComPresencas(encontroId?: string) {
  return useQuery({
    queryKey: ['discipulado-encontro-detail', encontroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(`
          id, celula_id, rede_id, data_encontro, realizado, observacao,
          created_by, created_at, updated_at
        `)
        .eq('id', encontroId!)
        .single();

      if (error) throw error;

      const { data: presencas, error: presError } = await supabase
        .from('discipulado_presencas')
        .select(`
          id, encontro_id, member_id, presente, created_at
        `)
        .eq('encontro_id', encontroId!);

      if (presError) throw presError;

      return { ...data, presencas } as DiscipuladoEncontro;
    },
    enabled: !!encontroId,
  });
}

// ── Encontros por coordenação (todas as células da coord) ──
export function useDiscipuladoByCoordenacao(coordId?: string) {
  return useQuery({
    queryKey: ['discipulado-coordenacao', coordId],
    queryFn: async () => {
      // Get cells of this coordination
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id')
        .eq('coordenacao_id', coordId!);

      if (!celulas?.length) return [];

      const celulaIds = celulas.map(c => c.id);
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(`
          id, celula_id, rede_id, data_encontro, realizado, observacao,
          created_by, created_at, updated_at
        `)
        .in('celula_id', celulaIds)
        .order('data_encontro', { ascending: false });

      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!coordId,
  });
}

// ── Encontros por rede ──
export function useDiscipuladoByRede(redeId?: string) {
  return useQuery({
    queryKey: ['discipulado-rede', redeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(`
          id, celula_id, rede_id, data_encontro, realizado, observacao,
          created_by, created_at, updated_at
        `)
        .eq('rede_id', redeId!)
        .order('data_encontro', { ascending: false });

      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!redeId,
  });
}

// ── Presenças de um encontro ──
export function useDiscipuladoPresencas(encontroId?: string) {
  return useQuery({
    queryKey: ['discipulado-presencas', encontroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_presencas')
        .select('id, encontro_id, member_id, presente, created_at')
        .eq('encontro_id', encontroId!);

      if (error) throw error;
      return data as DiscipuladoPresenca[];
    },
    enabled: !!encontroId,
  });
}

// ── Criar encontro com presenças ──
export function useCreateDiscipuladoEncontro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      celula_id: string;
      rede_id?: string | null;
      data_encontro: string;
      realizado: boolean;
      observacao?: string;
      presencas: { member_id: string; presente: boolean }[];
    }) => {
      const { data: encontro, error } = await supabase
        .from('discipulado_encontros')
        .insert({
          celula_id: params.celula_id,
          rede_id: params.rede_id || null,
          data_encontro: params.data_encontro,
          realizado: params.realizado,
          observacao: params.observacao || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (params.presencas.length > 0) {
        const presencaRows = params.presencas.map(p => ({
          encontro_id: encontro.id,
          member_id: p.member_id,
          presente: p.presente,
        }));
        const { error: pErr } = await supabase
          .from('discipulado_presencas')
          .insert(presencaRows);
        if (pErr) throw pErr;
      }

      return encontro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipulado-encontros'] });
      queryClient.invalidateQueries({ queryKey: ['discipulado-coordenacao'] });
      queryClient.invalidateQueries({ queryKey: ['discipulado-rede'] });
      toast({ title: 'Encontro registrado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar encontro', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Deletar encontro ──
export function useDeleteDiscipuladoEncontro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (encontroId: string) => {
      const { error } = await supabase
        .from('discipulado_encontros')
        .delete()
        .eq('id', encontroId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipulado-encontros'] });
      queryClient.invalidateQueries({ queryKey: ['discipulado-coordenacao'] });
      queryClient.invalidateQueries({ queryKey: ['discipulado-rede'] });
      toast({ title: 'Encontro removido' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Stats helpers ──
export function calcDiscipuladoStats(encontros: DiscipuladoEncontro[]) {
  const year = new Date().getFullYear();
  const thisYear = encontros.filter(e => new Date(e.data_encontro).getFullYear() === year);
  const realizados = thisYear.filter(e => e.realizado);
  const totalMeses = new Date().getMonth(); // 0-indexed = months elapsed
  const constancia = totalMeses > 0 ? Math.round((realizados.length / totalMeses) * 100) : (realizados.length > 0 ? 100 : 0);

  return {
    totalEncontros: realizados.length,
    constancia: Math.min(constancia, 100),
  };
}
