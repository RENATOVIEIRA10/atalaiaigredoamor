import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Heart, Users, ShieldAlert, ArrowLeftRight, Loader2 } from 'lucide-react';
import { usePlanejamentoBimestral, SemanaPlano, CelulaPlanItem, CelulaPlanejamento, SupervisorInfo } from '@/hooks/usePlanejamentoBimestral';
import { useSupervisionSwaps, useCreateSwap, useRespondSwap, SwapProposal } from '@/hooks/useSupervisionSwaps';
import { ProgressoCuidadoBar } from './ProgressoCuidadoBar';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlanejamentoBimestralPanelProps {
  supervisorId: string;
  coordenacaoId: string;
  compact?: boolean;
}

const PRIORITY_CONFIG = {
  'Prioridade de cuidado': { emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  'Atenção': { emoji: '🟡', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'Rotina': { emoji: '🟢', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
} as const;

export function PlanejamentoBimestralPanel({ supervisorId, coordenacaoId, compact = false }: PlanejamentoBimestralPanelProps) {
  const { data, isLoading } = usePlanejamentoBimestral({ supervisorId, coordenacaoId });
  const { data: swaps, isLoading: swapsLoading } = useSupervisionSwaps(coordenacaoId);
  const queryClient = useQueryClient();

  const regenerate = () => {
    queryClient.invalidateQueries({ queryKey: ['planejamento-bimestral', supervisorId, coordenacaoId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.total_celulas === 0) {
    return <EmptyState icon={Calendar} title="Sem células para planejar" description="Nenhuma célula encontrada no seu escopo de supervisão" />;
  }

  // Summary KPIs
  const totalPlanejadas = data.minhas_semanas.reduce((sum, s) => sum + s.celulas.length, 0);
  const realizadas = data.minhas_semanas.reduce((sum, s) => sum + s.celulas.filter(c => c.realizada).length, 0);
  const prioridadeCuidado = data.celulas_no_escopo.filter(c => c.priority_label === 'Prioridade de cuidado').length;

  // Pending swaps for me
  const pendingForMe = (swaps || []).filter(
    s => s.status === 'pending' && s.target_supervisor_id === supervisorId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Planejamento Bimestral
        </h2>
        <Button variant="ghost" size="sm" onClick={regenerate} className="text-xs gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Recalcular
        </Button>
      </div>

      {/* KPI summary */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium">{data.bimestre_label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPlanejadas} supervisão(ões) suas · {data.total_semanas} semanas
            {data.outro_supervisor && ` · ${data.outro_supervisor.info.celulas_count} do outro supervisor`}
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              {realizadas}/{totalPlanejadas} realizadas
            </span>
            {prioridadeCuidado > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <Heart className="h-3.5 w-3.5" />
                {prioridadeCuidado} prioridade de cuidado
              </span>
            )}
            {data.celulas_coordenador.length > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <ShieldAlert className="h-3.5 w-3.5" />
                {data.celulas_coordenador.length} do coordenador
              </span>
            )}
          </div>
          {/* Load balance */}
          {data.supervisors.length >= 2 && (
            <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
              {data.supervisors.map(s => (
                <span key={s.id} className={s.id === supervisorId ? 'font-bold text-foreground' : ''}>
                  {s.name.split(' & ')[0]}: {s.celulas_count} cél. (peso {s.load})
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress bar */}
      <ProgressoCuidadoBar
        totalCells={totalPlanejadas}
        completedCells={realizadas}
        bimestreLabel={data.bimestre_label}
      />

      {/* Pending swap notifications */}
      {pendingForMe.length > 0 && (
        <PendingSwapsList swaps={pendingForMe} supervisorId={supervisorId} data={data} />
      )}

      {/* Tabs: Minhas, Outro Supervisor, Coordenador */}
      <Tabs defaultValue="minhas" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="minhas" className="text-xs">Minhas</TabsTrigger>
          <TabsTrigger value="outro" className="text-xs" disabled={!data.outro_supervisor}>
            Outro Sup.
          </TabsTrigger>
          <TabsTrigger value="coordenador" className="text-xs" disabled={data.celulas_coordenador.length === 0}>
            Coordenador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="minhas">
          <WeeksList
            semanas={data.minhas_semanas}
            compact={compact}
            showSwapButton
            supervisorId={supervisorId}
            otherSupervisor={data.outro_supervisor?.info || null}
            otherCelulas={data.outro_supervisor?.semanas.flatMap(s => s.celulas) || []}
            coordenacaoId={coordenacaoId}
          />
        </TabsContent>

        <TabsContent value="outro">
          {data.outro_supervisor && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Supervisões de <strong>{data.outro_supervisor.info.name}</strong> (somente leitura)
              </p>
              <WeeksList semanas={data.outro_supervisor.semanas} compact={compact} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="coordenador">
          <Card className="border-primary/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Supervisões do Coordenador
              </CardTitle>
              <CardDescription className="text-xs">
                Células lideradas por supervisores — o coordenador deve supervisionar
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {data.celulas_coordenador.map(cel => (
                  <CelulaPlanRow
                    key={cel.celula_id}
                    item={{
                      celula_id: cel.celula_id,
                      celula_name: cel.celula_name,
                      suggested_date: '',
                      suggested_day_label: cel.meeting_day || 'A definir',
                      priority_label: cel.priority_label,
                      priority_weight: cel.priority_weight,
                      meeting_day: cel.meeting_day,
                      realizada: false,
                      assigned_supervisor_id: '',
                    }}
                    compact
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center italic px-4">
        💡 Este planejamento é uma sugestão. Ajuste como preferir!
      </p>
    </div>
  );
}

// ── Pending Swaps ──

function PendingSwapsList({ swaps, supervisorId, data }: {
  swaps: SwapProposal[];
  supervisorId: string;
  data: any;
}) {
  const respondSwap = useRespondSwap();

  // Build cell name lookup
  const cellNames = new Map<string, string>();
  for (const s of (data.minhas_semanas || [])) {
    for (const c of s.celulas) cellNames.set(c.celula_id, c.celula_name);
  }
  if (data.outro_supervisor) {
    for (const s of data.outro_supervisor.semanas) {
      for (const c of s.celulas) cellNames.set(c.celula_id, c.celula_name);
    }
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-amber-600" />
          Propostas de troca pendentes
        </p>
        {swaps.map(swap => (
          <div key={swap.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border text-xs">
            <div>
              <p>
                Trocar <strong>{cellNames.get(swap.target_celula_id) || 'Célula'}</strong> (sua)
                por <strong>{cellNames.get(swap.proposer_celula_id) || 'Célula'}</strong> (dele)
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="default"
                className="text-xs h-7"
                onClick={() => respondSwap.mutate({ swapId: swap.id, accept: true })}
                disabled={respondSwap.isPending}
              >
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => respondSwap.mutate({ swapId: swap.id, accept: false })}
                disabled={respondSwap.isPending}
              >
                Recusar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Weeks List ──

function WeeksList({ semanas, compact, showSwapButton, supervisorId, otherSupervisor, otherCelulas, coordenacaoId }: {
  semanas: SemanaPlano[];
  compact?: boolean;
  showSwapButton?: boolean;
  supervisorId?: string;
  otherSupervisor?: SupervisorInfo | null;
  otherCelulas?: CelulaPlanItem[];
  coordenacaoId?: string;
}) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2]));

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {semanas.map(semana => (
        <WeekCard
          key={semana.week_number}
          semana={semana}
          expanded={expandedWeeks.has(semana.week_number)}
          onToggle={() => toggleWeek(semana.week_number)}
          compact={compact}
          showSwapButton={showSwapButton}
          supervisorId={supervisorId}
          otherSupervisor={otherSupervisor}
          otherCelulas={otherCelulas}
          coordenacaoId={coordenacaoId}
        />
      ))}
    </div>
  );
}

// ── Week Card ──

function WeekCard({ semana, expanded, onToggle, compact, showSwapButton, supervisorId, otherSupervisor, otherCelulas, coordenacaoId }: {
  semana: SemanaPlano;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
  showSwapButton?: boolean;
  supervisorId?: string;
  otherSupervisor?: SupervisorInfo | null;
  otherCelulas?: CelulaPlanItem[];
  coordenacaoId?: string;
}) {
  const allRealizadas = semana.celulas.length > 0 && semana.celulas.every(c => c.realizada);
  const hasItems = semana.celulas.length > 0;

  return (
    <Card className={`transition-all ${allRealizadas ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            allRealizadas ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
          }`}>
            S{semana.week_number}
          </div>
          <div>
            <p className="text-sm font-medium">Semana {semana.week_number}</p>
            <p className="text-xs text-muted-foreground">{semana.week_label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasItems && (
            <Badge variant="secondary" className="text-xs">{semana.celulas.length} visita(s)</Badge>
          )}
          {allRealizadas && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-3">
          {!hasItems ? (
            <p className="text-xs text-muted-foreground text-center py-2">Semana livre</p>
          ) : (
            <div className="space-y-2">
              {semana.celulas.map(cel => (
                <CelulaPlanRow
                  key={cel.celula_id}
                  item={cel}
                  compact={compact}
                  showSwapButton={showSwapButton}
                  supervisorId={supervisorId}
                  otherSupervisor={otherSupervisor}
                  otherCelulas={otherCelulas}
                  coordenacaoId={coordenacaoId}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Cell Plan Row ──

function CelulaPlanRow({ item, compact, showSwapButton, supervisorId, otherSupervisor, otherCelulas, coordenacaoId }: {
  item: CelulaPlanItem;
  compact?: boolean;
  showSwapButton?: boolean;
  supervisorId?: string;
  otherSupervisor?: SupervisorInfo | null;
  otherCelulas?: CelulaPlanItem[];
  coordenacaoId?: string;
}) {
  const cfg = PRIORITY_CONFIG[item.priority_label];
  const [swapOpen, setSwapOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border} ${item.realizada ? 'opacity-60' : ''}`}>
        <span className="text-base shrink-0">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{item.celula_name}</p>
            {item.realizada && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">✓ Realizada</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            📅 {item.suggested_day_label}
            {item.meeting_day && !compact && (
              <span className="ml-2 opacity-70">· Encontro: {item.meeting_day}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={`${cfg.color} text-[10px]`}>
            {item.priority_label === 'Prioridade de cuidado' ? 'Cuidado' : item.priority_label}
          </Badge>
          {showSwapButton && otherSupervisor && !item.realizada && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSwapOpen(true)} title="Propor troca">
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {swapOpen && supervisorId && otherSupervisor && coordenacaoId && (
        <SwapDialog
          open={swapOpen}
          onOpenChange={setSwapOpen}
          myCelula={item}
          supervisorId={supervisorId}
          otherSupervisor={otherSupervisor}
          otherCelulas={otherCelulas || []}
          coordenacaoId={coordenacaoId}
        />
      )}
    </>
  );
}

// ── Swap Dialog ──

function SwapDialog({ open, onOpenChange, myCelula, supervisorId, otherSupervisor, otherCelulas, coordenacaoId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  myCelula: CelulaPlanItem;
  supervisorId: string;
  otherSupervisor: SupervisorInfo;
  otherCelulas: CelulaPlanItem[];
  coordenacaoId: string;
}) {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const createSwap = useCreateSwap();

  const availableTargets = otherCelulas.filter(c => !c.realizada);

  const handleSubmit = () => {
    if (!selectedTarget) return;
    createSwap.mutate({
      proposer_supervisor_id: supervisorId,
      proposer_celula_id: myCelula.celula_id,
      target_supervisor_id: otherSupervisor.id,
      target_celula_id: selectedTarget,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Propor troca
          </DialogTitle>
          <DialogDescription className="text-xs">
            Trocar <strong>{myCelula.celula_name}</strong> por uma célula de {otherSupervisor.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium mb-1">Minha célula (saindo):</p>
            <Badge variant="outline" className="text-xs">{myCelula.celula_name}</Badge>
          </div>
          <div>
            <p className="text-xs font-medium mb-1">Célula do outro supervisor (recebendo):</p>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione uma célula" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map(c => (
                  <SelectItem key={c.celula_id} value={c.celula_id} className="text-xs">
                    {c.celula_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!selectedTarget || createSwap.isPending}>
            {createSwap.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar proposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
