import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DiscipuladoNivel = 'celula' | 'coordenacao' | 'rede';

export interface DiscipuladoEncontro {
  id: string;
  celula_id: string | null;
  coordenacao_id: string | null;
  rede_id: string | null;
  nivel: DiscipuladoNivel;
  data_encontro: string;
  realizado: boolean;
  observacao: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  presencas?: DiscipuladoPresenca[];
}

export interface DiscipuladoPresenca {
  id: string;
  encontro_id: string;
  member_id: string | null;
  profile_id: string | null;
  presente: boolean;
  created_at: string;
}

const ENCONTRO_SELECT = `id, celula_id, coordenacao_id, rede_id, nivel, data_encontro, realizado, observacao, created_by, created_at, updated_at`;

// ── Encontros por célula (nível célula) ──
export function useDiscipuladoEncontros(celulaId?: string) {
  return useQuery({
    queryKey: ['discipulado-encontros', celulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(ENCONTRO_SELECT)
        .eq('celula_id', celulaId!)
        .eq('nivel', 'celula')
        .order('data_encontro', { ascending: false });
      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!celulaId,
  });
}

// ── Encontros por coordenação (nível coordenação — coord discipulando líderes) ──
export function useDiscipuladoEncontrosCoord(coordId?: string) {
  return useQuery({
    queryKey: ['discipulado-encontros-coord', coordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(ENCONTRO_SELECT)
        .eq('coordenacao_id', coordId!)
        .eq('nivel', 'coordenacao')
        .order('data_encontro', { ascending: false });
      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!coordId,
  });
}

// ── Encontros por rede (nível rede — rede discipulando coordenadores) ──
export function useDiscipuladoEncontrosRede(redeId?: string) {
  return useQuery({
    queryKey: ['discipulado-encontros-rede', redeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(ENCONTRO_SELECT)
        .eq('rede_id', redeId!)
        .eq('nivel', 'rede')
        .order('data_encontro', { ascending: false });
      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!redeId,
  });
}

// ── Encontros de células de uma coordenação (visão de cima) ──
export function useDiscipuladoByCoordenacao(coordId?: string) {
  return useQuery({
    queryKey: ['discipulado-coordenacao', coordId],
    queryFn: async () => {
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id')
        .eq('coordenacao_id', coordId!);
      if (!celulas?.length) return [];
      const celulaIds = celulas.map(c => c.id);
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(ENCONTRO_SELECT)
        .in('celula_id', celulaIds)
        .eq('nivel', 'celula')
        .order('data_encontro', { ascending: false });
      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
    enabled: !!coordId,
  });
}

// ── Encontros de células de uma rede (visão de cima) ──
export function useDiscipuladoByRede(redeId?: string) {
  return useQuery({
    queryKey: ['discipulado-rede', redeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(ENCONTRO_SELECT)
        .eq('rede_id', redeId!)
        .eq('nivel', 'celula')
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
        .select('id, encontro_id, member_id, profile_id, presente, created_at')
        .eq('encontro_id', encontroId!);
      if (error) throw error;
      return data as DiscipuladoPresenca[];
    },
    enabled: !!encontroId,
  });
}

// ── Encontro detail ──
export function useDiscipuladoEncontroComPresencas(encontroId?: string) {
  return useQuery({
    queryKey: ['discipulado-encontro-detail', encontroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select(ENCONTRO_SELECT)
        .eq('id', encontroId!)
        .single();
      if (error) throw error;
      const { data: presencas, error: presError } = await supabase
        .from('discipulado_presencas')
        .select('id, encontro_id, member_id, profile_id, presente, created_at')
        .eq('encontro_id', encontroId!);
      if (presError) throw presError;
      return { ...data, presencas } as DiscipuladoEncontro;
    },
    enabled: !!encontroId,
  });
}

// ── Criar encontro genérico (todos os níveis) ──
export function useCreateDiscipuladoEncontro() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      celula_id?: string | null;
      coordenacao_id?: string | null;
      rede_id?: string | null;
      nivel?: DiscipuladoNivel;
      data_encontro: string;
      realizado: boolean;
      observacao?: string;
      presencas: { member_id?: string; profile_id?: string; presente: boolean }[];
    }) => {
      const nivel = params.nivel || 'celula';
      const { data: encontro, error } = await supabase
        .from('discipulado_encontros')
        .insert({
          celula_id: params.celula_id || null,
          coordenacao_id: params.coordenacao_id || null,
          rede_id: params.rede_id || null,
          nivel,
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
          member_id: p.member_id || null,
          profile_id: p.profile_id || null,
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
      queryClient.invalidateQueries({ queryKey: ['discipulado-encontros-coord'] });
      queryClient.invalidateQueries({ queryKey: ['discipulado-encontros-rede'] });
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
      queryClient.invalidateQueries({ queryKey: ['discipulado-encontros-coord'] });
      queryClient.invalidateQueries({ queryKey: ['discipulado-encontros-rede'] });
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
