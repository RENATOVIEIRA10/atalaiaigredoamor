import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subMonths } from 'date-fns';

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

// ─── Usa supabase.functions.invoke (correto, sem precisar de VITE_SUPABASE_PROJECT_ID) ───
async function callSeedFunction(action: string, seedRunId: string, extra?: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke('seed-data', {
    body: { action, seed_run_id: seedRunId, ...extra },
  });
  if (error) throw new Error(error.message || 'Erro ao chamar função seed-data');
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─── Também usa invoke para export-csv ───
export function buildCSVExportUrl(type: string, params: {
  includeTest?: boolean;
  seedRunId?: string;
  coordenacaoId?: string;
  redeId?: string;
}) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const base = `${SUPABASE_URL}/functions/v1/export-csv`;
  const q = new URLSearchParams({ type });
  if (params.includeTest) q.set('include_test', 'true');
  if (params.seedRunId) q.set('seed_run_id', params.seedRunId);
  if (params.coordenacaoId) q.set('coordenacao_id', params.coordenacaoId);
  if (params.redeId) q.set('rede_id', params.redeId);
  return `${base}?${q.toString()}&apikey=${ANON_KEY}`;
}

export interface SeedStepResult {
  step: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  created?: number;
  error?: string;
}

export function useSeedActions(seedRunId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<SeedStepResult[]>([]);
  const [lastResult, setLastResult] = useState<Record<string, number> | null>(null);

  const updateStep = (step: string, updates: Partial<SeedStepResult>) => {
    setSteps(prev => prev.map(s => s.step === step ? { ...s, ...updates } : s));
  };

  const runAction = async (action: string, label: string, extra?: Record<string, string>) => {
    if (!seedRunId) return;
    setIsRunning(true);

    // Add/update step
    setSteps(prev => {
      const exists = prev.find(s => s.step === action);
      if (exists) return prev.map(s => s.step === action ? { ...s, status: 'running', error: undefined } : s);
      return [...prev, { step: action, label, status: 'running' }];
    });

    try {
      const result = await callSeedFunction(action, seedRunId, extra);
      setLastResult(result);
      updateStep(action, { status: 'done', created: result?.created ?? 0 });
      queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      toast({ title: '✓ Concluído', description: `${label}: ${result?.created ?? 0} registros criados` });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      updateStep(action, { status: 'failed', error: msg });

      // Mark seed run as failed
      if (seedRunId) {
        await supabase.from('seed_runs').update({
          status: 'failed',
          notes: `Falha em "${label}": ${msg}`,
        }).eq('id', seedRunId);
        queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      }

      toast({ title: '✗ Erro', description: `${label}: ${msg}`, variant: 'destructive' });
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
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      toast({ title: 'Erro na limpeza', description: msg, variant: 'destructive' });
      throw e;
    } finally {
      setIsRunning(false);
    }
  };

  const clearSteps = () => setSteps([]);

  return { runAction, runCleanup, isRunning, lastResult, steps, clearSteps };
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

export function getWeekCount(from: string, to: string): number {
  const a = new Date(from + 'T12:00:00Z');
  const b = new Date(to + 'T12:00:00Z');
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (7 * 24 * 60 * 60 * 1000)));
}
