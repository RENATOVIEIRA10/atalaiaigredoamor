import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle, Eye, Heart } from 'lucide-react';
import { usePlanejamentoBimestral, SemanaPlano, CelulaPlanItem } from '@/hooks/usePlanejamentoBimestral';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/empty-state';

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
  const queryClient = useQueryClient();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2]));

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  };

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
    return (
      <EmptyState
        icon={Calendar}
        title="Sem células para planejar"
        description="Nenhuma célula encontrada no seu escopo de supervisão"
      />
    );
  }

  // Summary KPIs
  const totalPlanejadas = data.semanas.reduce((sum, s) => sum + s.celulas.length, 0);
  const realizadas = data.semanas.reduce((sum, s) => sum + s.celulas.filter(c => c.realizada).length, 0);
  const prioridadeCuidado = data.celulas_no_escopo.filter(c => c.priority_label === 'Prioridade de cuidado').length;

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

      <Card className="border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium">{data.bimestre_label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.total_celulas} célula(s) · {data.total_semanas} semanas · Sugestão automática
          </p>
          <div className="flex gap-4 mt-3 text-xs">
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
          </div>
        </CardContent>
      </Card>

      {/* Week-by-week plan */}
      <div className="space-y-2">
        {data.semanas.map(semana => (
          <WeekCard
            key={semana.week_number}
            semana={semana}
            expanded={expandedWeeks.has(semana.week_number)}
            onToggle={() => toggleWeek(semana.week_number)}
            compact={compact}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center italic px-4">
        💡 Este planejamento é uma sugestão para te ajudar a se organizar. Ajuste como preferir!
      </p>
    </div>
  );
}

function WeekCard({ semana, expanded, onToggle, compact }: {
  semana: SemanaPlano;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const allRealizadas = semana.celulas.length > 0 && semana.celulas.every(c => c.realizada);
  const hasItems = semana.celulas.length > 0;

  return (
    <Card className={`transition-all ${allRealizadas ? 'opacity-60' : ''}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onToggle}
      >
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
            <Badge variant="secondary" className="text-xs">
              {semana.celulas.length} visita(s)
            </Badge>
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
                <CelulaPlanRow key={cel.celula_id} item={cel} compact={compact} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function CelulaPlanRow({ item, compact }: { item: CelulaPlanItem; compact?: boolean }) {
  const cfg = PRIORITY_CONFIG[item.priority_label];

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border} ${item.realizada ? 'opacity-60' : ''}`}>
      <span className="text-base shrink-0">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.celula_name}</p>
          {item.realizada && (
            <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
              ✓ Realizada
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          📅 {item.suggested_day_label}
          {item.meeting_day && !compact && (
            <span className="ml-2 opacity-70">· Encontro: {item.meeting_day}</span>
          )}
        </p>
      </div>
      <Badge variant="outline" className={`${cfg.color} text-[10px] shrink-0`}>
        {item.priority_label === 'Prioridade de cuidado' ? 'Cuidado' : item.priority_label}
      </Badge>
    </div>
  );
}
