import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SeedRun {
  id: string;
  name: string;
  environment: 'dev' | 'prod';
  created_by: string | null;
  created_at: string;
  status: 'running' | 'done' | 'failed';
  totals: Record<string, number | string>;
  notes: string | null;
  cleaned_at: string | null;
}

export type SeedPeriodPreset = '1m' | '3m' | '6m' | '12m' | 'custom';

export function useSeedRuns() {
  return useQuery({
    queryKey: ['seed_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seed_runs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SeedRun[];
    },
  });
}

export function useCreateSeedRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; environment: 'dev' | 'prod'; notes?: string }) => {
      const { data, error } = await supabase
        .from('seed_runs')
        .insert({ ...params, status: 'running' })
        .select()
        .single();
      if (error) throw error;
      return data as SeedRun;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seed_runs'] }),
  });
}

export function useUpdateSeedRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status?: string; notes?: string; cleaned_at?: string }) => {
      const { error } = await supabase.from('seed_runs').update(params).eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seed_runs'] }),
  });
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callSeedFunction(action: string, seedRunId: string, extra?: Record<string, string>) {
  const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/seed-data`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, seed_run_id: seedRunId, ...extra }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro desconhecido');
  return json;
}

export function useSeedActions(seedRunId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, number> | null>(null);

  const runAction = async (action: string, extra?: Record<string, string>) => {
    if (!seedRunId) return;
    setIsRunning(true);
    try {
      const result = await callSeedFunction(action, seedRunId, extra);
      setLastResult(result);
      queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      toast({ title: 'Concluído', description: `${result.created ?? 0} registros criados` });
      return result;
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro inesperado', variant: 'destructive' });
      throw e;
    } finally {
      setIsRunning(false);
    }
  };

  const runCleanup = async (targetSeedRunId: string) => {
    setIsRunning(true);
    try {
      await callSeedFunction('cleanup', targetSeedRunId);
      queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      toast({ title: 'Limpeza concluída', description: 'Dados de teste removidos com sucesso' });
    } catch (e) {
      toast({ title: 'Erro na limpeza', description: e instanceof Error ? e.message : 'Erro inesperado', variant: 'destructive' });
      throw e;
    } finally {
      setIsRunning(false);
    }
  };

  return { runAction, runCleanup, isRunning, lastResult };
}

export function getPeriodDates(preset: SeedPeriodPreset, customFrom?: string, customTo?: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  if (preset === 'custom') {
    return { from: customFrom || fmt(subDays(today, 30)), to: customTo || fmt(today) };
  }
  const months = preset === '1m' ? 1 : preset === '3m' ? 3 : preset === '6m' ? 6 : 12;
  return { from: fmt(subMonths(today, months)), to: fmt(today) };
}

export function buildCSVExportUrl(type: string, params: {
  includeTest?: boolean;
  seedRunId?: string;
  coordenacaoId?: string;
  redeId?: string;
}) {
  const base = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/export-csv`;
  const q = new URLSearchParams({ type });
  if (params.includeTest) q.set('include_test', 'true');
  if (params.seedRunId) q.set('seed_run_id', params.seedRunId);
  if (params.coordenacaoId) q.set('coordenacao_id', params.coordenacaoId);
  if (params.redeId) q.set('rede_id', params.redeId);
  return `${base}?${q.toString()}`;
}
