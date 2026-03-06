import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useMembers } from '@/hooks/useMembers';
import { useCelulas } from '@/hooks/useCelulas';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useRedes } from '@/hooks/useRedes';
import { differenceInMonths } from 'date-fns';

export type LeadershipRecommendation = Tables<'leadership_recommendations'> & {
  recommended_profile?: { id: string; name: string; avatar_url: string | null; joined_church_at: string | null } | null;
  recommended_member?: { id: string; is_active: boolean; joined_at: string } | null;
  recommended_celula?: { id: string; name: string } | null;
  requested_by_profile?: { id: string; name: string } | null;
};

export function useLeadershipRecommendations() {
  const { scopeId, scopeType } = useRole();

  return useQuery({
    queryKey: ['leadership_recommendations', scopeType, scopeId],
    queryFn: async () => {
      let query = supabase
        .from('leadership_recommendations')
        .select(`
          *,
          recommended_profile:profiles!leadership_recommendations_recommended_profile_id_fkey(id, name, avatar_url, joined_church_at),
          recommended_member:members!leadership_recommendations_recommended_member_id_fkey(id, is_active, joined_at),
          recommended_celula:celulas!leadership_recommendations_recommended_celula_id_fkey(id, name),
          requested_by_profile:profiles!leadership_recommendations_requested_by_profile_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (scopeType === 'rede' && scopeId) {
        query = query.eq('target_reviewer_scope_type', 'rede').eq('rede_id', scopeId);
      } else if (scopeType === 'pastor_de_campo') {
        query = query.eq('target_reviewer_scope_type', 'pastor_campo');
      } else if (scopeType === 'coordenacao' && scopeId) {
        query = query.eq('requested_by_scope_type', 'coordenacao').eq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeadershipRecommendation[];
    },
  });
}

export function useCreateLeadershipRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: TablesInsert<'leadership_recommendations'>) => {
      const { data, error } = await supabase
        .from('leadership_recommendations')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadership_recommendations'] });
      toast({ title: 'Indicação enviada', description: 'Essa indicação não altera automaticamente a função da pessoa.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar indicação', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateLeadershipRecommendationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewerNotes,
    }: {
      id: string;
      status: 'reviewed' | 'approved' | 'declined' | 'archived';
      reviewerNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from('leadership_recommendations')
        .update({
          status,
          reviewer_notes: reviewerNotes ?? null,
          reviewer_user_id: user?.id ?? null,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadership_recommendations'] });
      toast({ title: 'Status atualizado', description: 'Somente o status da indicação foi alterado.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRecommendationJourneyData(profileId: string | null) {
  const { data: members } = useMembers();
  const { data: celulas } = useCelulas();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: redes } = useRedes();

  return useMemo(() => {
    if (!profileId || !members || !celulas || !coordenacoes || !redes) return null;

    const member = members.find((m) => m.profile_id === profileId);
    if (!member) return null;

    const celula = celulas.find((c) => c.id === member.celula_id) || null;
    const coordenacao = celula ? coordenacoes.find((c) => c.id === celula.coordenacao_id) : null;
    const rede = celula ? redes.find((r) => r.id === celula.rede_id) : null;

    const joinedAt = member.profile?.joined_church_at ?? null;
    const joinedAtMember = member.joined_at ?? null;
    const referenceDate = joinedAt || joinedAtMember;
    const tempoIgrejaMeses = referenceDate ? Math.max(0, differenceInMonths(new Date(), new Date(referenceDate))) : null;

    const marcos = [
      member.batismo ? 'batizado' : null,
      member.encontro_com_deus ? 'encontro_com_deus' : null,
      member.renovo ? 'renovo' : null,
      member.curso_lidere ? 'curso_lidere' : null,
      member.is_discipulado ? 'discipulado' : null,
      member.is_lider_em_treinamento ? 'lider_em_treinamento' : null,
    ].filter(Boolean) as string[];

    return {
      member,
      celula,
      coordenacao,
      rede,
      snapshot: {
        tempo_igreja_meses: tempoIgrejaMeses,
        marcos,
        serve_hoje: !!member.serve_ministerio,
        funcao_atual: member.observacao_servico || (member.is_lider_em_treinamento ? 'lider_em_treinamento' : 'membro'),
        celula: celula?.name || null,
        rede: rede?.name || null,
      },
    };
  }, [profileId, members, celulas, coordenacoes, redes]);
}
