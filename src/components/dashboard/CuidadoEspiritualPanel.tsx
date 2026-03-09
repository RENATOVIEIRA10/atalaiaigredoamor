import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  HeartPulse, AlertTriangle, ShieldAlert, UserX,
  Heart, BookOpen, Droplets, GraduationCap, Church,
  Loader2, Users, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useCuidadoEspiritual, CuidadoAlert, AlertType } from '@/hooks/useCuidadoEspiritual';
import { StatCard } from '@/components/ui/stat-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const ALERT_CONFIG: Record<AlertType, { label: string; color: string; icon: typeof AlertTriangle; description: string }> = {
  risco_isolamento: {
    label: 'Risco de Isolamento',
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: UserX,
    description: 'Sem discipulado, não serve e sem marcos espirituais',
  },
  risco_estagnacao: {
    label: 'Risco de Estagnação',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    icon: ShieldAlert,
    description: '+2 anos de igreja sem servir em ministério',
  },
  precisa_cuidado: {
    label: 'Precisa de Cuidado',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: Heart,
    description: '+1 ano de igreja sem discipulado',
  },
};

function buildMotivos(alert: CuidadoAlert): string[] {
  const motivos: string[] = [];

  if (alert.type === 'risco_isolamento') {
    if (!alert.isDiscipulado) motivos.push('Não está sendo acompanhado em discipulado');
    if (!alert.serveMinisterio) motivos.push('Não participa de nenhum ministério');
    if (alert.marcosCount === 0) motivos.push('Nenhum marco espiritual registrado (batismo, encontro, curso, renovo)');
  }

  if (alert.type === 'risco_estagnacao') {
    motivos.push(`Está na igreja há ${alert.yearsInChurch >= 2 ? Math.floor(alert.yearsInChurch) + ' anos' : alert.yearsInChurch.toFixed(1) + ' ano(s)'}`);
    if (!alert.serveMinisterio) motivos.push('Não exerce nenhuma função em ministério');
  }

  if (alert.type === 'precisa_cuidado') {
    motivos.push(`Está na igreja há ${alert.yearsInChurch >= 2 ? Math.floor(alert.yearsInChurch) + ' anos' : alert.yearsInChurch.toFixed(1) + ' ano(s)'}`);
    if (!alert.isDiscipulado) motivos.push('Não está em acompanhamento de discipulado');
  }

  // Marcos ausentes
  if (!alert.marcos.batismo && alert.type !== 'risco_isolamento') motivos.push('Ainda não foi batizado');
  if (!alert.marcos.encontro && alert.type !== 'risco_isolamento') motivos.push('Ainda não participou do Encontro com Deus');

  return motivos;
}

function buildSugestao(alert: CuidadoAlert): string {
  if (alert.type === 'risco_isolamento') {
    return 'Priorize contato pessoal. Convide para participar de um grupo de discipulado ou ministério da igreja.';
  }
  if (alert.type === 'risco_estagnacao') {
    return 'Converse com essa pessoa sobre seus dons e como poderia servir. Incentive a participação em um ministério.';
  }
  return 'Considere iniciar um acompanhamento de discipulado com essa pessoa.';
}

function MarcosIcons({ marcos }: { marcos: CuidadoAlert['marcos'] }) {
  return (
    <div className="flex gap-1.5">
      {marcos.batismo && <span title="Batismo"><Droplets className="h-3.5 w-3.5 text-primary" /></span>}
      {marcos.encontro && <span title="Encontro com Deus"><Church className="h-3.5 w-3.5 text-primary" /></span>}
      {marcos.cursoLidere && <span title="Curso Lidere"><GraduationCap className="h-3.5 w-3.5 text-primary" /></span>}
      {marcos.renovo && <span title="Renovo"><BookOpen className="h-3.5 w-3.5 text-primary" /></span>}
    </div>
  );
}

function AlertDetailDialog({ alert, open, onOpenChange }: { alert: CuidadoAlert; open: boolean; onOpenChange: (v: boolean) => void }) {
  const config = ALERT_CONFIG[alert.type];
  const Icon = config.icon;
  const motivos = buildMotivos(alert);
  const sugestao = buildSugestao(alert);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5" />
            {alert.memberName}
          </DialogTitle>
          <DialogDescription>{alert.celulaName} · {config.label}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              🔍 Por que está aqui?
            </p>
            <ul className="text-sm text-foreground space-y-1.5 list-disc list-inside">
              {motivos.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">💡 Sugestão pastoral</p>
            <p className="text-sm text-muted-foreground">{sugestao}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Marcos espirituais:</span>
            <MarcosIcons marcos={alert.marcos} />
            {alert.marcosCount === 0 && <span className="italic">nenhum registrado</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlertInfoTooltip({ alert }: { alert: CuidadoAlert }) {
  const motivos = buildMotivos(alert);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="shrink-0 p-0.5 rounded-full hover:bg-muted/80 transition-colors" aria-label="Por que está aqui?">
          <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[280px] space-y-1">
        <p className="font-semibold text-xs">Por que está aqui?</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          {motivos.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function AlertRow({ alert }: { alert: CuidadoAlert }) {
  const config = ALERT_CONFIG[alert.type];
  const Icon = config.icon;
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-70" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.memberName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {alert.celulaName} · {alert.yearsInChurch.toFixed(0)} {alert.yearsInChurch >= 2 ? 'anos' : 'ano'} de igreja
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MarcosIcons marcos={alert.marcos} />
          <AlertInfoTooltip alert={alert} />
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${config.color}`}>
            {alert.type === 'risco_isolamento' ? 'Isolamento' : alert.type === 'risco_estagnacao' ? 'Estagnação' : 'Cuidado'}
          </Badge>
        </div>
      </div>
      <AlertDetailDialog alert={alert} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

function CategoryDescription({ type }: { type: AlertType | 'todos' }) {
  const descriptions: Record<string, string> = {
    todos: 'Todos os membros que precisam de acompanhamento pastoral. Clique em cada nome para entender os motivos.',
    risco_isolamento: 'Membros sem discipulado, sem ministério e sem marcos espirituais. São os que mais precisam de atenção urgente.',
    risco_estagnacao: 'Membros com mais de 2 anos de igreja que não servem em nenhum ministério. Podem estar desanimados ou sem direcionamento.',
    precisa_cuidado: 'Membros com mais de 1 ano de igreja que não estão em discipulado. Precisam de acompanhamento para crescer na fé.',
  };

  return (
    <p className="text-xs text-muted-foreground italic px-1 pb-2 border-b border-border/30 mb-1">
      {descriptions[type]}
    </p>
  );
}

function AlertList({ alerts, maxHeight = 'h-64', category = 'todos' as AlertType | 'todos' }: { alerts: CuidadoAlert[]; maxHeight?: string; category?: AlertType | 'todos' }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <HeartPulse className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nenhum alerta nesta categoria 🙏
      </div>
    );
  }

  return (
    <div>
      <CategoryDescription type={category} />
      <ScrollArea className={maxHeight}>
        <div className="divide-y divide-border/50">
          {alerts.map(alert => <AlertRow key={alert.id} alert={alert} />)}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Cell Leader View ──────────────────────────────────
export function CuidadoEspiritualCelula({ celulaId }: { celulaId: string }) {
  const { data, isLoading } = useCuidadoEspiritual({ celulaId });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return null;

  const alertCount = data.alerts.length;
  const healthPercent = data.totalMembers > 0 ? Math.round(((data.totalMembers - alertCount) / data.totalMembers) * 100) : 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-base">Cuidado Espiritual</CardTitle>
            <CardDescription>Membros que precisam de acompanhamento</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/80" aria-label="Como funciona?">
                <Info className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px]">
              <p className="font-semibold text-xs mb-1">Como funciona?</p>
              <p className="text-xs text-muted-foreground">
                O sistema identifica automaticamente membros que podem estar sem acompanhamento adequado,
                com base no tempo de igreja, discipulado, ministério e marcos espirituais.
                Clique em cada nome para ver os motivos e sugestões pastorais.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Progress value={healthPercent} className="flex-1" />
          <span className="text-sm font-medium tabular-nums">{healthPercent}% saudável</span>
        </div>

        {alertCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos os membros estão sendo acompanhados! 🙏
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              {alertCount} membro{alertCount > 1 ? 's' : ''} precisa{alertCount > 1 ? 'm' : ''} de atenção
            </p>
            <AlertList alerts={data.alerts} maxHeight="h-48" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Consolidated View (Coordinator / Supervisor / Network / Pastor) ───
interface CuidadoEspiritualConsolidadoProps {
  coordenacaoId?: string;
  redeId?: string;
  groupBy?: 'celula' | 'coordenacao' | 'rede';
  groupNames?: Record<string, string>;
}

export function CuidadoEspiritualConsolidado({
  coordenacaoId,
  redeId,
  groupBy = 'celula',
  groupNames = {},
}: CuidadoEspiritualConsolidadoProps) {
  const { data, isLoading } = useCuidadoEspiritual({ coordenacaoId, redeId });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return null;

  const grouped = groupBy === 'rede' ? data.byRede : groupBy === 'coordenacao' ? data.byCoordenacao : data.byCelula;
  const healthPercent = data.totalMembers > 0 ? Math.round(((data.totalMembers - data.alerts.length) / data.totalMembers) * 100) : 100;

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-base">Cuidado Espiritual & Pertencimento</CardTitle>
            <CardDescription>Visão preventiva de acompanhamento pastoral</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/80" aria-label="Como funciona?">
                <Info className="h-4 w-4 text-muted-foreground/60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px]">
              <p className="font-semibold text-xs mb-1">Como funciona?</p>
              <p className="text-xs text-muted-foreground">
                Membros são sinalizados quando faltam elementos-chave na jornada espiritual:
                discipulado, ministério e marcos como batismo e Encontro com Deus.
                O objetivo é cuidado preventivo — nenhuma ovelha invisível.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPIs with tooltips */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Membros Ativos" value={data.totalMembers} />
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard
                  icon={Heart}
                  label="Precisa de Cuidado"
                  value={data.precisaCuidado.length}
                  className={data.precisaCuidado.length > 0 ? 'border-blue-500/30' : ''}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
              <p className="text-xs">+1 ano de igreja sem acompanhamento de discipulado</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard
                  icon={ShieldAlert}
                  label="Risco de Estagnação"
                  value={data.riscoEstagnacao.length}
                  className={data.riscoEstagnacao.length > 0 ? 'border-amber-500/30' : ''}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
              <p className="text-xs">+2 anos de igreja sem servir em nenhum ministério</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard
                  icon={UserX}
                  label="Risco de Isolamento"
                  value={data.riscoIsolamento.length}
                  className={data.riscoIsolamento.length > 0 ? 'border-destructive/30' : ''}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[250px]">
              <p className="text-xs">Sem discipulado, sem ministério e sem marcos espirituais — maior risco pastoral</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Health bar */}
        <div className="flex items-center gap-3">
          <Progress value={healthPercent} className="flex-1" />
          <span className="text-sm font-medium tabular-nums">{healthPercent}% saudável</span>
        </div>

        {data.alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos os membros estão sendo acompanhados! 🙏
          </p>
        ) : (
          <Tabs defaultValue="todos" className="space-y-3">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="todos">Todos ({data.alerts.length})</TabsTrigger>
              <TabsTrigger value="isolamento">Isolamento ({data.riscoIsolamento.length})</TabsTrigger>
              <TabsTrigger value="estagnacao">Estagnação ({data.riscoEstagnacao.length})</TabsTrigger>
              <TabsTrigger value="cuidado">Cuidado ({data.precisaCuidado.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="todos">
              <ScrollArea className="h-72">
                <CategoryDescription type="todos" />
                <div className="space-y-1">
                  {Object.entries(grouped).map(([groupId, groupAlerts]) => (
                    <Collapsible key={groupId} open={expandedGroups.has(groupId)} onOpenChange={() => toggleGroup(groupId)}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium">
                          {groupNames[groupId] || groupAlerts[0]?.celulaName || groupId}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{groupAlerts.length}</Badge>
                          {expandedGroups.has(groupId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-2 border-l-2 border-border/50 pl-2">
                          {groupAlerts.map(a => <AlertRow key={a.id} alert={a} />)}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="isolamento">
              <AlertList alerts={data.riscoIsolamento} maxHeight="h-72" category="risco_isolamento" />
            </TabsContent>
            <TabsContent value="estagnacao">
              <AlertList alerts={data.riscoEstagnacao} maxHeight="h-72" category="risco_estagnacao" />
            </TabsContent>
            <TabsContent value="cuidado">
              <AlertList alerts={data.precisaCuidado} maxHeight="h-72" category="precisa_cuidado" />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
