import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, ArrowRight, AlertTriangle, Phone, ChevronDown, ChevronRight,
  Filter, Users, Footprints, MessageCircle,
} from 'lucide-react';
import { useAltarCelulaFunnel, PeriodDays, FunnelStep, StalledLife } from '@/hooks/useAltarCelulaFunnel';
import { SectionLabel } from './SectionLabel';
import { cn } from '@/lib/utils';

interface AltarCelulaPanelProps {
  campoId?: string | null;
  title?: string;
}

export function AltarCelulaPanel({ campoId, title }: AltarCelulaPanelProps) {
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [etapaFilter, setEtapaFilter] = useState<string>('all');
  const { data, isLoading } = useAltarCelulaFunnel(period, campoId);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!data) return null;

  const periodLabel = period === 7 ? '7 dias' : period === 30 ? '30 dias' : '90 dias';

  return (
    <div className="space-y-6">
      {/* Header + period filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SectionLabel title={title || 'Do Altar à Célula'} subtitle={`Mapa de integração · últimos ${periodLabel}`} />
        <div className="flex items-center gap-2">
          {([7, 30, 90] as PeriodDays[]).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p}d
            </Button>
          ))}
        </div>
      </div>

      {/* ═══ FUNNEL STEPPER ═══ */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <FunnelStepper steps={data.steps} />
        </CardContent>
      </Card>

      {/* ═══ BOTTLENECK ═══ */}
      {data.bottleneck && data.steps[0].value > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Gargalo atual: {data.bottleneck.from} → {data.bottleneck.to}{' '}
                <Badge variant="secondary" className="ml-1 text-xs bg-amber-500/10 text-amber-700">
                  queda {data.bottleneck.dropPct}%
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{data.bottleneck.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ STALLED LIVES ═══ */}
      <SectionLabel title="Vidas Paradas" subtitle={`Pessoas aguardando avanço · ${periodLabel}`} />

      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={etapaFilter} onValueChange={setEtapaFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Filtrar etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            <SelectItem value="encaminhada">Encaminhada</SelectItem>
            <SelectItem value="contatado">Contatado</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="integrado">Integrado</SelectItem>
            <SelectItem value="sem_resposta">Sem resposta</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredStalled(data.stalledLives, etapaFilter).length} vida(s)
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-center">Dias parado</TableHead>
                    <TableHead>Célula</TableHead>
                    <TableHead className="text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStalled(data.stalledLives, etapaFilter).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Footprints className="h-6 w-6 mx-auto mb-2 opacity-30" />
                        Nenhuma vida parada nesta etapa
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStalled(data.stalledLives, etapaFilter).slice(0, 50).map(life => (
                      <TableRow key={life.id}>
                        <TableCell className="font-medium text-sm">{life.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', etapaBadgeColor(life.etapa))}>
                            {etapaLabel(life.etapa)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn('text-sm tabular-nums font-medium', life.dias_parado >= 7 ? 'text-destructive' : life.dias_parado >= 3 ? 'text-amber-600' : 'text-foreground')}>
                            {life.dias_parado}d
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{life.celula_name || '—'}</TableCell>
                        <TableCell className="text-center">
                          {life.whatsapp ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => window.open(`https://wa.me/${life.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                            >
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Funnel Stepper ──

function FunnelStepper({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-0">
      {steps.map((step, i) => {
        const drop = i > 0 && steps[i - 1].value > 0
          ? steps[i - 1].value - step.value
          : 0;

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div className="flex flex-col items-center mx-1 sm:mx-2">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                {drop > 0 && (
                  <span className="text-[9px] text-destructive/70 font-medium">-{drop}</span>
                )}
              </div>
            )}
            <div className={cn(
              'rounded-xl border px-3 py-2 text-center min-w-[70px] sm:min-w-[85px] transition-colors',
              i === 0 ? 'bg-primary/10 border-primary/30' :
              step.value === 0 ? 'bg-muted/30 border-border' : 'bg-card border-border'
            )}>
              <div className="text-lg sm:text-xl font-bold tabular-nums text-foreground">{step.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{step.label}</div>
              {i > 0 && (
                <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0">
                  {step.pct}%
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ──

function filteredStalled(lives: StalledLife[], etapa: string): StalledLife[] {
  if (etapa === 'all') return lives;
  return lives.filter(l => l.etapa === etapa);
}

function etapaLabel(etapa: string): string {
  const map: Record<string, string> = {
    encaminhada: 'Encaminhada',
    contatado: 'Contatado',
    agendado: 'Agendado',
    integrado: 'Integrado',
    sem_resposta: 'Sem resposta',
  };
  return map[etapa] || etapa;
}

function etapaBadgeColor(etapa: string): string {
  const map: Record<string, string> = {
    encaminhada: 'border-blue-500/30 text-blue-600',
    contatado: 'border-amber-500/30 text-amber-600',
    agendado: 'border-purple-500/30 text-purple-600',
    integrado: 'border-green-500/30 text-green-600',
    sem_resposta: 'border-destructive/30 text-destructive',
  };
  return map[etapa] || '';
}
