import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { getScopeLevel } from '@/hooks/useSummaryMetrics';
import { ONBOARDING_STEPS } from '@/lib/appMap';

const MAX_VISITS = 10;

export function useOnboarding() {
  const { user } = useAuth();
  const { scopeType } = useRole();
  const level = getScopeLevel(scopeType);
  const qc = useQueryClient();

  const { data: state, isLoading } = useQuery({
    queryKey: ['onboarding-state', user?.id, level],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_onboarding_state' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('scope_type', level)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user?.id && !!scopeType,
  });

  const steps = ONBOARDING_STEPS[level] || [];
  const completedSteps: string[] = (state?.completed_steps as string[]) || [];
  const visitsCount = (state?.visits_count as number) || 0;
  const dismissed = (state?.dismissed as boolean) || false;
  const shouldShow = !dismissed && visitsCount <= MAX_VISITS && steps.length > 0;
  const currentStepIndex = completedSteps.length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  const upsertState = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!user?.id) return;
      const existing = state;
      if (existing) {
        await supabase
          .from('user_onboarding_state' as any)
          .update({ ...updates, updated_at: new Date().toISOString() } as any)
          .eq('id', (existing as any).id);
      } else {
        await supabase
          .from('user_onboarding_state' as any)
          .insert({ user_id: user.id, scope_type: level, ...updates } as any);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-state'] }),
  });

  const incrementVisit = () => {
    upsertState.mutate({
      visits_count: visitsCount + 1,
      last_seen_at: new Date().toISOString(),
    });
  };

  const completeStep = (stepId: string) => {
    if (completedSteps.includes(stepId)) return;
    upsertState.mutate({
      completed_steps: [...completedSteps, stepId],
    });
  };

  const dismiss = () => {
    upsertState.mutate({ dismissed: true });
  };

  const reset = () => {
    upsertState.mutate({ dismissed: false, visits_count: 0, completed_steps: [] });
  };

  return {
    isLoading,
    shouldShow,
    steps,
    completedSteps,
    currentStepIndex,
    totalSteps,
    progress,
    visitsCount,
    dismissed,
    incrementVisit,
    completeStep,
    dismiss,
    reset,
    level,
  };
}
