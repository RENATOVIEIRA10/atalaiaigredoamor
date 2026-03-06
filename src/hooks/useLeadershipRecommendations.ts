import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useMembers } from '@/hooks/useMembers';
import { useCelulas } from '@/hooks/useCelulas';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useRedes } from '@/hooks/useRedes';
import { useCampos } from '@/hooks/useCampos';
import { useLeadershipCouples, getCoupleDisplayName } from '@/hooks/useLeadershipCouples';

export type LeadershipRecommendation = Tables<'leadership_recommendations'> & {
  recommended_profile?: { id: string; name: string; avatar_url: string | null; joined_church_at: string | null } | null;
  recommended_member?: { id: string; is_active: boolean; joined_at: string } | null;
  recommended_celula?: { id: string; name: string } | null;
  requested_by_profile?: { id: string; name: string } | null;
};

export interface CoupleJourneySummary {
  couple_id: string;
  couple_name: string;
  current_role: 'lider_celula';
  celula: string;
  coordenacao: string;
  rede: string;
  campo: string;
  tempo_igreja: string;
  tempo_igreja_meses: number | null;
  entry_date: string | null;
  birth_date: string | null;
  serve_ministry: boolean;
  ministries: string[];
  marcos: string[];
  members_in_celula: number | null;
  leader_since: string | null;
  leader_time_months: number | null;
}

export interface RecommendationJourneySnapshot {
  couple_name?: string;
  current_role?: string;
  celula?: string;
  coordenacao?: string;
  rede?: string;
  campo?: string;
  tempo_igreja?: string;
  entry_date?: string | null;
  birth_date?: string | null;
  serve_ministry?: boolean;
  ministries?: string[];
  marcos?: string[];
  members_in_celula?: number | null;
  leader_since?: string | null;
  leader_time_months?: number | null;
}

export function readRecommendationSnapshot(input: unknown): RecommendationJourneySnapshot {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return input as RecommendationJourneySnapshot;
}

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

function normalizeDate(date?: string | null) {
  return date || null;
}

function formatDateBr(date?: string | null) {
  if (!date) return 'Não informado';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Não informado';
  return parsed.toLocaleDateString('pt-BR');
}

function formatTimeInChurch(months: number | null) {
  if (months === null) return 'Não informado';
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${rem} meses`;
}

function getEarliestDate(values: Array<string | null | undefined>) {
  const valid = values
    .filter(Boolean)
    .map((d) => new Date(d as string))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return valid.length ? valid[0].toISOString().slice(0, 10) : null;
}

function getLatestBirthDate(values: Array<string | null | undefined>) {
  const valid = values.filter(Boolean) as string[];
  if (!valid.length) return null;
  return valid[0];
}

export function useRecommendationJourneyData(coupleId: string | null) {
  const { data: members } = useMembers();
  const { data: celulas } = useCelulas();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: redes } = useRedes();
  const { data: campos } = useCampos();
  const { data: couples } = useLeadershipCouples();

  const { data: leaderFunctions } = useQuery({
    queryKey: ['leadership_functions', 'celula_leader_start'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leadership_functions')
        .select('id, leadership_couple_id, created_at, function_type, active')
        .eq('function_type', 'celula_leader')
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  return useMemo(() => {
    if (!coupleId || !members || !celulas || !coordenacoes || !redes || !campos || !couples) return null;

    const couple = couples.find((c) => c.id === coupleId);
    if (!couple) return null;

    const celula = celulas.find((c) => c.leadership_couple_id === coupleId) || null;
    if (!celula) return null;

    const coordenacao = coordenacoes.find((c) => c.id === celula.coordenacao_id) || null;
    const rede = redes.find((r) => r.id === celula.rede_id) || null;
    const campo = campos.find((c) => c.id === celula.campo_id) || null;

    const spouseMembers = members.filter((m) => m.profile_id === couple.spouse1_id || m.profile_id === couple.spouse2_id);
    const spouse1Member = spouseMembers.find((m) => m.profile_id === couple.spouse1_id) || null;
    const spouse2Member = spouseMembers.find((m) => m.profile_id === couple.spouse2_id) || null;

    const entryDate = getEarliestDate([
      couple.spouse1?.joined_church_at,
      couple.spouse2?.joined_church_at,
      spouse1Member?.joined_at,
      spouse2Member?.joined_at,
    ]);

    const tempoIgrejaMeses = entryDate ? Math.max(0, differenceInMonths(new Date(), new Date(entryDate))) : null;

    const ministries = Array.from(new Set([
      ...(spouse1Member?.ministerios || []),
      ...(spouse2Member?.ministerios || []),
    ])).filter(Boolean);

    const marcos = Array.from(new Set([
      spouse1Member?.batismo || spouse2Member?.batismo ? 'Batizado' : null,
      spouse1Member?.encontro_com_deus || spouse2Member?.encontro_com_deus ? 'Encontro com Deus' : null,
      spouse1Member?.renovo || spouse2Member?.renovo ? 'Renovo' : null,
      spouse1Member?.curso_lidere || spouse2Member?.curso_lidere ? 'Curso Lidere' : null,
      spouse1Member?.is_discipulado || spouse2Member?.is_discipulado ? 'Discipulado concluído' : null,
      'Líder de célula ativo',
    ])).filter(Boolean) as string[];

    const activeMembersInCell = members.filter((m) => m.celula_id === celula.id && m.is_active).length;

    const leaderStarts = (leaderFunctions || [])
      .filter((f) => f.leadership_couple_id === coupleId)
      .map((f) => f.created_at)
      .sort();
    const leaderSince = leaderStarts.length > 0 ? leaderStarts[0] : null;
    const leaderTimeMonths = leaderSince ? Math.max(0, differenceInMonths(new Date(), new Date(leaderSince))) : null;

    const snapshot: CoupleJourneySummary = {
      couple_id: coupleId,
      couple_name: getCoupleDisplayName(couple) || 'Não informado',
      current_role: 'lider_celula',
      celula: celula.name || 'Não informado',
      coordenacao: coordenacao?.name || 'Não informado',
      rede: rede?.name || 'Não informado',
      campo: campo?.nome || 'Não informado',
      tempo_igreja: formatTimeInChurch(tempoIgrejaMeses),
      tempo_igreja_meses: tempoIgrejaMeses,
      entry_date: normalizeDate(entryDate),
      birth_date: normalizeDate(getLatestBirthDate([couple.spouse1?.birth_date, couple.spouse2?.birth_date])),
      serve_ministry: !!(spouse1Member?.serve_ministerio || spouse2Member?.serve_ministerio),
      ministries,
      marcos,
      members_in_celula: activeMembersInCell,
      leader_since: normalizeDate(leaderSince),
      leader_time_months: leaderTimeMonths,
    };

    return {
      couple,
      celula,
      coordenacao,
      rede,
      campo,
      spouse1Member,
      spouse2Member,
      snapshot,
      ui: {
        coupleName: snapshot.couple_name,
        celula: snapshot.celula,
        coordenacao: snapshot.coordenacao,
        rede: snapshot.rede,
        campo: snapshot.campo,
        tempoIgreja: snapshot.tempo_igreja,
        entryDate: formatDateBr(snapshot.entry_date),
        birthDate: formatDateBr(snapshot.birth_date),
        serveMinistry: snapshot.serve_ministry ? 'Sim' : 'Não',
        ministries: snapshot.ministries.length ? snapshot.ministries.join(', ') : 'Não informado',
        marcos: snapshot.marcos.length ? snapshot.marcos : ['Não informado'],
        membersInCelula: snapshot.members_in_celula ?? 'Não informado',
        role: 'Líder de célula',
        leaderSince: formatDateBr(snapshot.leader_since),
        leaderTime: snapshot.leader_time_months === null ? 'Não informado' : formatTimeInChurch(snapshot.leader_time_months),
      },
    };
  }, [coupleId, members, celulas, coordenacoes, redes, campos, couples, leaderFunctions]);
}
