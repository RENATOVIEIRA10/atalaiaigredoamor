import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useDemoMode } from '@/contexts/DemoModeContext';

export interface DemoGenerateResult {
  success: boolean;
  seed_run_id: string;
  status: 'done' | 'failed';
  modules: Record<string, { status: string; created?: number; error?: string }>;
}

export function useDemoActions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setDemoRunId, demoRunId } = useDemoMode();

  const generateDemo = useCallback(async (
    campusIds: string[] = ['ALL'],
    monthsBack: number = 3,
  ): Promise<DemoGenerateResult | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo', {
        body: { action: 'generate', campus_ids: campusIds, months_back: monthsBack },
      });
      if (error) throw new Error(error.message);
      if (data?.ok === false || data?.error) {
        const msg = data.message || data.error || 'Erro desconhecido';
        const cid = data.correlation_id || '';
        throw new Error(`${msg}${cid ? ` [${cid}]` : ''}`);
      }

      const result = data as DemoGenerateResult;
      if (result.success) {
        setDemoRunId(result.seed_run_id);
        toast({ title: '✅ Dataset demo gerado', description: `Run: ${result.seed_run_id.slice(0, 8)}` });
      } else {
        toast({ title: '⚠️ Demo gerado com falhas', description: `Status: ${result.status}`, variant: 'destructive' });
      }

      queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      toast({ title: 'Erro ao gerar demo', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast, queryClient, setDemoRunId]);

  const resetDemo = useCallback(async (
    campusIds: string[] = ['ALL'],
    monthsBack: number = 3,
  ): Promise<DemoGenerateResult | null> => {
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo', {
        body: {
          action: 'reset',
          old_seed_run_id: demoRunId,
          campus_ids: campusIds,
          months_back: monthsBack,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.ok === false || data?.error) {
        const msg = data.message || data.error || 'Erro desconhecido';
        const cid = data.correlation_id || '';
        throw new Error(`${msg}${cid ? ` [${cid}]` : ''}`);
      }

      const result = data as DemoGenerateResult;
      if (result.success) {
        setDemoRunId(result.seed_run_id);
        toast({ title: '🔄 Dataset demo regenerado', description: `Novo run: ${result.seed_run_id.slice(0, 8)}` });
      }

      queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      toast({ title: 'Erro ao resetar demo', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsResetting(false);
    }
  }, [toast, queryClient, demoRunId, setDemoRunId]);

  return { generateDemo, resetDemo, isGenerating, isResetting };
}
