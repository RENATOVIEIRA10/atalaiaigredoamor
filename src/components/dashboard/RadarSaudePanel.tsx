import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShieldCheck, Eye, AlertTriangle, HelpCircle, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { useRadarSaude, CelulaSaude } from '@/hooks/useRadarSaude';
import { HealthLegend, HealthReason } from '@/components/health/HealthLegend';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatCard } from '@/components/ui/stat-card';

interface RadarSaudePanelProps {
  scopeType: 'rede' | 'coordenacao' | 'all';
  scopeId?: string;
  campoId?: string | null;
  title?: string;
  compact?: boolean; // PWA mode
}

const STATUS_CONFIG = {
  saudavel: { label: 'Saudável', emoji: '🟢', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  acompanhamento: { label: 'Acompanhamento', emoji: '🟡', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  critica: { label: 'Crítica', emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  sem_avaliacao: { label: 'Sem avaliação', emoji: '⚪', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' },
} as const;

export function RadarSaudePanel({ scopeType, scopeId, campoId, title = 'Saúde da Rede', compact = false }: RadarSaudePanelProps) {
  const { data, isLoading } = useRadarSaude({ scopeType, scopeId, campoId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!data || data.totalCelulas === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma célula encontrada neste escopo</p>
        </CardContent>
      </Card>
    );
  }

  const criticalCells = data.celulas.filter(c => c.status === 'critica');
  const attentionCells = data.celulas.filter(c => c.status === 'acompanhamento');

  if (compact) {
    return <CompactRadar data={data} criticalCells={criticalCells} attentionCells={attentionCells} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-4 w-4" /> {title}
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ShieldCheck} label="Saudáveis" value={data.saudaveis} className="border-green-500/20" />
        <StatCard icon={Eye} label="Acompanhamento" value={data.emAcompanhamento} className={data.emAcompanhamento > 0 ? 'border-amber-500/20' : ''} />
        <StatCard icon={AlertTriangle} label="Críticas" value={data.criticas} className={data.criticas > 0 ? 'border-destructive/20' : ''} />
        <StatCard icon={HelpCircle} label="Sem avaliação" value={data.semAvaliacao} />
      </div>

      {/* Critical cells list */}
      {criticalCells.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Células que precisam de cuidado
            </CardTitle>
            <CardDescription>Pontuação abaixo de 3.0 nas últimas supervisões</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {criticalCells.map(cel => (
                  <CelulaHealthRow key={cel.celula_id} celula={cel} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Attention cells */}
      {attentionCells.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-600" />
              Células em acompanhamento
            </CardTitle>
            <CardDescription>Pontuação entre 3.0 e 3.9</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {attentionCells.map(cel => (
                  <CelulaHealthRow key={cel.celula_id} celula={cel} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* All cells overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Visão geral – Todas as células
          </CardTitle>
          <CardDescription>{data.totalCelulas} célula(s) no escopo</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {data.celulas.map(cel => (
                <CelulaHealthRow key={cel.celula_id} celula={cel} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function CompactRadar({ data, criticalCells, attentionCells }: { data: any; criticalCells: CelulaSaude[]; attentionCells: CelulaSaude[] }) {
  return (
    <div className="space-y-3">
      {/* Mini KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat emoji="🟢" value={data.saudaveis} label="Saudável" />
        <MiniStat emoji="🟡" value={data.emAcompanhamento} label="Atenção" />
        <MiniStat emoji="🔴" value={data.criticas} label="Crítica" />
        <MiniStat emoji="⚪" value={data.semAvaliacao} label="S/ Aval." />
      </div>

      {/* Critical only */}
      {criticalCells.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              🔴 Células que precisam de cuidado
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {criticalCells.slice(0, 5).map(cel => (
                <CelulaHealthRow key={cel.celula_id} celula={cel} compact />
              ))}
              {criticalCells.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">+{criticalCells.length - 5} células</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {attentionCells.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              🟡 Em acompanhamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {attentionCells.slice(0, 3).map(cel => (
                <CelulaHealthRow key={cel.celula_id} celula={cel} compact />
              ))}
              {attentionCells.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">+{attentionCells.length - 3} células</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {criticalCells.length === 0 && attentionCells.length === 0 && (
        <Card className="border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-green-600 font-medium">🎉 Todas as células estão saudáveis!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CelulaHealthRow({ celula, compact = false }: { celula: CelulaSaude; compact?: boolean }) {
  const cfg = STATUS_CONFIG[celula.status];
  const daysAgo = celula.ultima_supervisao
    ? differenceInDays(new Date(), parseISO(celula.ultima_supervisao))
    : null;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
      <span className="text-lg shrink-0">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{celula.celula_name}</p>
        {!compact && <p className="text-xs text-muted-foreground truncate">{celula.coordenacao_name}</p>}
        <p className="text-xs text-muted-foreground">
          {celula.ultima_supervisao
            ? `Última: ${format(parseISO(celula.ultima_supervisao), "dd/MM", { locale: ptBR })} (${daysAgo}d atrás)`
            : 'Sem supervisão registrada'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {celula.media !== null && (
          <Badge variant="outline" className={`${cfg.color} text-xs font-bold`}>
            {celula.media.toFixed(1)}
          </Badge>
        )}
        {celula.tendencia && <TendenciaIcon tendencia={celula.tendencia} />}
      </div>
    </div>
  );
}

function TendenciaIcon({ tendencia }: { tendencia: 'subindo' | 'estavel' | 'descendo' }) {
  if (tendencia === 'subindo') return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (tendencia === 'descendo') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function MiniStat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
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
