import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format } from 'date-fns';

export type RoteiroItem = {
  tipo: string;
  responsavel_nome: string;
  responsavel_membro_id?: string | null;
  observacao?: string | null;
};

export const ROTEIRO_TIPOS = [
  { key: 'oracao_inicial', label: 'Oração inicial', emoji: '🙏' },
  { key: 'quebra_gelo', label: 'Quebra-gelo', emoji: '🧊' },
  { key: 'palavra', label: 'Palavra', emoji: '📖' },
  { key: 'cadeira_do_amor', label: 'Cadeira do Amor', emoji: '🪑' },
  { key: 'oracao_lanche', label: 'Oração do lanche', emoji: '🍞' },
  { key: 'oracao_final', label: 'Oração final', emoji: '🙌' },
] as const;

export function getWeekStart(date: Date = new Date()) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

export function useRoteiros(celulaId: string) {
  return useQuery({
    queryKey: ['roteiros', celulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roteiros_celula')
        .select('*')
        .eq('celula_id', celulaId)
        .order('semana_inicio', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!celulaId,
  });
}

export function useRoteiroSemana(celulaId: string, semanaInicio: string) {
  return useQuery({
    queryKey: ['roteiro', celulaId, semanaInicio],
    queryFn: async () => {
      const { data: roteiro, error } = await supabase
        .from('roteiros_celula')
        .select('*')
        .eq('celula_id', celulaId)
        .eq('semana_inicio', semanaInicio)
        .maybeSingle();
      if (error) throw error;
      if (!roteiro) return null;

      const { data: itens, error: itensError } = await supabase
        .from('roteiro_itens')
        .select('*')
        .eq('roteiro_id', roteiro.id);
      if (itensError) throw itensError;

      return { ...roteiro, itens: itens || [] };
    },
    enabled: !!celulaId && !!semanaInicio,
  });
}

export function useSaveRoteiro(celulaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      semanaInicio,
      dataReuniao,
      redeId,
      criadoPor,
      status,
      itens,
      campoId,
    }: {
      semanaInicio: string;
      dataReuniao: string;
      redeId?: string | null;
      criadoPor?: string | null;
      status: string;
      itens: RoteiroItem[];
      campoId: string;
    }) => {
      // Upsert roteiro
      const { data: roteiro, error } = await supabase
        .from('roteiros_celula')
        .upsert(
          {
            celula_id: celulaId,
            semana_inicio: semanaInicio,
            data_reuniao: dataReuniao,
            rede_id: redeId || null,
            criado_por: criadoPor || null,
            status,
            campo_id: campoId,
          } as any,
          { onConflict: 'celula_id,semana_inicio' }
        )
        .select()
        .single();
      if (error) throw error;

      // Delete old itens and insert new
      await supabase.from('roteiro_itens').delete().eq('roteiro_id', roteiro.id);

      if (itens.length > 0) {
        const { error: itensError } = await supabase
          .from('roteiro_itens')
          .insert(
            itens.map((item) => ({
              roteiro_id: roteiro.id,
              tipo: item.tipo,
              responsavel_nome: item.responsavel_nome || null,
              responsavel_membro_id: item.responsavel_membro_id || null,
              observacao: item.observacao || null,
            }))
          );
        if (itensError) throw itensError;
      }

      return roteiro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiro', celulaId] });
      queryClient.invalidateQueries({ queryKey: ['roteiros', celulaId] });
    },
  });
}

export function useUpdateRoteiroStatus(celulaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roteiroId, status }: { roteiroId: string; status: string }) => {
      const { error } = await supabase
        .from('roteiros_celula')
        .update({ status })
        .eq('id', roteiroId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roteiro', celulaId] });
      queryClient.invalidateQueries({ queryKey: ['roteiros', celulaId] });
    },
  });
}
