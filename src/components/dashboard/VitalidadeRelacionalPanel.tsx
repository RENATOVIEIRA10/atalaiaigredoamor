import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Activity, Heart, ShieldAlert, UserX, ChevronDown, ChevronUp, Sparkles, Users, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  VitalidadeSummary,
  VitalidadeScore,
  VitalidadeLevel,
  VITALIDADE_CONFIG,
  useVitalidadeMembros,
  useVitalidadeLideres,
} from '@/hooks/useVitalidadeRelacional';

// ─── Microcopy helpers ──────────────────────────
function buildMotivosVitalidade(item: VitalidadeScore): { presentes: string[]; ausentes: string[] } {
  const presentes = item.details;
  const ausentes: string[] = [];

  if (item.role === 'membro') {
    if (!presentes.some(d => d.includes('discipulado'))) ausentes.push('Não está em acompanhamento de discipulado');
    if (!presentes.some(d => d.includes('ministério'))) ausentes.push('Não participa de nenhum ministério');
    if (!presentes.some(d => d.includes('evento'))) ausentes.push('Não participou de eventos recentes');
    if (!presentes.some(d => d.includes('marco'))) ausentes.push('Nenhum marco espiritual registrado');
    if (!presentes.some(d => d.includes('resença'))) ausentes.push('Presença irregular nas reuniões de célula');
  } else {
    if (!presentes.some(d => d.includes('elatório'))) ausentes.push('Relatórios semanais não estão sendo enviados regularmente');
    if (!presentes.some(d => d.includes('upervisão'))) ausentes.push('Supervisões não registradas nas últimas semanas');
    if (!presentes.some(d => d.includes('formação'))) ausentes.push('Sem líderes em formação na célula');
    if (!presentes.some(d => d.includes('iscipulado'))) ausentes.push('Membros da célula não estão em discipulado');
    if (!presentes.some(d => d.includes('evento'))) ausentes.push('Sem participação em eventos da igreja');
  }

  return { presentes, ausentes };
}

function buildSugestaoVitalidade(item: VitalidadeScore): string {
  if (item.level === 'isolamento') {
    return item.role === 'membro'
      ? 'Esta pessoa precisa de contato urgente. Convide para a célula, inclua em um grupo de discipulado.'
      : 'Este líder pode estar sobrecarregado ou desanimado. Ofereça escuta ativa e apoio prático.';
  }
  if (item.level === 'risco_relacional') {
    return item.role === 'membro'
      ? 'Considere incluir em um discipulado ou ministério. Pequenas ações podem reconectar.'
      : 'Incentive o envio de relatórios e a participação em supervisões. Avalie se precisa de apoio.';
  }
  return item.role === 'membro'
    ? 'Acompanhe para que continue progredindo na caminhada espiritual.'
    : 'Encoraje a continuar sendo fiel nas atividades regulares.';
}

// ─── Score Detail Dialog ────────────────────────
function ScoreDetailDialog({ item, open, onOpenChange }: { item: VitalidadeScore; open: boolean; onOpenChange: (v: boolean) => void }) {
  const config = VITALIDADE_CONFIG[item.level];
  const { presentes, ausentes } = buildMotivosVitalidade(item);
  const sugestao = buildSugestaoVitalidade(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{item.name}</DialogTitle>
          <DialogDescription>{item.entityName} · {item.score}/{item.maxScore} pts — {config.label}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {presentes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">✅ Pontos positivos</p>
              <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                {presentes.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {ausentes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">🔍 Por que está sinalizado?</p>
              <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                {ausentes.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">💡 Sugestão pastoral</p>
            <p className="text-sm text-muted-foreground">{sugestao}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScoreInfoTooltip({ item }: { item: VitalidadeScore }) {
  const { ausentes } = buildMotivosVitalidade(item);
  if (ausentes.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="shrink-0 p-0.5 rounded-full hover:bg-muted/80 transition-colors" aria-label="Por que está sinalizado?">
          <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[280px] space-y-1">
        <p className="font-semibold text-xs">Por que está sinalizado?</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          {ausentes.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Score Row ──────────────────────────────────
function ScoreRow({ item }: { item: VitalidadeScore }) {
  const config = VITALIDADE_CONFIG[item.level];
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
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
          <ScoreInfoTooltip item={item} />
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${config.bgColor} ${config.color}`}>
            {config.label}
          </Badge>
        </div>
      </div>
      <ScoreDetailDialog item={item} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

function TabDescription({ tab, mode }: { tab: string; mode: 'membros' | 'lideres' }) {
  const descs: Record<string, Record<string, string>> = {
    membros: {
      risco: 'Membros com participação muito baixa. Priorize contato pessoal e acompanhamento.',
      atencao: 'Membros que precisam de incentivo para se engajar mais em discipulado ou ministério.',
      grupos: 'Visão por grupo — identifique quais células precisam de mais atenção pastoral.',
      todos: 'Todos os membros avaliados. Clique em cada nome para ver detalhes e sugestões.',
    },
    lideres: {
      risco: 'Líderes sem relatórios, supervisões ou discipulado ativos. Podem precisar de apoio.',
      atencao: 'Líderes com engajamento parcial. Incentive a regularidade nas atividades.',
      grupos: 'Visão por coordenação — identifique onde a liderança precisa de suporte.',
      todos: 'Todos os líderes avaliados. Clique em cada nome para ver detalhes e sugestões.',
    },
  };
  return (
    <p className="text-xs text-muted-foreground italic px-1 pb-2 border-b border-border/30 mb-1">
      {descs[mode]?.[tab] || ''}
    </p>
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
      <MiniStat label="Conectados" value={summary.conectados} color="text-emerald-600" bg="bg-emerald-500/10"
        tooltip="Pessoas com participação plena: discipulado, ministério, presença e marcos espirituais." />
      <MiniStat label="Atenção leve" value={summary.atencaoLeve} color="text-blue-600" bg="bg-blue-500/10"
        tooltip="Participação parcial. Faltam 1 ou 2 elementos para estarem plenamente conectados." />
      <MiniStat label="Risco relacional" value={summary.riscoRelacional} color="text-amber-600" bg="bg-amber-500/10"
        tooltip="Poucos pontos de conexão. Precisam ser incluídos em atividades de discipulado ou ministério." />
      <MiniStat label="Isolamento" value={summary.isolamento} color="text-destructive" bg="bg-destructive/10"
        tooltip="Quase nenhuma participação. Prioridade de contato pessoal imediato." />
    </div>
  );
}

function MiniStat({ label, value, color, bg, tooltip }: { label: string; value: number; color: string; bg: string; tooltip?: string }) {
  const content = (
    <div className={`rounded-xl border p-3 ${bg} border-border/30`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent className="max-w-[250px]">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
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
          <div className="flex-1">
            <CardTitle className="text-base">Índice de Vitalidade Relacional</CardTitle>
            <CardDescription>Cuidado pastoral preventivo — membros da célula</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/80" aria-label="Como funciona?">
                <Info className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px]">
              <p className="font-semibold text-xs mb-1">Como funciona o cálculo?</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>+2 pts se está em discipulado</li>
                <li>+2 pts se serve em ministério</li>
                <li>+1 pt se participou de evento recente</li>
                <li>+1 pt se tem marco espiritual</li>
                <li>+1 pt se tem presença ativa na célula</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-1">Clique em cada nome para ver detalhes e sugestões.</p>
            </TooltipContent>
          </Tooltip>
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

// ─── Cascading Panel ────────────────────────────
interface VitalidadeCascataProps {
  mode: 'membros' | 'lideres';
  celulaId?: string;
  coordenacaoId?: string;
  redeId?: string;
  groupNames?: Record<string, string>;
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

  const howItWorksContent = mode === 'membros'
    ? ['Discipulado (+2 pts)', 'Ministério (+2 pts)', 'Evento recente (+1 pt)', 'Marco espiritual (+1 pt)', 'Presença ativa (+1 pt)']
    : ['Relatórios regulares (+2 pts)', 'Supervisões ativas (+2 pts)', 'Líderes em formação (+1 pt)', 'Discipulado ativo (+1 pt)', 'Participação em eventos (+1 pt)'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description || defaultDesc}</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/80" aria-label="Como funciona?">
                <Info className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px]">
              <p className="font-semibold text-xs mb-1">Como funciona o cálculo?</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                {howItWorksContent.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <p className="text-xs text-muted-foreground mt-1">6-7 pts: Conectado · 4-5: Atenção · 2-3: Risco · 0-1: Isolamento</p>
            </TooltipContent>
          </Tooltip>
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
              <TabDescription tab="risco" mode={mode} />
              <ScoreList
                items={data.items.filter(i => i.level === 'risco_relacional' || i.level === 'isolamento')}
                maxHeight="h-72"
              />
            </TabsContent>
            <TabsContent value="atencao">
              <TabDescription tab="atencao" mode={mode} />
              <ScoreList items={data.items.filter(i => i.level === 'atencao_leve')} maxHeight="h-72" />
            </TabsContent>
            <TabsContent value="grupos">
              <TabDescription tab="grupos" mode={mode} />
              <GroupedView summary={data} groupNames={groupNames} />
            </TabsContent>
            <TabsContent value="todos">
              <TabDescription tab="todos" mode={mode} />
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
