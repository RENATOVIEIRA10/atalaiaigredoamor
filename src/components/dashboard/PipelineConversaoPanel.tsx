/**
 * PipelineConversaoPanel
 *
 * Funil de conversão pastoral: Culto → Novas Vidas → Recomeço → Células → Membros
 *
 * Usado em:
 *   - CampoPastorDashboard (tab "cultos") → escopo do campo
 *   - GlobalPastorDashboard (tab "movimento-global") → visão global
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionLabel } from './SectionLabel';
import {
  usePipelineConversaoCulto,
  type PipelinePeriod,
  type PipelineStep,
  type HistoricoCulto,
} from '@/hooks/usePipelineConversaoCulto';
import {
  Users, ChevronRight, TrendingUp, Heart, ArrowDown, Info,
  Calendar, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PipelineConversaoPanelProps {
  overrideCampoId?: string | null;
  title?: string;
  subtitle?: string;
}

function formatDateShort(iso: string) {
  return format(new Date(iso + 'T12:00:00'), 'dd/MM', { locale: ptBR });
}

// ─── Conversion rate badge ─────────────────────────────────────────────────

function ConvBadge({ rate, isFirst }: { rate: number; isFirst?: boolean }) {
  if (isFirst) return null;
  const color =
    rate >= 70 ? 'bg-green-500/10 text-green-700 border-green-500/20' :
    rate >= 40 ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' :
                 'bg-destructive/10 text-destructive border-destructive/20';
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 font-semibold', color)}>
      {rate}%
    </Badge>
  );
}

// ─── Funnel visual ─────────────────────────────────────────────────────────

function FunnelPipeline({ steps }: { steps: PipelineStep[] }) {
  const maxVal = steps[0]?.value || 1;

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const barWidth = maxVal > 0 ? Math.max(8, (step.value / maxVal) * 100) : 8;
        const isFirst = i === 0;
        const drop = i > 0 ? steps[i - 1].value - step.value : 0;

        return (
          <div key={step.key}>
            {/* Arrow + drop between steps */}
            {i > 0 && (
              <div className="flex items-center gap-2 pl-3 py-0.5">
                <ArrowDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[10px] text-muted-foreground">
                  {drop > 0 ? `−${drop.toLocaleString('pt-BR')}` : ''}
                </span>
                <ConvBadge rate={step.convRate} isFirst={isFirst} />
              </div>
            )}

            {/* Step card */}
            <div className={cn(
              'rounded-xl border px-4 py-3 transition-colors',
              isFirst
                ? 'bg-primary/8 border-primary/25'
                : step.value === 0
                ? 'bg-muted/20 border-border/40'
                : 'bg-card border-border',
            )}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{step.icon}</span>
                  <span className="text-sm text-muted-foreground truncate">{step.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isFirst && step.pctBase > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {step.pctBase}% do total
                    </span>
                  )}
                  <span className={cn(
                    'text-xl font-black tabular-nums',
                    isFirst ? 'text-primary' : step.value > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                  )}>
                    {step.value.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isFirst ? 'bg-primary' :
                    step.value > 0 ? 'bg-emerald-500/60' : 'bg-muted/30',
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI rate cards ────────────────────────────────────────────────────────

interface RateCardProps { label: string; value: number; icon: React.ElementType; color: string }

function RateCard({ label, value, icon: Icon, color }: RateCardProps) {
  const rateColor =
    value >= 70 ? 'text-green-600' :
    value >= 40 ? 'text-amber-600' :
    value > 0   ? 'text-destructive' :
                  'text-muted-foreground/40';
  return (
    <Card className="p-3 text-center">
      <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
      <p className={cn('text-xl font-black tabular-nums', rateColor)}>{value}%</p>
      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
    </Card>
  );
}

// ─── Histórico de cultos ────────────────────────────────────────────────────

function HistoricoTable({ cultos }: { cultos: HistoricoCulto[] }) {
  if (cultos.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Cultos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {cultos.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-muted p-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{formatDateShort(c.data)}</p>
                  {c.horario && (
                    <p className="text-[10px] text-muted-foreground">{c.horario}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-base font-bold tabular-nums text-foreground">
                    {c.presentes.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">presentes</p>
                </div>
                {c.novas_vidas > 0 && (
                  <Badge variant="secondary" className="gap-1 text-xs bg-rose-500/10 text-rose-600 border-rose-500/20">
                    <Heart className="h-3 w-3" />
                    {c.novas_vidas}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ period }: { period: number }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-muted p-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium text-muted-foreground">
          Nenhum culto registrado nos últimos {period} dias
        </p>
        <p className="text-sm text-muted-foreground/70">
          Os Guardiões ainda não registraram contagens neste período.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function PipelineConversaoPanel({
  overrideCampoId,
  title = 'Pipeline de Conversão',
  subtitle,
}: PipelineConversaoPanelProps) {
  const [period, setPeriod] = useState<PipelinePeriod>(30);
  const { data, isLoading } = usePipelineConversaoCulto(period, overrideCampoId);

  const periodLabel = period === 7 ? '7 dias' : period === 30 ? '30 dias' : '90 dias';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data || data.totalCultos === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <SectionLabel
            title={title}
            subtitle={subtitle ?? `Culto → Célula → Membro · últimos ${periodLabel}`}
          />
          <PeriodFilter period={period} onChange={setPeriod} />
        </div>
        <EmptyState period={period} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + period filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionLabel
          title={title}
          subtitle={subtitle ?? `Culto → Célula → Membro · últimos ${periodLabel}`}
        />
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="p-3 text-center">
          <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
          <p className="text-xl font-black tabular-nums text-foreground">{data.totalCultos}</p>
          <p className="text-[10px] text-muted-foreground">cultos realizados</p>
        </Card>
        <Card className="p-3 text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
          <p className="text-xl font-black tabular-nums text-foreground">
            {data.totalPresentes.toLocaleString('pt-BR')}
          </p>
          <p className="text-[10px] text-muted-foreground">total presentes</p>
        </Card>
        <Card className="p-3 text-center">
          <Heart className="h-4 w-4 mx-auto mb-1 text-rose-500" />
          <p className="text-xl font-black tabular-nums text-rose-500">{data.novasVidasDeclaradas}</p>
          <p className="text-[10px] text-muted-foreground">novas vidas</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
          <p className={cn(
            'text-xl font-black tabular-nums',
            data.taxaConversaoFinal >= 50 ? 'text-emerald-600' :
            data.taxaConversaoFinal >= 25 ? 'text-amber-600' : 'text-destructive',
          )}>
            {data.taxaConversaoFinal}%
          </p>
          <p className="text-[10px] text-muted-foreground">conversão final</p>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>🎯</span>
            Funil de Conversão
            <span className="text-[10px] font-normal text-muted-foreground ml-1">
              últimos {periodLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <FunnelPipeline steps={data.steps} />
        </CardContent>
      </Card>

      {/* Conversion rate cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          Taxas de Conversão por Etapa
        </p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <RateCard label="Culto → Novas Vidas" value={data.taxaDeclaracao} icon={Heart} color="text-rose-500" />
          <RateCard label="Novas Vidas → Recomeço" value={data.taxaRegistro} icon={ChevronRight} color="text-primary" />
          <RateCard label="Recomeço → Encaminhadas" value={data.taxaEncaminhamento} icon={ChevronRight} color="text-primary" />
          <RateCard label="Encaminhadas → Células" value={data.taxaIntegracao} icon={ChevronRight} color="text-emerald-500" />
          <RateCard label="Células → Membros" value={data.taxaMembro} icon={TrendingUp} color="text-emerald-500" />
        </div>
      </div>

      {/* Histórico de cultos */}
      {data.historicoCultos.length > 0 && (
        <HistoricoTable cultos={data.historicoCultos} />
      )}
    </div>
  );
}

// ─── Period filter ─────────────────────────────────────────────────────────

function PeriodFilter({
  period,
  onChange,
}: {
  period: PipelinePeriod;
  onChange: (p: PipelinePeriod) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {([7, 30, 90] as PipelinePeriod[]).map(p => (
        <Button
          key={p}
          variant={period === p ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(p)}
          className="text-xs h-7 px-2.5"
        >
          {p}d
        </Button>
      ))}
    </div>
  );
}
