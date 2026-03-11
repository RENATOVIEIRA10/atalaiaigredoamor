import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';

export interface CultoContagem {
  id: string;
  campo_id: string;
  data: string;
  horario: string | null;
  total_presentes: number;
  status: 'em_andamento' | 'encerrado';
  guardiao_user_id: string | null;
  novas_vidas_count: number;
  decisoes_espirituais: number;
  batismos_agendados: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveContagemPayload {
  id?: string;
  campo_id: string;
  data: string;
  horario: string | null;
  total_presentes: number;
  status: 'em_andamento' | 'encerrado';
  guardiao_user_id: string | null;
  novas_vidas_count: number;
  decisoes_espirituais: number;
  batismos_agendados: number;
  observacoes: string | null;
}

const OFFLINE_KEY = (campoId: string, data: string) =>
  `guardioes_offline_${campoId}_${data}`;

// ─── Persist active session locally (offline support) ─────────────────────────
export function saveOfflineSession(campoId: string, data: string, payload: Partial<SaveContagemPayload>) {
  localStorage.setItem(OFFLINE_KEY(campoId, data), JSON.stringify(payload));
}

export function loadOfflineSession(campoId: string, data: string): Partial<SaveContagemPayload> | null {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY(campoId, data));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOfflineSession(campoId: string, data: string) {
  localStorage.removeItem(OFFLINE_KEY(campoId, data));
}

// ─── Fetch active or today's contagem ─────────────────────────────────────────
export function useContagemHoje() {
  const { activeCampoId } = useCampo();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['culto-contagem-hoje', activeCampoId, today],
    enabled: !!activeCampoId,
    staleTime: 30_000,
    queryFn: async (): Promise<CultoContagem | null> => {
      const { data } = await (supabase as any)
        .from('culto_contagens')
        .select('*')
        .eq('campo_id', activeCampoId!)
        .eq('data', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
  });
}

// ─── Fetch history ─────────────────────────────────────────────────────────────
export function useContagemHistorico() {
  const { activeCampoId } = useCampo();

  return useQuery({
    queryKey: ['culto-contagem-historico', activeCampoId],
    enabled: !!activeCampoId,
    staleTime: 60_000,
    queryFn: async (): Promise<CultoContagem[]> => {
      const { data } = await (supabase as any)
        .from('culto_contagens')
        .select('*')
        .eq('campo_id', activeCampoId!)
        .eq('status', 'encerrado')
        .order('data', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
}

// ─── Save/upsert contagem ──────────────────────────────────────────────────────
export function useSaveContagem() {
  const qc = useQueryClient();
  const { activeCampoId } = useCampo();

  return useMutation({
    mutationFn: async (payload: SaveContagemPayload) => {
      const now = new Date().toISOString();
      if (payload.id) {
        const { data, error } = await (supabase as any)
          .from('culto_contagens')
          .update({ ...payload, updated_at: now })
          .eq('id', payload.id)
          .select()
          .single();
        if (error) throw error;
        return data as CultoContagem;
      } else {
        const { data, error } = await (supabase as any)
          .from('culto_contagens')
          .insert({ ...payload, updated_at: now })
          .select()
          .single();
        if (error) throw error;
        return data as CultoContagem;
      }
    },
    onSuccess: (saved: CultoContagem) => {
      const today = new Date().toISOString().split('T')[0];
      qc.invalidateQueries({ queryKey: ['culto-contagem-hoje', activeCampoId, today] });
      qc.invalidateQueries({ queryKey: ['culto-contagem-historico', activeCampoId] });
      if (saved.status === 'encerrado' && activeCampoId) {
        clearOfflineSession(activeCampoId, saved.data);
      }
    },
  });
}
