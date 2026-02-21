/**
 * useSupervisionSwaps – CRUD for supervision swap proposals ("bate-bola")
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BIMESTRE_START } from './usePlanejamentoBimestral';
import { useToast } from './use-toast';

export interface SwapProposal {
  id: string;
  bimestre_start: string;
  proposer_supervisor_id: string;
  proposer_celula_id: string;
  target_supervisor_id: string;
  target_celula_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at: string | null;
}

export function useSupervisionSwaps(coordenacaoId: string) {
  return useQuery({
    queryKey: ['supervision-swaps', coordenacaoId, BIMESTRE_START],
    queryFn: async () => {
      // Fetch supervisors for this coordenação
      const { data: sups } = await supabase
        .from('supervisores')
        .select('id')
        .eq('coordenacao_id', coordenacaoId);

      const supIds = (sups || []).map(s => s.id);
      if (supIds.length === 0) return [];

      const { data, error } = await supabase
        .from('supervision_swaps')
        .select('*')
        .eq('bimestre_start', BIMESTRE_START)
        .or(`proposer_supervisor_id.in.(${supIds.join(',')}),target_supervisor_id.in.(${supIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SwapProposal[];
    },
    enabled: !!coordenacaoId,
  });
}

export function useCreateSwap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (swap: {
      proposer_supervisor_id: string;
      proposer_celula_id: string;
      target_supervisor_id: string;
      target_celula_id: string;
    }) => {
      const { error } = await supabase
        .from('supervision_swaps')
        .insert({
          bimestre_start: BIMESTRE_START,
          ...swap,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-swaps'] });
      toast({ title: 'Proposta enviada!', description: 'Aguardando resposta do outro supervisor.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível enviar a proposta.', variant: 'destructive' });
    },
  });
}

export function useRespondSwap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ swapId, accept }: { swapId: string; accept: boolean }) => {
      const { error } = await supabase
        .from('supervision_swaps')
        .update({
          status: accept ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', swapId);
      if (error) throw error;
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ['supervision-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['planejamento-bimestral'] });
      toast({
        title: accept ? 'Troca aceita!' : 'Troca recusada',
        description: accept ? 'O planejamento foi atualizado automaticamente.' : 'A proposta foi recusada.',
      });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível responder à proposta.', variant: 'destructive' });
    },
  });
}
