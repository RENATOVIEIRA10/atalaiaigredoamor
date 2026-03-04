import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import { useDemoScope } from './useDemoScope';

export interface ConversionsMetrics {
  /** Total de novas vidas cadastradas (conversões via Recomeço) */
  conversoes: number;
  /** Novas vidas dos últimos 90 dias */
  conversoes90dias: number;
  /** Novos membros cadastrados nos últimos 90 dias */
  novosMembros90dias: number;
}

export function useConversionsMetrics(overrideCampoId?: string | null) {
  const { campoId: scopeCampoId } = useDemoScope();
  const campoId = overrideCampoId !== undefined ? overrideCampoId : scopeCampoId;

  return useQuery({
    queryKey: ['conversions-metrics', campoId ?? 'global'],
    staleTime: 60_000,
    queryFn: async (): Promise<ConversionsMetrics> => {
      const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

      // Total conversões (novas_vidas)
      let totalQ = supabase.from('novas_vidas').select('id', { count: 'exact', head: true });
      if (campoId) totalQ = totalQ.eq('campo_id', campoId);

      // Conversões últimos 90 dias
      let recentQ = supabase.from('novas_vidas').select('id', { count: 'exact', head: true })
        .gte('created_at', ninetyDaysAgo);
      if (campoId) recentQ = recentQ.eq('campo_id', campoId);

      // Novos membros últimos 90 dias
      let membrosQ = supabase.from('members').select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('joined_at', ninetyDaysAgo);
      if (campoId) membrosQ = membrosQ.eq('campo_id', campoId);

      const [totalRes, recentRes, membrosRes] = await Promise.all([totalQ, recentQ, membrosQ]);

      return {
        conversoes: totalRes.count || 0,
        conversoes90dias: recentRes.count || 0,
        novosMembros90dias: membrosRes.count || 0,
      };
    },
  });
}
