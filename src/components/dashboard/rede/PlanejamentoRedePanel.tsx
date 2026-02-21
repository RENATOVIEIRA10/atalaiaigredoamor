/**
 * PlanejamentoRedePanel.tsx
 * 
 * Network Leader bimonthly planning view.
 * Shows aggregated planning from all coordinations with drill-down.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, CheckCircle2, ChevronLeft, Users, Network, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { usePlanejamentoRede, type CoordPlanSummary } from '@/hooks/usePlanejamentoRede';
import type { SemanaPlano, CelulaPlanItem } from '@/hooks/usePlanejamentoBimestral';
import { EmptyState } from '@/components/ui/empty-state';
import { MiniProgressBar } from '../supervisor/ProgressoCuidadoBar';
import { useQueryClient } from '@tanstack/react-query';

const PRIORITY_CONFIG = {
  'Prioridade de cuidado': { emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  'Atenção': { emoji: '🟡', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'Rotina': { emoji: '🟢', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
} as const;

interface Props {
  redeId: string;
}

export function PlanejamentoRedePanel({ redeId }: Props) {
  const { data, isLoading } = usePlanejamentoRede(redeId);
  const queryClient = useQueryClient();
  const [selectedCoord, setSelectedCoord] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.total_celulas === 0) {
    return <EmptyState icon={Calendar} title="Sem dados de planejamento" description="Nenhuma célula encontrada nesta rede" />;
  }

  const regenerate = () => {
    queryClient.invalidateQueries({ queryKey: ['planejamento-rede', redeId] });
  };

  // If a coordination is selected, show its detail
  const selectedData = selectedCoord ? data.coordenacoes.find(c => c.coordenacao_id === selectedCoord) : null;

  if (selectedData) {
    return <CoordDetailView data={selectedData} bimestreLabel={data.bimestre_label} onBack={() => setSelectedCoord(null)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Planejamento Bimestral da Rede
        </h2>
        <Button variant="ghost" size="sm" onClick={regenerate} className="text-xs gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Resumo do Bimestre
          </CardTitle>
          <CardDescription className="text-xs">{data.bimestre_label}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <MiniProgressBar label="Cobertura Geral da Rede" total={data.total_planejadas} completed={data.total_realizadas} />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{data.total_planejadas}</p>
              <p className="text-[10px] text-muted-foreground">Planejadas</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <p className="text-lg font-bold text-green-600">{data.total_realizadas}</p>
              <p className="text-[10px] text-muted-foreground">Realizadas</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <p className="text-lg font-bold text-amber-600">{data.total_pendentes}</p>
              <p className="text-[10px] text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This week visits */}
      {data.visitas_semana_atual.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Visitas da Semana (Rede)
            </CardTitle>
            <CardDescription className="text-xs">
              {data.visitas_semana_atual.filter(v => v.realizada).length}/{data.visitas_semana_atual.length} realizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {data.visitas_semana_atual.map(v => {
              const cfg = PRIORITY_CONFIG[v.priority_label];
              const coordName = data.coordenacoes.find(c => 
                c.visitas_semana.some(vs => vs.celula_id === v.celula_id)
              )?.coordenacao_name || '';
              return (
                <div key={v.celula_id} className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border} ${v.realizada ? 'opacity-60' : ''}`}>
                  <span className="text-base shrink-0">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{v.celula_name}</p>
                      {v.realizada && <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">✓</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {coordName && <span>{coordName} · </span>}📅 {v.suggested_day_label}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${v.responsavel_tipo === 'coordenador' ? 'text-primary border-primary/30' : ''} text-[10px]`}>
                    {v.responsavel_tipo === 'coordenador' ? 'Coord.' : v.responsavel.split(' & ')[0]}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Coordination cards */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Coordenações
          </CardTitle>
          <CardDescription className="text-xs">{data.coordenacoes.length} coordenação(ões)</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {data.coordenacoes.map(coord => (
            <Card key={coord.coordenacao_id} className="border-l-4 border-l-primary/40 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCoord(coord.coordenacao_id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{coord.coordenacao_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {coord.total_celulas} células · {coord.supervisors.length} supervisor(es)
                    </p>
                  </div>
                  <Badge variant={coord.progress_pct >= 100 ? 'default' : 'outline'} className="text-xs">
                    {coord.progress_pct}%
                  </Badge>
                </div>
                <Progress value={coord.progress_pct} className="h-2 mb-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{coord.total_realizadas} realizadas</span>
                  <span>{coord.pendentes} pendentes</span>
                </div>
                {coord.visitas_semana.length > 0 && (
                  <p className="text-xs text-primary mt-2">
                    📌 {coord.visitas_semana.filter(v => !v.realizada).length} supervisão(ões) esta semana
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center italic px-4">
        {data.bimestre_label} · Visualização somente leitura — o planejamento é gerido pelos supervisores
      </p>
    </div>
  );
}

// ── Coordination Detail View ──

function CoordDetailView({ data, bimestreLabel, onBack }: { data: CoordPlanSummary; bimestreLabel: string; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-sm font-semibold">{data.coordenacao_name}</h2>
          <p className="text-xs text-muted-foreground">{bimestreLabel}</p>
        </div>
      </div>

      {/* Coverage */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Cobertura da Coordenação
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <MiniProgressBar label="Progresso Geral" total={data.total_realizadas + data.pendentes} completed={data.total_realizadas} />
          
          {data.supervisors.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso dos Supervisores</p>
              {data.plans_by_supervisor.map(plan => {
                const allCels = plan.semanas.flatMap(s => s.celulas);
                const completed = new Set(allCels.filter(c => c.realizada).map(c => c.celula_id)).size;
                return <MiniProgressBar key={plan.info.id} label={plan.info.name} total={allCels.length} completed={completed} />;
              })}
            </div>
          )}

          {data.celulas_coordenador.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Supervisões do Coordenador</p>
              <MiniProgressBar 
                label="Coordenador" 
                total={data.celulas_coordenador_semanas.flatMap(s => s.celulas).length} 
                completed={new Set(data.celulas_coordenador_semanas.flatMap(s => s.celulas).filter(c => c.realizada).map(c => c.celula_id)).size} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* This week visits */}
      {data.visitas_semana.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Visitas da Semana
            </CardTitle>
            <CardDescription className="text-xs">
              {data.visitas_semana.filter(v => v.realizada).length}/{data.visitas_semana.length} realizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {data.visitas_semana.map(v => {
              const cfg = PRIORITY_CONFIG[v.priority_label];
              return (
                <div key={v.celula_id} className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border} ${v.realizada ? 'opacity-60' : ''}`}>
                  <span className="text-base shrink-0">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.celula_name}</p>
                    <p className="text-xs text-muted-foreground">📅 {v.suggested_day_label}</p>
                  </div>
                  <Badge variant="outline" className={`${v.responsavel_tipo === 'coordenador' ? 'text-primary border-primary/30' : ''} text-[10px]`}>
                    {v.responsavel_tipo === 'coordenador' ? 'Coord.' : v.responsavel.split(' & ')[0]}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Full schedule */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Cronograma do Bimestre
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Accordion type="multiple" defaultValue={['week-1', 'week-2']} className="space-y-1">
            {(data.plans_by_supervisor[0]?.semanas || []).map((week, wIdx) => {
              const allItems: { item: CelulaPlanItem; responsavel: string; tipo: 'supervisor' | 'coordenador' }[] = [];

              for (const plan of data.plans_by_supervisor) {
                const s = plan.semanas[wIdx];
                if (s) {
                  for (const cel of s.celulas) {
                    allItems.push({ item: cel, responsavel: plan.info.name, tipo: 'supervisor' });
                  }
                }
              }
              const cw = data.celulas_coordenador_semanas[wIdx];
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground mr-1">
                        {allItems.length} visita(s)
                      </span>
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
                                <p className="text-xs text-muted-foreground">📅 {item.suggested_day_label}</p>
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

      {/* Coordinator supervisions */}
      {data.celulas_coordenador.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Supervisões do Coordenador
            </CardTitle>
            <CardDescription className="text-xs">
              Células lideradas por supervisores — responsabilidade do coordenador
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {data.celulas_coordenador.map(cel => {
                const cfg = PRIORITY_CONFIG[cel.priority_label];
                return (
                  <div key={cel.celula_id} className={`flex items-center gap-3 p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
                    <span className="text-sm shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cel.celula_name}</p>
                    </div>
                    <Badge variant="outline" className={`${cfg.color} text-[10px]`}>
                      {cel.priority_label === 'Prioridade de cuidado' ? 'Cuidado' : cel.priority_label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
