import { AppLayout } from '@/components/layout/AppLayout';
import { ScopeMissingGate } from '@/components/ScopeMissingGate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampo } from '@/contexts/CampoContext';
import { getCurrentWeekStart } from '@/hooks/useWeeklyReports';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home, Users, AlertTriangle, Heart, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthLegend, HealthReason } from '@/components/health/HealthLegend';
import { usePastoralAlerts, PastoralAlert } from '@/hooks/usePastoralAlerts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

const healthConfig: Record<CelulaHealth, { label: string; color: string; dot: string; bg: string }> = {
  saudavel: { 
    label: 'Saudável', 
    color: 'text-emerald-600 dark:text-emerald-400', 
    dot: '🟢',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  atencao: { 
    label: 'Atenção', 
    color: 'text-amber-600 dark:text-amber-400', 
    dot: '🟡',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  risco: { 
    label: 'Risco', 
    color: 'text-red-600 dark:text-red-400', 
    dot: '🔴',
    bg: 'bg-red-500/10 border-red-500/30',
  },
};

const alertSeverityConfig = {
  high: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  low: { icon: Heart, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
};

function AlertCard({ alert, onClick }: { alert: PastoralAlert; onClick: () => void }) {
  const config = alertSeverityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn('p-4 cursor-pointer hover:shadow-md transition-all border', config.bg)}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className={cn('shrink-0 p-2 rounded-lg', config.bg)}>
            <Icon className={cn('h-4 w-4', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">{alert.title}</p>
            <p className="text-xs text-muted-foreground">{alert.description}</p>
          </div>
          {alert.actionLabel && (
            <Button size="sm" variant="ghost" className="shrink-0 h-8 text-xs">
              {alert.actionLabel}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function Radar() {
  const { activeCampoId } = useCampo();
  const navigate = useNavigate();
  const weekStart = getCurrentWeekStart();

  const { data: alerts, isLoading: alertsLoading } = usePastoralAlerts({ scopeType: 'all' });

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

  const priorityAlerts = alerts?.filter(a => a.severity === 'high' || a.severity === 'medium').slice(0, 5) || [];

  return (
    <AppLayout title="Radar de Saúde">
      <ScopeMissingGate>
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Radar de Saúde</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Visão pastoral completa da saúde ministerial</p>
            </div>
          </div>

          {/* Alertas Prioritários */}
          {!alertsLoading && priorityAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">
                  Atenção Pastoral ({priorityAlerts.length})
                </h2>
              </div>
              <div className="space-y-2">
                {priorityAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Summary badges */}
          <div className="grid grid-cols-3 gap-3">
            {(['saudavel', 'atencao', 'risco'] as const).map(h => {
              const config = healthConfig[h];
              return (
                <Card key={h} className={cn('p-4 border', config.bg)}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{counts[h]}</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                      <span>{config.dot}</span>
                      <span className={config.color}>{config.label}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <HealthLegend preset="radar" />

          {/* Cell list */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Células ({celulas?.length || 0})
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {celulas?.map(c => {
                  const config = healthConfig[c.health];
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer border">
                        <div className={cn('shrink-0 p-3 rounded-xl', config.bg)}>
                          <Home className={cn('h-5 w-5', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate mb-1">{c.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{c.rede}</span>
                            <span>·</span>
                            <span>{c.coordenacao}</span>
                          </div>
                          <HealthReason reason={c.healthReason} className="mt-1.5" />
                        </div>
                        <div className="text-right shrink-0 space-y-1.5">
                          <Badge variant="outline" className={cn('text-xs font-medium', config.bg, config.color)}>
                            {config.dot} {config.label}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                            <Users className="h-3 w-3" />
                            <span>{c.membrosAtivos} membros</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScopeMissingGate>
    </AppLayout>
  );
}
