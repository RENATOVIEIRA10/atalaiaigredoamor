import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, CheckCircle2, Heart, ShieldAlert, Users, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { usePlanejamentoCoordenador, type CoordAlert, type VisitaSemana } from '@/hooks/usePlanejamentoCoordenador';
import type { SemanaPlano, CelulaPlanItem } from '@/hooks/usePlanejamentoBimestral';
import { EmptyState } from '@/components/ui/empty-state';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

const PRIORITY_CONFIG = {
  'Prioridade de cuidado': { emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  'Atenção': { emoji: '🟡', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'Rotina': { emoji: '🟢', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
} as const;

interface Props {
  coordenacaoId: string;
}

export function PlanejamentoCoordenadorPanel({ coordenacaoId }: Props) {
  const { data, isLoading } = usePlanejamentoCoordenador(coordenacaoId);
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.total_celulas === 0) {
    return <EmptyState icon={Calendar} title="Sem dados de planejamento" description="Nenhuma célula encontrada nesta coordenação" />;
  }

  const regenerate = () => {
    queryClient.invalidateQueries({ queryKey: ['planejamento-coordenador', coordenacaoId] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Planejamento Bimestral da Coordenação
        </h2>
        <Button variant="ghost" size="sm" onClick={regenerate} className="text-xs gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && <AlertsSection alerts={data.alerts} />}

      {/* 1) Visitas da Semana */}
      <VisitasSemanaSection visitas={data.visitas_semana_atual} />

      {/* 4) Cobertura do Bimestre */}
      <CoberturaSection data={data} />

      {/* 2) Cronograma do Bimestre */}
      <CronogramaSection data={data} />

      {/* 3) Supervisões do Coordenador */}
      {data.celulas_coordenador.length > 0 && (
        <CoordSupervisoesSection semanas={data.celulas_coordenador_semanas} />
      )}

      <p className="text-xs text-muted-foreground text-center italic px-4">
        {data.bimestre_label} · Visualização somente leitura — o planejamento é gerido pelos supervisores
      </p>
    </div>
  );
}

// ── Alerts ──

function AlertsSection({ alerts }: { alerts: CoordAlert[] }) {
  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <Card key={i} className={`border-l-4 ${
          alert.type === 'bimestre_pending' ? 'border-l-amber-500 bg-amber-500/5' :
          alert.type === 'coord_week' ? 'border-l-primary bg-primary/5' :
          'border-l-blue-500 bg-blue-500/5'
        }`}>
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-lg">{alert.icon}</span>
            <p className="text-sm">{alert.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── 1) Visitas da Semana ──

function VisitasSemanaSection({ visitas }: { visitas: VisitaSemana[] }) {
  if (visitas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Visitas da Semana
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma supervisão planejada para esta semana</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Visitas da Semana
        </CardTitle>
        <CardDescription className="text-xs">
          {visitas.filter(v => v.realizada).length}/{visitas.length} realizadas
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {visitas.map(v => {
          const cfg = PRIORITY_CONFIG[v.priority_label];
          return (
            <div key={v.celula_id} className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border} ${v.realizada ? 'opacity-60' : ''}`}>
              <span className="text-base shrink-0">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{v.celula_name}</p>
                  {v.realizada && (
                    <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">✓</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  📅 {v.suggested_day_label}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="outline" className={`${v.responsavel_tipo === 'coordenador' ? 'text-primary border-primary/30' : ''} text-[10px]`}>
                  {v.responsavel_tipo === 'coordenador' ? 'Coordenador' : v.responsavel.split(' & ')[0]}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── 4) Cobertura ──

function CoberturaSection({ data }: { data: ReturnType<typeof usePlanejamentoCoordenador>['data'] }) {
  if (!data) return null;
  const totalPlan = data.pendentes_supervisores + data.realizadas_supervisores + data.pendentes_coordenador + data.realizadas_coordenador;
  const pctTotal = totalPlan > 0 ? Math.round((data.total_realizadas / totalPlan) * 100) : 0;
  const pctSup = (data.pendentes_supervisores + data.realizadas_supervisores) > 0
    ? Math.round((data.realizadas_supervisores / (data.pendentes_supervisores + data.realizadas_supervisores)) * 100) : 0;
  const pctCoord = (data.pendentes_coordenador + data.realizadas_coordenador) > 0
    ? Math.round((data.realizadas_coordenador / (data.pendentes_coordenador + data.realizadas_coordenador)) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Cobertura do Bimestre
        </CardTitle>
        <CardDescription className="text-xs">Cobertura em andamento</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Total */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Total</span>
            <span className="font-medium">{data.total_realizadas}/{totalPlan} ({pctTotal}%)</span>
          </div>
          <Progress value={pctTotal} className="h-2.5" />
        </div>

        {/* By role */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Supervisores</p>
            <div className="flex justify-between text-xs mb-1">
              <span>{data.realizadas_supervisores} feitas</span>
              <span>{data.pendentes_supervisores} faltam</span>
            </div>
            <Progress value={pctSup} className="h-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Coordenador</p>
            <div className="flex justify-between text-xs mb-1">
              <span>{data.realizadas_coordenador} feitas</span>
              <span>{data.pendentes_coordenador} faltam</span>
            </div>
            <Progress value={pctCoord} className="h-2" />
          </div>
        </div>

        {/* Cells total */}
        <p className="text-xs text-muted-foreground">
          {data.total_celulas} células no total · {data.supervisors.length} supervisor(es)
          {data.celulas_coordenador.length > 0 && ` · ${data.celulas_coordenador.length} do coordenador`}
        </p>
      </CardContent>
    </Card>
  );
}

// ── 2) Cronograma do Bimestre ──

function CronogramaSection({ data }: { data: NonNullable<ReturnType<typeof usePlanejamentoCoordenador>['data']> }) {
  // Merge all plans into a single timeline
  const weeks = data.plans_by_supervisor[0]?.semanas || [];
  const coordWeeks = data.celulas_coordenador_semanas || [];

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Cronograma do Bimestre
        </CardTitle>
        <CardDescription className="text-xs">
          Todas as supervisões planejadas por semana
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Accordion type="multiple" defaultValue={['week-1', 'week-2']} className="space-y-1">
          {weeks.map((week, wIdx) => {
            // Collect items from all supervisors + coordinator for this week
            const allItems: { item: CelulaPlanItem; responsavel: string; tipo: 'supervisor' | 'coordenador' }[] = [];

            for (const plan of data.plans_by_supervisor) {
              const s = plan.semanas[wIdx];
              if (s) {
                for (const cel of s.celulas) {
                  allItems.push({ item: cel, responsavel: plan.info.name, tipo: 'supervisor' });
                }
              }
            }
            const cw = coordWeeks[wIdx];
            if (cw) {
              for (const cel of cw.celulas) {
                allItems.push({ item: cel, responsavel: 'Coordenador', tipo: 'coordenador' });
              }
            }

            const allDone = allItems.length > 0 && allItems.every(i => i.item.realizada);

            return (
              <AccordionItem key={week.week_number} value={`week-${week.week_number}`} className="border rounded-lg px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold ${
                      allDone ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
                    }`}>
                      S{week.week_number}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Semana {week.week_number}</p>
                      <p className="text-xs text-muted-foreground">{week.week_label}</p>
                    </div>
                    {allItems.length > 0 && (
                      <Badge variant="secondary" className="text-xs mr-2">{allItems.length}</Badge>
                    )}
                    {allDone && <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  {allItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Semana livre</p>
                  ) : (
                    <div className="space-y-2">
                      {allItems.map(({ item, responsavel, tipo }) => {
                        const cfg = PRIORITY_CONFIG[item.priority_label];
                        return (
                          <div key={item.celula_id} className={`flex items-center gap-3 p-2 rounded-lg ${cfg.bg} border ${cfg.border} ${item.realizada ? 'opacity-60' : ''}`}>
                            <span className="text-sm shrink-0">{cfg.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.celula_name}</p>
                              <p className="text-xs text-muted-foreground">
                                📅 {item.suggested_day_label}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant="outline" className={`text-[10px] ${tipo === 'coordenador' ? 'text-primary border-primary/30' : ''}`}>
                                {tipo === 'coordenador' ? 'Coord.' : responsavel.split(' & ')[0]}
                              </Badge>
                              <Badge variant="outline" className={`${cfg.color} text-[10px]`}>
                                {item.priority_label === 'Prioridade de cuidado' ? 'Cuidado' : item.priority_label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ── 3) Supervisões do Coordenador ──

function CoordSupervisoesSection({ semanas }: { semanas: SemanaPlano[] }) {
  const allItems = semanas.flatMap(s => s.celulas);
  const realizadas = allItems.filter(c => c.realizada).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Supervisões do Coordenador
        </CardTitle>
        <CardDescription className="text-xs">
          Células lideradas por supervisores — responsabilidade do coordenador · {realizadas}/{allItems.length} realizadas
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Accordion type="multiple" defaultValue={['coord-week-1']} className="space-y-1">
          {semanas.map(semana => {
            if (semana.celulas.length === 0) return null;
            return (
              <AccordionItem key={semana.week_number} value={`coord-week-${semana.week_number}`} className="border rounded-lg px-3">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">
                      S{semana.week_number}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Semana {semana.week_number}</p>
                      <p className="text-xs text-muted-foreground">{semana.week_label}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs mr-2">{semana.celulas.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="space-y-2">
                    {semana.celulas.map(cel => {
                      const cfg = PRIORITY_CONFIG[cel.priority_label];
                      return (
                        <div key={cel.celula_id} className={`flex items-center gap-3 p-2 rounded-lg ${cfg.bg} border ${cfg.border} ${cel.realizada ? 'opacity-60' : ''}`}>
                          <span className="text-sm shrink-0">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{cel.celula_name}</p>
                            <p className="text-xs text-muted-foreground">📅 {cel.suggested_day_label}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cel.realizada && (
                              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">✓</Badge>
                            )}
                            <Badge variant="outline" className={`${cfg.color} text-[10px]`}>
                              {cel.priority_label === 'Prioridade de cuidado' ? 'Cuidado' : cel.priority_label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
