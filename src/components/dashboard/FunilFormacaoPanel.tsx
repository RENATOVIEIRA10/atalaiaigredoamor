import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Compass } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useProximosPassos, FunilStage, MARCOS_JORNADA } from '@/hooks/useProximosPassos';
import { useCelulas } from '@/hooks/useCelulas';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeIn } from '@/components/ui/animations';
import { useMemo } from 'react';

interface FunilFormacaoPanelProps {
  /** Filter members by coordenacao (via celulas) */
  coordenacaoId?: string;
  /** Filter members by rede (via celulas) */
  redeId?: string;
  title?: string;
}

function FunilBar({ stage, maxCount }: { stage: FunilStage; maxCount: number }) {
  const barWidth = maxCount > 0 ? Math.max(20, (stage.completed / maxCount) * 100) : 0;

  return (
    <div className="flex items-center gap-3 group">
      <div className="w-8 text-center text-lg shrink-0" title={stage.marco.label}>
        {stage.marco.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground truncate">{stage.marco.shortLabel}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {stage.completed}/{stage.total}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-medium w-8 text-right">{stage.percentage}%</span>
          </div>
        </div>
        <div className="relative h-6 bg-muted/50 rounded-lg overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
            style={{
              width: `${barWidth}%`,
              background: stage.percentage >= 75
                ? 'hsl(var(--vida))'
                : stage.percentage >= 50
                  ? 'hsl(var(--gold))'
                  : stage.percentage >= 25
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--ruby) / 0.7)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-foreground/80 drop-shadow-sm">
              {stage.completed} membro{stage.completed !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FunilFormacaoPanel({ coordenacaoId, redeId, title }: FunilFormacaoPanelProps) {
  const { data: allMembers, isLoading: membersLoading } = useMembers();
  const { data: celulas, isLoading: celulasLoading } = useCelulas();

  // Filter members by scope (coordenação or rede)
  const scopedMembers = useMemo(() => {
    if (!allMembers || !celulas) return [];
    
    const scopedCelulaIds = new Set(
      celulas
        .filter(c => {
          if (coordenacaoId) return c.coordenacao_id === coordenacaoId;
          if (redeId) return c.rede_id === redeId;
          return true;
        })
        .map(c => c.id)
    );

    return allMembers.filter(m => scopedCelulaIds.has(m.celula_id));
  }, [allMembers, celulas, coordenacaoId, redeId]);

  const { funil, summary } = useProximosPassos(scopedMembers);

  const isLoading = membersLoading || celulasLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-muted-foreground text-sm">Calculando funil...</div>
        </CardContent>
      </Card>
    );
  }

  if (scopedMembers.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sem dados para o funil"
        description="Não há membros cadastrados neste escopo para gerar o funil de formação."
      />
    );
  }

  const maxCompleted = Math.max(...funil.map(s => s.completed), 1);

  // Identify bottleneck (biggest drop between consecutive stages)
  let bottleneckIdx = -1;
  let biggestDrop = 0;
  for (let i = 1; i < funil.length; i++) {
    const drop = funil[i - 1].completed - funil[i].completed;
    if (drop > biggestDrop) {
      biggestDrop = drop;
      bottleneckIdx = i;
    }
  }

  return (
    <FadeIn>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title || 'Funil de Formação Espiritual'}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {scopedMembers.length} membros
            </span>
            {summary && (
              <>
                <span className="text-vida flex items-center gap-1">
                  ✅ {summary.fullyComplete} completo{summary.fullyComplete !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  📊 Média: {summary.avgCompletion}%
                </span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {funil.map((stage, idx) => (
            <div key={stage.marco.key} className="relative">
              <FunilBar stage={stage} maxCount={maxCompleted} />
              {idx === bottleneckIdx && biggestDrop > 2 && (
                <div className="absolute -right-1 top-0 bottom-0 flex items-center">
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 animate-pulse">
                    ⚠️ Gargalo
                  </Badge>
                </div>
              )}
            </div>
          ))}

          {/* Insight automático */}
          {bottleneckIdx > 0 && biggestDrop > 2 && (
            <div className="mt-4 p-3 rounded-xl bg-ruby/5 border border-ruby/20">
              <div className="flex items-start gap-2">
                <Compass className="h-4 w-4 text-ruby mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-ruby">Gargalo identificado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {biggestDrop} membros concluíram <strong>{funil[bottleneckIdx - 1].marco.shortLabel}</strong> mas
                    não avançaram para <strong>{funil[bottleneckIdx].marco.shortLabel}</strong>.
                    Considere organizar um evento ou acompanhamento direcionado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
