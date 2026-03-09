import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  HeartPulse, AlertTriangle, ShieldAlert, UserX,
  Heart, BookOpen, Droplets, GraduationCap, Church,
  Loader2, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCuidadoEspiritual, CuidadoAlert, AlertType } from '@/hooks/useCuidadoEspiritual';
import { StatCard } from '@/components/ui/stat-card';
import { SectionLabel } from './SectionLabel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

function MarcosIcons({ marcos }: { marcos: CuidadoAlert['marcos'] }) {
  return (
    <div className="flex gap-1.5">
      {marcos.batismo && <Droplets className="h-3.5 w-3.5 text-blue-500" title="Batismo" />}
      {marcos.encontro && <Church className="h-3.5 w-3.5 text-purple-500" title="Encontro com Deus" />}
      {marcos.cursoLidere && <GraduationCap className="h-3.5 w-3.5 text-green-500" title="Curso Lidere" />}
      {marcos.renovo && <BookOpen className="h-3.5 w-3.5 text-amber-500" title="Renovo" />}
    </div>
  );
}

function AlertRow({ alert }: { alert: CuidadoAlert }) {
  const config = ALERT_CONFIG[alert.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{alert.memberName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {alert.celulaName} · {alert.yearsInChurch.toFixed(0)} {alert.yearsInChurch >= 2 ? 'anos' : 'ano'} de igreja
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <MarcosIcons marcos={alert.marcos} />
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${config.color}`}>
          {alert.type === 'risco_isolamento' ? 'Isolamento' : alert.type === 'risco_estagnacao' ? 'Estagnação' : 'Cuidado'}
        </Badge>
      </div>
    </div>
  );
}

function AlertList({ alerts, maxHeight = 'h-64' }: { alerts: CuidadoAlert[]; maxHeight?: string }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <HeartPulse className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nenhum alerta nesta categoria 🙏
      </div>
    );
  }

  return (
    <ScrollArea className={maxHeight}>
      <div className="divide-y divide-border/50">
        {alerts.map(alert => <AlertRow key={alert.id} alert={alert} />)}
      </div>
    </ScrollArea>
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
          <div>
            <CardTitle className="text-base">Cuidado Espiritual</CardTitle>
            <CardDescription>Membros que precisam de acompanhamento</CardDescription>
          </div>
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
          <div>
            <CardTitle className="text-base">Cuidado Espiritual & Pertencimento</CardTitle>
            <CardDescription>Visão preventiva de acompanhamento pastoral</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPIs */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Membros Ativos" value={data.totalMembers} />
          <StatCard
            icon={Heart}
            label="Precisa de Cuidado"
            value={data.precisaCuidado.length}
            className={data.precisaCuidado.length > 0 ? 'border-blue-500/30' : ''}
          />
          <StatCard
            icon={ShieldAlert}
            label="Risco de Estagnação"
            value={data.riscoEstagnacao.length}
            className={data.riscoEstagnacao.length > 0 ? 'border-amber-500/30' : ''}
          />
          <StatCard
            icon={UserX}
            label="Risco de Isolamento"
            value={data.riscoIsolamento.length}
            className={data.riscoIsolamento.length > 0 ? 'border-destructive/30' : ''}
          />
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
              <TabsTrigger value="isolamento" className="text-destructive">Isolamento ({data.riscoIsolamento.length})</TabsTrigger>
              <TabsTrigger value="estagnacao" className="text-amber-600">Estagnação ({data.riscoEstagnacao.length})</TabsTrigger>
              <TabsTrigger value="cuidado" className="text-blue-600">Cuidado ({data.precisaCuidado.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="todos">
              <ScrollArea className="h-72">
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
              <AlertList alerts={data.riscoIsolamento} maxHeight="h-72" />
            </TabsContent>
            <TabsContent value="estagnacao">
              <AlertList alerts={data.riscoEstagnacao} maxHeight="h-72" />
            </TabsContent>
            <TabsContent value="cuidado">
              <AlertList alerts={data.precisaCuidado} maxHeight="h-72" />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
