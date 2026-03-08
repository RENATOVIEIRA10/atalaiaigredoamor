/**
 * RadarSaudeSupervisorPanel – Radar de Saúde scoped to supervisor's cells.
 * Uses same health scoring as useRadarSaude but filtered to cells assigned to the supervisor.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShieldCheck, Eye, AlertTriangle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO, differenceInDays, differenceInWeeks, startOfWeek, addDays } from 'date-fns';
import { HealthLegend, HealthReason } from '@/components/health/HealthLegend';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';

// ── Health scoring (same as useRadarSaude) ──
const CHECKLIST_FIELDS = [
  'oracao_inicial', 'louvor', 'apresentacao_visitantes', 'momento_visao_triade',
  'avisos', 'quebra_gelo', 'licao', 'cadeira_amor', 'oracao_final', 'selfie',
] as const;
const QUALITY_FIELDS = [
  'comunhao', 'pontualidade', 'dinamica', 'organizacao', 'interatividade',
] as const;

function calcScore(sup: Record<string, any>): number {
  const cl = CHECKLIST_FIELDS.reduce((s, f) => s + (sup[f] ? 1 : 0), 0) / CHECKLIST_FIELDS.length;
  const ql = QUALITY_FIELDS.reduce((s, f) => s + (sup[f] ? 1 : 0), 0) / QUALITY_FIELDS.length;
  return (cl * 0.6 + ql * 0.4) * 5;
}

interface CelulaHealth {
  celula_id: string;
  celula_name: string;
  status: 'estavel' | 'atencao' | 'prioridade_cuidado' | 'sem_avaliacao';
  media: number | null;
  ultima_supervisao: string | null;
  days_since_last: number | null;
  weeks_without_report: number;
  tendencia: 'subindo' | 'estavel' | 'descendo' | null;
}

const STATUS_CONFIG = {
  estavel: { label: 'Estável', emoji: '🟢', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  atencao: { label: 'Atenção', emoji: '🟡', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  prioridade_cuidado: { label: 'Prioridade de cuidado', emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  sem_avaliacao: { label: 'Sem avaliação', emoji: '⚪', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' },
} as const;

function getStatus(media: number | null): CelulaHealth['status'] {
  if (media === null) return 'sem_avaliacao';
  if (media >= 4.0) return 'estavel';
  if (media >= 3.0) return 'atencao';
  return 'prioridade_cuidado';
}

function getTendencia(scores: number[]): CelulaHealth['tendencia'] {
  if (scores.length < 2) return null;
  const recent = scores[0];
  const prev = scores.slice(1).reduce((a, b) => a + b, 0) / (scores.length - 1);
  const diff = recent - prev;
  if (diff > 0.3) return 'subindo';
  if (diff < -0.3) return 'descendo';
  return 'estavel';
}

interface Props {
  supervisorId: string;
  coordenacaoId: string;
  compact?: boolean;
}

export function RadarSaudeSupervisorPanel({ supervisorId, coordenacaoId, compact = false }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['radar-saude-supervisor', supervisorId, coordenacaoId],
    queryFn: async () => {
      // Fetch cells in this coordenação
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, name, supervisor_id, coordenacao_id')
        .eq('coordenacao_id', coordenacaoId)
        .eq('is_test_data', false);

      let myCelulas = (celulas || []).filter(c => c.supervisor_id === supervisorId);
      if (myCelulas.length === 0) myCelulas = celulas || [];
      if (myCelulas.length === 0) return { cells: [], counts: { estavel: 0, atencao: 0, prioridade_cuidado: 0, sem_avaliacao: 0 } };

      const ids = myCelulas.map(c => c.id);

      // Supervisões
      const { data: sups } = await supabase
        .from('supervisoes')
        .select('*')
        .in('celula_id', ids)
        .eq('celula_realizada', true)
        .order('data_supervisao', { ascending: false });

      const supsByCel: Record<string, any[]> = {};
      for (const s of (sups || [])) {
        if (!supsByCel[s.celula_id]) supsByCel[s.celula_id] = [];
        if (supsByCel[s.celula_id].length < 3) supsByCel[s.celula_id].push(s);
      }

      // Weekly reports for pendency
      const currentMon = startOfWeek(new Date(), { weekStartsOn: 1 });
      const twoWeeksAgo = format(addDays(currentMon, -14), 'yyyy-MM-dd');
      const { data: reports } = await supabase
        .from('weekly_reports')
        .select('celula_id, week_start')
        .in('celula_id', ids)
        .gte('week_start', twoWeeksAgo)
        .eq('is_test_data', false);

      const currentWeekStr = format(currentMon, 'yyyy-MM-dd');
      const lastWeekStr = format(addDays(currentMon, -7), 'yyyy-MM-dd');
      const reportsByCel: Record<string, Set<string>> = {};
      for (const r of (reports || [])) {
        if (!reportsByCel[r.celula_id]) reportsByCel[r.celula_id] = new Set();
        reportsByCel[r.celula_id].add(r.week_start);
      }

      const today = new Date();
      const cells: CelulaHealth[] = myCelulas.map(cel => {
        const cellSups = supsByCel[cel.id] || [];
        const lastSup = cellSups[0]?.data_supervisao || null;
        const daysSince = lastSup ? differenceInDays(today, parseISO(lastSup)) : null;

        let media: number | null = null;
        let tendencia: CelulaHealth['tendencia'] = null;
        if (cellSups.length > 0) {
          const scores = cellSups.map(calcScore);
          media = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
          tendencia = getTendencia(scores);
        }

        const celReports = reportsByCel[cel.id] || new Set();
        let weeksWithout = 0;
        if (!celReports.has(currentWeekStr)) weeksWithout++;
        if (!celReports.has(lastWeekStr)) weeksWithout++;

        return {
          celula_id: cel.id,
          celula_name: cel.name,
          status: getStatus(media),
          media,
          ultima_supervisao: lastSup,
          days_since_last: daysSince,
          weeks_without_report: weeksWithout,
          tendencia,
        };
      });

      // Sort: prioridade_cuidado first
      const order = { prioridade_cuidado: 0, atencao: 1, sem_avaliacao: 2, estavel: 3 };
      cells.sort((a, b) => order[a.status] - order[b.status]);

      return {
        cells,
        counts: {
          estavel: cells.filter(c => c.status === 'estavel').length,
          atencao: cells.filter(c => c.status === 'atencao').length,
          prioridade_cuidado: cells.filter(c => c.status === 'prioridade_cuidado').length,
          sem_avaliacao: cells.filter(c => c.status === 'sem_avaliacao').length,
        },
      };
    },
    enabled: !!supervisorId && !!coordenacaoId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.cells.length === 0) {
    return (
      <EmptyState icon={Heart} title="Nenhuma célula" description="Sem células no escopo para avaliar" />
    );
  }

  const { cells, counts } = data;
  const needsAttention = cells.filter(c => c.status === 'prioridade_cuidado' || c.status === 'atencao');

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Saúde da Rede — Minhas Células
      </h2>

      <HealthLegend preset="supervisor" compact />

      {/* Mini KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <MiniKPI emoji="🟢" value={counts.estavel} label="Estável" />
        <MiniKPI emoji="🟡" value={counts.atencao} label="Atenção" />
        <MiniKPI emoji="🔴" value={counts.prioridade_cuidado} label="Cuidado" />
        <MiniKPI emoji="⚪" value={counts.sem_avaliacao} label="S/ Aval." />
      </div>

      {/* Cells needing attention */}
      {needsAttention.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Células que precisam de atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {needsAttention.map(cel => (
                <CellRow key={cel.celula_id} cell={cel} compact={compact} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All cells */}
      {!compact && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Todas as células
            </CardTitle>
            <CardDescription>{cells.length} célula(s)</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {cells.map(cel => (
                <CellRow key={cel.celula_id} cell={cel} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {needsAttention.length === 0 && (
        <Card className="border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-green-600 font-medium">🎉 Todas as células estão estáveis!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CellRow({ cell, compact = false }: { cell: CelulaHealth; compact?: boolean }) {
  const cfg = STATUS_CONFIG[cell.status];

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
      <span className="text-base shrink-0">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{cell.celula_name}</p>
        <p className="text-xs text-muted-foreground">
          {cell.ultima_supervisao
            ? `Última supervisão: ${format(parseISO(cell.ultima_supervisao), "dd/MM", { locale: ptBR })} (${cell.days_since_last}d)`
            : 'Sem supervisão registrada'}
          {cell.weeks_without_report > 0 && (
            <span className="ml-2">· {cell.weeks_without_report}sem s/ relatório</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {cell.media !== null && (
          <Badge variant="outline" className={`${cfg.color} text-xs font-bold`}>
            {cell.media.toFixed(1)}
          </Badge>
        )}
        {cell.tendencia && <TendenciaIcon tendencia={cell.tendencia} />}
      </div>
    </div>
  );
}

function TendenciaIcon({ tendencia }: { tendencia: 'subindo' | 'estavel' | 'descendo' }) {
  if (tendencia === 'subindo') return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (tendencia === 'descendo') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function MiniKPI({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <span className="text-base">{emoji}</span>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
