import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';
import { getCurrentWeekStart } from '@/hooks/useWeeklyReports';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type CelulaHealth = 'saudavel' | 'atencao' | 'risco';

interface CelulaRadar {
  id: string;
  name: string;
  coordenacao: string;
  rede: string;
  membrosAtivos: number;
  hasReportThisWeek: boolean;
  lastReportDate: string | null;
  health: CelulaHealth;
  healthReason: string;
}

const healthConfig: Record<CelulaHealth, { label: string; color: string; dot: string }> = {
  saudavel: { label: 'Saudável', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', dot: '🟢' },
  atencao: { label: 'Atenção', color: 'bg-amber-500/15 text-amber-500 border-amber-500/30', dot: '🟡' },
  risco: { label: 'Risco', color: 'bg-red-500/15 text-red-500 border-red-500/30', dot: '🔴' },
};

export default function Radar() {
  const { activeCampoId } = useCampo();
  const weekStart = getCurrentWeekStart();

  const { data: celulas, isLoading } = useQuery({
    queryKey: ['radar-pastoral', activeCampoId],
    queryFn: async () => {
      // Get all celulas
      let cQ = supabase
        .from('celulas')
        .select('id, name, coordenacao:coordenacoes(name, rede:redes(name))')
        .order('name');
      if (activeCampoId) cQ = cQ.eq('campo_id', activeCampoId);
      const { data: allCelulas } = await cQ;

      if (!allCelulas?.length) return [];

      const celulaIds = allCelulas.map(c => c.id);

      // Get recent reports (last 3 weeks)
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      let rQ = supabase
        .from('weekly_reports')
        .select('celula_id, week_start, created_at')
        .in('celula_id', celulaIds.slice(0, 200))
        .gte('week_start', threeWeeksAgo.toISOString().split('T')[0])
        .order('week_start', { ascending: false });
      const { data: reports } = await rQ;

      // Get member counts
      let mQ = supabase
        .from('members')
        .select('celula_id')
        .eq('is_active', true)
        .in('celula_id', celulaIds.slice(0, 200));
      const { data: members } = await mQ;

      const memberCounts = new Map<string, number>();
      (members || []).forEach(m => {
        memberCounts.set(m.celula_id, (memberCounts.get(m.celula_id) || 0) + 1);
      });

      const reportsByCelula = new Map<string, typeof reports>();
      (reports || []).forEach(r => {
        const existing = reportsByCelula.get(r.celula_id) || [];
        existing.push(r);
        reportsByCelula.set(r.celula_id, existing);
      });

      return allCelulas.map((c: any): CelulaRadar => {
        const celulaReports = reportsByCelula.get(c.id) || [];
        const hasThisWeek = celulaReports.some(r => r.week_start === weekStart);
        const lastReport = celulaReports[0];
        const memberCount = memberCounts.get(c.id) || 0;

        // Determine health
        let health: CelulaHealth = 'saudavel';
        let healthReason = 'Relatório em dia';

        if (!hasThisWeek && celulaReports.length === 0) {
          health = 'risco';
          healthReason = 'Sem reunião há mais de 3 semanas';
        } else if (!hasThisWeek && celulaReports.length < 2) {
          health = 'risco';
          healthReason = 'Apenas 1 relatório nas últimas 3 semanas';
        } else if (!hasThisWeek) {
          health = 'atencao';
          healthReason = 'Sem relatório esta semana';
        }

        if (memberCount < 3 && health === 'saudavel') {
          health = 'atencao';
          healthReason = 'Poucos membros ativos';
        }

        return {
          id: c.id,
          name: c.name,
          coordenacao: c.coordenacao?.name || '',
          rede: c.coordenacao?.rede?.name || '',
          membrosAtivos: memberCount,
          hasReportThisWeek: hasThisWeek,
          lastReportDate: lastReport?.created_at || null,
          health,
          healthReason,
        };
      }).sort((a, b) => {
        const order: Record<CelulaHealth, number> = { risco: 0, atencao: 1, saudavel: 2 };
        return order[a.health] - order[b.health];
      });
    },
    staleTime: 60_000,
  });

  const counts = {
    saudavel: celulas?.filter(c => c.health === 'saudavel').length || 0,
    atencao: celulas?.filter(c => c.health === 'atencao').length || 0,
    risco: celulas?.filter(c => c.health === 'risco').length || 0,
  };

  return (
    <AppLayout title="Radar Pastoral">
      <ScopeMissingGate>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">Radar Pastoral</h1>
            <p className="text-xs text-muted-foreground">Visão da saúde de cada célula</p>
          </div>

          {/* Summary badges */}
          <div className="flex gap-3">
            {(['saudavel', 'atencao', 'risco'] as const).map(h => (
              <Badge key={h} variant="outline" className={cn('text-sm px-3 py-1.5', healthConfig[h].color)}>
                {healthConfig[h].dot} {counts[h]} {healthConfig[h].label}
              </Badge>
            ))}
          </div>

          {/* Cell list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {celulas?.map(c => {
                const config = healthConfig[c.health];
                return (
                  <Card key={c.id} className="p-4 flex items-center gap-4">
                    <div className={cn('shrink-0 p-2 rounded-lg', config.color)}>
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.rede} · {c.coordenacao}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={cn('text-[10px]', config.color)}>
                        {config.dot} {config.label}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <Users className="h-3 w-3" /> {c.membrosAtivos}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScopeMissingGate>
    </AppLayout>
  );
}
