import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Activity, Heart, ShieldAlert, UserX, ChevronDown, ChevronUp, Sparkles, Users } from 'lucide-react';
import {
  VitalidadeSummary,
  VitalidadeScore,
  VitalidadeLevel,
  VITALIDADE_CONFIG,
  useVitalidadeMembros,
  useVitalidadeLideres,
} from '@/hooks/useVitalidadeRelacional';

// ─── Score Row ──────────────────────────────────
function ScoreRow({ item }: { item: VitalidadeScore }) {
  const config = VITALIDADE_CONFIG[item.level];

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.entityName} · {item.score}/{item.maxScore} pts
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16">
          <Progress value={(item.score / item.maxScore) * 100} className="h-1.5" />
        </div>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${config.bgColor} ${config.color}`}>
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

function ScoreList({ items, maxHeight = 'h-64' }: { items: VitalidadeScore[]; maxHeight?: string }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Heart className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nenhuma pessoa nesta categoria 🙏
      </div>
    );
  }

  return (
    <ScrollArea className={maxHeight}>
      <div className="divide-y divide-border/50">
        {items.sort((a, b) => a.score - b.score).map(item => (
          <ScoreRow key={item.id} item={item} />
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── KPI Row ────────────────────────────────────
function KPIRow({ summary }: { summary: VitalidadeSummary }) {
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
      <MiniStat
        label="Conectados"
        value={summary.conectados}
        color="text-emerald-600"
        bg="bg-emerald-500/10"
      />
      <MiniStat
        label="Atenção leve"
        value={summary.atencaoLeve}
        color="text-blue-600"
        bg="bg-blue-500/10"
      />
      <MiniStat
        label="Risco relacional"
        value={summary.riscoRelacional}
        color="text-amber-600"
        bg="bg-amber-500/10"
      />
      <MiniStat
        label="Isolamento"
        value={summary.isolamento}
        color="text-destructive"
        bg="bg-destructive/10"
      />
    </div>
  );
}

function MiniStat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-3 ${bg} border-border/30`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Grouped View ───────────────────────────────
function GroupedView({
  summary,
  groupNames = {},
}: {
  summary: VitalidadeSummary;
  groupNames?: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ScrollArea className="h-72">
      <div className="space-y-1">
        {Object.entries(summary.byGroup).map(([groupId, groupItems]) => {
          const atRisk = groupItems.filter(i => i.level === 'risco_relacional' || i.level === 'isolamento').length;
          return (
            <Collapsible key={groupId} open={expanded.has(groupId)} onOpenChange={() => toggle(groupId)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">
                  {groupNames[groupId] || groupItems[0]?.entityName || groupId}
                </span>
                <div className="flex items-center gap-2">
                  {atRisk > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                      {atRisk} em risco
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{groupItems.length}</Badge>
                  {expanded.has(groupId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-2 border-l-2 border-border/50 pl-2">
                  {groupItems.sort((a, b) => a.score - b.score).map(item => (
                    <ScoreRow key={item.id} item={item} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ─── Member Vitality Panel (Cell Leader sees members) ───
export function VitalidadeMembrosPanel({ celulaId }: { celulaId: string }) {
  const { data, isLoading } = useVitalidadeMembros({ celulaId });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Índice de Vitalidade Relacional</CardTitle>
            <CardDescription>Cuidado pastoral preventivo — membros da célula</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Progress value={data.percentualSaudavel} className="flex-1" />
          <span className="text-sm font-medium tabular-nums">{data.percentualSaudavel}% saudável</span>
        </div>

        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro para avaliar</p>
        ) : data.riscoRelacional + data.isolamento === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos os membros estão conectados! 🙏
          </p>
        ) : (
          <ScoreList
            items={data.items.filter(i => i.level === 'risco_relacional' || i.level === 'isolamento' || i.level === 'atencao_leve')}
            maxHeight="h-48"
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cascading Panel (Supervisor→Leaders, Coordinator→Leaders, Network→Coords, Pastor→Networks) ───
interface VitalidadeCascataProps {
  // What we're evaluating
  mode: 'membros' | 'lideres';
  // Filters
  celulaId?: string;
  coordenacaoId?: string;
  redeId?: string;
  // Group label map
  groupNames?: Record<string, string>;
  // Custom title/description
  title?: string;
  description?: string;
}

export function VitalidadeCascataPanel({
  mode,
  celulaId,
  coordenacaoId,
  redeId,
  groupNames = {},
  title = 'Índice de Vitalidade Relacional',
  description,
}: VitalidadeCascataProps) {
  const membrosQuery = useVitalidadeMembros(mode === 'membros' ? { celulaId, coordenacaoId, redeId } : {});
  const lideresQuery = useVitalidadeLideres(mode === 'lideres' ? { coordenacaoId, redeId } : {});

  const { data, isLoading } = mode === 'membros' ? membrosQuery : lideresQuery;

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return null;

  const defaultDesc = mode === 'membros'
    ? 'Cuidado pastoral preventivo dos membros'
    : 'Vitalidade ministerial da liderança';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description || defaultDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <KPIRow summary={data} />

        <div className="flex items-center gap-3">
          <Progress value={data.percentualSaudavel} className="flex-1" />
          <span className="text-sm font-medium tabular-nums">{data.percentualSaudavel}% saudável</span>
        </div>

        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
        ) : (
          <Tabs defaultValue="risco" className="space-y-3">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="risco">Em risco ({data.riscoRelacional + data.isolamento})</TabsTrigger>
              <TabsTrigger value="atencao">Atenção ({data.atencaoLeve})</TabsTrigger>
              <TabsTrigger value="grupos">Por grupo</TabsTrigger>
              <TabsTrigger value="todos">Todos ({data.total})</TabsTrigger>
            </TabsList>

            <TabsContent value="risco">
              <ScoreList
                items={data.items.filter(i => i.level === 'risco_relacional' || i.level === 'isolamento')}
                maxHeight="h-72"
              />
            </TabsContent>
            <TabsContent value="atencao">
              <ScoreList items={data.items.filter(i => i.level === 'atencao_leve')} maxHeight="h-72" />
            </TabsContent>
            <TabsContent value="grupos">
              <GroupedView summary={data} groupNames={groupNames} />
            </TabsContent>
            <TabsContent value="todos">
              <ScoreList items={data.items} maxHeight="h-72" />
            </TabsContent>
          </Tabs>
        )}

        {/* Sugestões de cuidado */}
        {(data.isolamento > 0 || data.riscoRelacional > 0) && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sugestões de cuidado</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {data.isolamento > 0 && (
                <li>{data.isolamento} pessoa(s) em isolamento — priorize contato pessoal esta semana</li>
              )}
              {data.riscoRelacional > 0 && (
                <li>{data.riscoRelacional} pessoa(s) em risco relacional — considere incluir em discipulado ou ministério</li>
              )}
              {mode === 'lideres' && data.riscoRelacional > 0 && (
                <li>Líder(es) sem relatórios ou supervisões recentes — ofereça apoio e escuta</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
