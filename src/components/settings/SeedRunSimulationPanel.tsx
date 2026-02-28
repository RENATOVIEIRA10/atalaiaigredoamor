import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FlaskConical, Play, Trash2, Loader2, CheckCircle2, XCircle, RefreshCw,
  Terminal, AlertTriangle, Shield, Settings2, ChevronRight, MapPin, Globe
} from 'lucide-react';
import { useSeedRuns, useCreateSeedRun, useSeedActions, SeedRun, SeedStepResult } from '@/hooks/useSeedRuns';
import { useCampos } from '@/hooks/useCampos';
import { useRedes } from '@/hooks/useRedes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───
export interface SeedConfig {
  campos: string[];  // campus IDs or ["ALL"]
  redes: string[];
  period: string;
  modules: string[];
  advanced: {
    volumeNovasVidas: number;
    taxaConversao: number;
    membrosPerCelula: number;
    distribuicaoIdade: Record<string, number>;
    bairros: string[];
    tipoCelula: string[];
  };
}

const DEFAULT_CONFIG: SeedConfig = {
  campos: [],
  redes: [],
  period: '3m',
  modules: ['hierarchy', 'members', 'reports', 'supervisoes'],
  advanced: {
    volumeNovasVidas: 80,
    taxaConversao: 60,
    membrosPerCelula: 7,
    distribuicaoIdade: { '18-25': 25, '26-35': 30, '36-45': 25, '46-60': 15, '60+': 5 },
    bairros: [],
    tipoCelula: ['mista', 'casais', 'jovens'],
  },
};

const ALL_MODULES = [
  { id: 'hierarchy', label: '🏗️ Hierarquia (Redes/Coords/Células)', desc: 'Cria a estrutura organizacional' },
  { id: 'members', label: '👥 Membros + Marcos Espirituais', desc: 'Gera membros com dados realistas' },
  { id: 'reports', label: '📋 Relatórios Semanais', desc: 'Relatórios de célula por semana' },
  { id: 'supervisoes', label: '🔍 Supervisões', desc: 'Visitas de supervisores às células' },
  { id: 'multiplicacoes', label: '🌱 Multiplicações', desc: 'Células que se multiplicaram' },
  { id: 'novas_vidas', label: '🕊️ Recomeço (Novas Vidas)', desc: 'Visitantes e novos convertidos' },
  { id: 'encaminhamentos', label: '📍 Encaminhamentos', desc: 'Encaminhamento de vidas para células' },
  { id: 'discipulado', label: '📖 Discipulado', desc: 'Encontros de discipulado por nível' },
  { id: 'roteiro', label: '📝 Roteiro de Célula', desc: 'Roteiros semanais das células' },
  { id: 'batismo', label: '💧 Batismo/Aclamação', desc: 'Eventos e inscrições de batismo' },
  { id: 'aniversarios', label: '🎂 Aniversários', desc: 'Dados de nascimento distribuídos' },
];

const PERIOD_OPTIONS = [
  { value: '1m', label: '1 mês' },
  { value: '2m', label: '2 meses' },
  { value: '3m', label: '3 meses' },
  { value: 'bimestre', label: 'Bimestre' },
  { value: 'trimestre', label: 'Trimestre' },
];

const TIPO_CELULA_OPTIONS = ['mista', 'casais', 'jovens', 'adolescentes', 'kids'];

// ─── Main Panel ───
export function SeedRunSimulationPanel() {
  const { data: seedRuns, isLoading: loadingRuns, refetch } = useSeedRuns();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRun, setSelectedRun] = useState<SeedRun | null>(null);
  const [cleanupTarget, setCleanupTarget] = useState<SeedRun | null>(null);
  const { data: campos } = useCampos();
  const { toast } = useToast();

  // Concurrency guard: check if any job is currently running
  const runningJob = useMemo(() => (seedRuns || []).find(r => r.status === 'running' || (r.status as string) === 'queued'), [seedRuns]);

  const handleNewSimulation = () => {
    if (runningJob) {
      toast({
        title: 'Execução em andamento',
        description: `O job "${runningJob.name}" ainda está rodando. Aguarde a conclusão antes de iniciar uma nova simulação.`,
        variant: 'destructive',
      });
      return;
    }
    setShowCreate(true);
  };

  // Map campo IDs to names
  const campoMap = useMemo(() => {
    const map: Record<string, string> = {};
    (campos || []).forEach(c => { map[c.id] = c.nome; });
    return map;
  }, [campos]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Seed Run / Simulações
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Motor de simulação configurável — crie cenários de teste sem afetar dados reais.
          </p>
        </div>
        <Button onClick={handleNewSimulation} className="gap-2" disabled={!!runningJob}>
          <FlaskConical className="h-4 w-4" />
          Nova Simulação
        </Button>
      </div>

      {/* Running job alert */}
      {runningJob && (
        <Alert className="border-warning/40 bg-warning/5">
          <Loader2 className="h-4 w-4 text-warning animate-spin" />
          <AlertDescription className="text-sm">
            <strong>Execução ativa:</strong> "{runningJob.name}" está em andamento. Novas simulações estão bloqueadas até a conclusão.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Isolamento garantido:</strong> Todo dado sintético carrega <code className="bg-muted px-1 rounded text-xs">is_test_data=true</code> + <code className="bg-muted px-1 rounded text-xs">seed_run_id</code> + <code className="bg-muted px-1 rounded text-xs">campo_id</code> explícito.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left: History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Histórico de Simulações</h3>
            <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Atualizar
            </Button>
          </div>

          {loadingRuns ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : (seedRuns || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma simulação ainda</p>
                <p className="text-xs mt-1">Clique em "Nova Simulação" para começar</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 pr-2">
                {(seedRuns || []).map(run => (
                  <SeedRunHistoryCard
                    key={run.id}
                    run={run}
                    campoMap={campoMap}
                    isSelected={selectedRun?.id === run.id}
                    onSelect={() => setSelectedRun(run)}
                    onCleanup={() => setCleanupTarget(run)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right: Details */}
        <div>
          {selectedRun ? (
            <SeedRunDetailsWrapped run={selectedRun} campoMap={campoMap} onCleanup={() => setCleanupTarget(selectedRun)} />
          ) : (
            <Card className="border-dashed h-full flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground py-16">
                <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selecione uma simulação</p>
                <p className="text-xs mt-1">Ou crie uma nova para começar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateSimulationDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={(run) => { setSelectedRun(run); refetch(); }}
        />
      )}

      {cleanupTarget && (
        <CleanupDialog
          open={!!cleanupTarget}
          onOpenChange={() => setCleanupTarget(null)}
          seedRun={cleanupTarget}
          onConfirm={async () => {
            const targetId = cleanupTarget.id;
            setCleanupTarget(null);
            try {
              await supabase.functions.invoke('seed-data', {
                body: { action: 'cleanup', seed_run_id: targetId },
              });
              refetch();
            } catch (e) {
              console.error('cleanup error', e);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── History Card ───
function SeedRunHistoryCard({ run, campoMap, isSelected, onSelect, onCleanup }: {
  run: SeedRun; campoMap: Record<string, string>; isSelected: boolean; onSelect: () => void; onCleanup: () => void;
}) {
  const totals = run.totals || {};
  const config = (run as any).config as SeedConfig | null;
  const isCleaned = !!run.cleaned_at;

  const campusLabel = useMemo(() => {
    if (!config?.campos || config.campos.length === 0) return 'Sem campus';
    if (config.campos[0] === 'ALL') return '🌐 Todos os campus';
    return config.campos.map(id => campoMap[id] || id.slice(0, 8)).join(', ');
  }, [config?.campos, campoMap]);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''} ${isCleaned ? 'opacity-60' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-mono">{run.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isCleaned ? (
              <Badge variant="outline" className="text-muted-foreground text-[10px]">Limpo</Badge>
            ) : run.status === 'running' ? (
              <Badge variant="outline" className="border-warning text-warning animate-pulse text-[10px]">Rodando</Badge>
            ) : run.status === 'done' ? (
              <Badge variant="outline" className="border-primary text-primary text-[10px]">Concluído</Badge>
            ) : run.status === 'failed' ? (
              <Badge variant="destructive" className="text-[10px]">Falhou</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">{run.status}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {/* Campus label */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{campusLabel}</span>
        </div>
        {config?.modules && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {config.modules.slice(0, 4).map(m => (
              <Badge key={m} variant="outline" className="text-[10px] px-1.5 py-0">{m}</Badge>
            ))}
            {config.modules.length > 4 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{config.modules.length - 4}</Badge>}
          </div>
        )}
        {Object.keys(totals).length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            {totals.members && <span>👥 {String(totals.members)}</span>}
            {totals.reports && <span>📋 {String(totals.reports)}</span>}
            {totals.supervisoes && <span>🔍 {String(totals.supervisoes)}</span>}
            {totals.novas_vidas && <span>🕊️ {String(totals.novas_vidas)}</span>}
          </div>
        )}
        {isSelected && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-primary font-medium">
            <ChevronRight className="h-3 w-3" /> Selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Per-Campus Summary ───
function PerCampusSummary({ totals, campoMap }: { totals: Record<string, any>; campoMap: Record<string, string> }) {
  const perCampus = totals?.per_campus as Record<string, any> | undefined;
  if (!perCampus || Object.keys(perCampus).length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <MapPin className="h-3 w-3" /> Resumo por Campus
      </h4>
      <div className="grid gap-2">
        {Object.entries(perCampus).map(([campoId, data]) => {
          const nome = (data as any).nome || campoMap[campoId] || campoId.slice(0, 8);
          const entries = Object.entries(data as Record<string, any>).filter(([k]) => k !== 'nome');
          return (
            <Card key={campoId} className="bg-muted/30">
              <CardContent className="p-3">
                <p className="text-sm font-medium flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {nome}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {entries.map(([key, val]) => (
                    <span key={key}>{key}: <strong className="text-foreground">{String(val)}</strong></span>
                  ))}
                  {entries.length === 0 && <span className="text-muted-foreground/60">0 registros</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Error Boundary ───
import { Component, type ReactNode, type ErrorInfo } from 'react';

class SeedRunErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('SeedRunDetails crash:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
            <p className="font-medium text-destructive">Erro ao renderizar detalhes</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{this.state.error?.message || 'Erro desconhecido'}</p>
            <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

// ─── Wrapped Details with Error Boundary ───
function SeedRunDetailsWrapped(props: { run: SeedRun; campoMap: Record<string, string>; onCleanup: () => void }) {
  return (
    <SeedRunErrorBoundary>
      <SeedRunDetailsInner {...props} />
    </SeedRunErrorBoundary>
  );
}

// ─── Seed Run Details ───
function SeedRunDetailsInner({ run, campoMap, onCleanup }: { run: SeedRun; campoMap: Record<string, string>; onCleanup: () => void }) {
  const config = (run as any)?.config as SeedConfig | null | undefined;
  const { runAction, isRunning, steps, clearSteps } = useSeedActions(run.id);
  const isCleaned = !!run.cleaned_at;
  const queryClient = useQueryClient();

  // Detect legacy data (missing expected fields)
  const isLegacy = !config || !config.campos || !config.modules;

  const campusLabel = useMemo(() => {
    if (!config?.campos || config.campos.length === 0) return 'Sem campus definido';
    if (config.campos[0] === 'ALL') return '🌐 Todos os campus ativos';
    return config.campos.map(id => campoMap[id] || id.slice(0, 8)).join(', ');
  }, [config?.campos, campoMap]);

  const moduleActions = useMemo(() => {
    const modules = config?.modules || [];
    const actionMap: Record<string, { action: string; label: string }> = {
      hierarchy: { action: 'seed_hierarchy', label: '🏗️ Hierarquia' },
      members: { action: 'seed_members', label: '👥 Membros' },
      reports: { action: 'seed_reports', label: '📋 Relatórios' },
      supervisoes: { action: 'seed_supervisoes', label: '🔍 Supervisões' },
      multiplicacoes: { action: 'seed_multiplicacoes', label: '🌱 Multiplicações' },
      novas_vidas: { action: 'seed_novas_vidas', label: '🕊️ Novas Vidas' },
      encaminhamentos: { action: 'seed_encaminhamentos', label: '📍 Encaminhamentos' },
      discipulado: { action: 'seed_discipulado', label: '📖 Discipulado' },
      roteiro: { action: 'seed_roteiro', label: '📝 Roteiro' },
      batismo: { action: 'seed_batismo', label: '💧 Batismo' },
      aniversarios: { action: 'seed_aniversarios', label: '🎂 Aniversários' },
    };
    return modules.map(m => actionMap[m]).filter(Boolean);
  }, [config?.modules]);

  const runAll = async () => {
    clearSteps();
    for (const item of moduleActions) {
      try {
        await runAction(item.action, item.label);
      } catch {
        break;
      }
    }
    await supabase.from('seed_runs').update({ status: 'done' }).eq('id', run.id);
    queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
  };

  if (isCleaned) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Simulação limpa</p>
          <p className="text-xs mt-1">
            Limpo em {run.cleaned_at ? format(new Date(run.cleaned_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Legacy data warning
  if (isLegacy) {
    return (
      <Card className="border-warning/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Dados Legados Detectados
          </CardTitle>
          <CardDescription>
            Esta execução foi criada por uma versão anterior e não possui configuração completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <p><strong>Nome:</strong> {run.name || '—'}</p>
            <p><strong>Status:</strong> {run.status || '—'}</p>
            <p><strong>Criado em:</strong> {run.created_at ? format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}</p>
            {run.notes && <p><strong>Notas:</strong> {run.notes}</p>}
            {run.status === 'failed' && (
              <Alert className="border-destructive/30 bg-destructive/5 mt-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-xs">{run.notes || 'Falha registrada (sem detalhes)'}</AlertDescription>
              </Alert>
            )}
          </div>
          {Object.keys(run.totals || {}).length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Totais (modo leitura):</p>
              <pre className="bg-muted p-2 rounded text-[10px] overflow-auto max-h-32">
                {JSON.stringify(run.totals, null, 2)}
              </pre>
            </div>
          )}
          <Separator />
          <Button variant="destructive" size="sm" onClick={onCleanup} className="gap-2">
            <Trash2 className="h-4 w-4" /> Limpar Dados de Teste
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            {run.name}
          </CardTitle>
          <CardDescription>
            Criado em {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            {run.notes && <span> · {run.notes}</span>}
          </CardDescription>
        </CardHeader>

        {/* Status alerts */}
        {run.status === 'failed' && (
          <CardContent className="pt-0 pb-3">
            <Alert className="border-destructive/30 bg-destructive/5">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm text-destructive">
                <strong>Falhou:</strong> {run.notes || 'Erro não registrado'}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {config && (
          <CardContent className="space-y-3">
            {/* Campus scope */}
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Campus</p>
              <p className="font-medium text-sm">{campusLabel}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="font-medium">{PERIOD_OPTIONS.find(p => p.value === config.period)?.label || config.period || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Módulos</p>
                <p className="font-medium">{config.modules?.length || 0} selecionados</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Membros/Célula</p>
                <p className="font-medium">{config.advanced?.membrosPerCelula ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume Novas Vidas</p>
                <p className="font-medium">{config.advanced?.volumeNovasVidas ?? '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(config.modules || []).map(m => {
                const mod = ALL_MODULES.find(am => am.id === m);
                return <Badge key={m} variant="outline" className="text-xs">{mod?.label?.split(' ')[0] || m}</Badge>;
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Per-Campus Summary */}
      <PerCampusSummary totals={run.totals} campoMap={campoMap} />

      {/* Run All */}
      <Button className="w-full gap-2" size="lg" onClick={runAll} disabled={isRunning || run.status === 'done'}>
        {isRunning
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Executando...</>
          : run.status === 'done'
            ? <><CheckCircle2 className="h-4 w-4" /> Concluído</>
            : <><Play className="h-4 w-4" /> Executar Simulação Completa</>
        }
      </Button>

      {/* Individual actions */}
      {moduleActions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações Individuais</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {moduleActions.map(item => {
              const step = steps.find(s => s.step === item.action);
              return (
                <Card key={item.action} className={`transition-colors ${step?.status === 'done' ? 'border-primary/40 bg-primary/5' : step?.status === 'failed' ? 'border-destructive/40 bg-destructive/5' : ''}`}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      {step?.status === 'done' && <p className="text-xs text-primary">✓ {step.created} criados</p>}
                      {step?.status === 'failed' && <p className="text-xs text-destructive truncate">✗ {step.error}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant={step?.status === 'done' ? 'outline' : 'default'}
                      onClick={() => runAction(item.action, item.label)}
                      disabled={isRunning}
                      className="shrink-0"
                    >
                      {step?.status === 'running' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution log */}
      {steps.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" /> Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {steps.map(step => (
                <div key={step.step} className="flex items-center gap-2 text-xs">
                  {step.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> :
                    step.status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" /> :
                      step.status === 'running' ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" /> :
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted shrink-0" />}
                  <span className="flex-1 font-mono">{step.label}</span>
                  {step.status === 'done' && <span className="text-primary">{step.created}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Button variant="destructive" size="sm" onClick={onCleanup} className="gap-2" disabled={isRunning}>
        <Trash2 className="h-4 w-4" /> Limpar Dados de Teste
      </Button>
    </div>
  );
}

// ─── Create Simulation Dialog ───
function CreateSimulationDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: (run: SeedRun) => void;
}) {
  const { data: campos } = useCampos();
  const { data: redes } = useRedes();
  const createRun = useCreateSeedRun();
  const queryClient = useQueryClient();

  const [name, setName] = useState(`SIM_${format(new Date(), 'yyyy_MM_dd_HHmm')}`);
  const [notes, setNotes] = useState('');
  const [config, setConfig] = useState<SeedConfig>(DEFAULT_CONFIG);
  const [isAllCampos, setIsAllCampos] = useState(false);

  const filteredRedes = useMemo(() => {
    if (!redes) return [];
    if (isAllCampos || config.campos.length === 0) return redes;
    return redes.filter(r => r.campo_id && config.campos.includes(r.campo_id));
  }, [redes, config.campos, isAllCampos]);

  const toggleModule = (id: string) => {
    setConfig(prev => ({
      ...prev,
      modules: prev.modules.includes(id)
        ? prev.modules.filter(m => m !== id)
        : [...prev.modules, id],
    }));
  };

  const toggleAllCampos = () => {
    if (isAllCampos) {
      setIsAllCampos(false);
      setConfig(prev => ({ ...prev, campos: [] }));
    } else {
      setIsAllCampos(true);
      setConfig(prev => ({ ...prev, campos: ['ALL'] }));
    }
  };

  const toggleCampo = (id: string) => {
    setIsAllCampos(false);
    setConfig(prev => {
      const newCampos = prev.campos.filter(c => c !== 'ALL');
      const updated = newCampos.includes(id) ? newCampos.filter(c => c !== id) : [...newCampos, id];
      return {
        ...prev,
        campos: updated,
        redes: prev.redes.filter(rId => {
          const rede = redes?.find(r => r.id === rId);
          return rede?.campo_id && updated.includes(rede.campo_id);
        }),
      };
    });
  };

  const toggleRede = (id: string) => {
    setConfig(prev => ({
      ...prev,
      redes: prev.redes.includes(id)
        ? prev.redes.filter(r => r !== id)
        : [...prev.redes, id],
    }));
  };

  const toggleTipoCelula = (tipo: string) => {
    setConfig(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        tipoCelula: prev.advanced.tipoCelula.includes(tipo)
          ? prev.advanced.tipoCelula.filter(t => t !== tipo)
          : [...prev.advanced.tipoCelula, tipo],
      },
    }));
  };

  const campusCount = isAllCampos ? (campos?.length || 0) : config.campos.filter(c => c !== 'ALL').length;
  const hasCampos = campusCount > 0;
  const campusLabel = isAllCampos
    ? `Todos os campus (${campos?.length || 0})`
    : config.campos.filter(c => c !== 'ALL').map(id => campos?.find(c => c.id === id)?.nome || id.slice(0, 8)).join(', ');

  const handleCreate = async () => {
    if (!hasCampos) return;
    try {
      const run = await createRun.mutateAsync({ name, environment: 'dev', notes });
      await supabase.from('seed_runs').update({ config, status: 'queued' } as any).eq('id', run.id);
      queryClient.invalidateQueries({ queryKey: ['seed_runs'] });
      onCreated({ ...run, config } as any);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Nova Simulação Configurável
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros da simulação. Todos os dados gerados serão isolados e rastreáveis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nome da Simulação</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="font-mono text-sm" />
          </div>

          {/* Campos (OBRIGATÓRIO) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Campus <span className="text-destructive">*</span>
            </Label>
            {!hasCampos && (
              <Alert className="border-destructive/40 bg-destructive/5 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <AlertDescription className="text-xs text-destructive">
                  Selecione ao menos um campus. Sem campus selecionado, a simulação não será criada.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={isAllCampos ? 'default' : 'outline'}
                onClick={toggleAllCampos}
                className="gap-1"
              >
                <Globe className="h-3.5 w-3.5" />
                Todos
              </Button>
              {(campos || []).map(campo => (
                <Button
                  key={campo.id}
                  size="sm"
                  variant={!isAllCampos && config.campos.includes(campo.id) ? 'default' : 'outline'}
                  onClick={() => toggleCampo(campo.id)}
                  disabled={isAllCampos}
                >
                  {campo.nome}
                </Button>
              ))}
              {(!campos || campos.length === 0) && (
                <p className="text-xs text-muted-foreground">Nenhum campo cadastrado</p>
              )}
            </div>
          </div>

          {/* Redes */}
          {filteredRedes.length > 0 && (
            <div className="space-y-2">
              <Label>Redes (opcional — vazio = todas do campus)</Label>
              <div className="flex flex-wrap gap-2">
                {filteredRedes.map(rede => (
                  <Button
                    key={rede.id}
                    size="sm"
                    variant={config.redes.includes(rede.id) ? 'default' : 'outline'}
                    onClick={() => toggleRede(rede.id)}
                  >
                    {rede.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Period */}
          <div className="space-y-2">
            <Label>Período da Simulação</Label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map(p => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={config.period === p.value ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, period: p.value }))}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-2">
            <Label>Módulos da Simulação</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_MODULES.map(mod => (
                <Card
                  key={mod.id}
                  className={`cursor-pointer transition-colors p-3 ${config.modules.includes(mod.id) ? 'border-primary/50 bg-primary/5' : ''}`}
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox checked={config.modules.includes(mod.id)} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{mod.label}</p>
                      <p className="text-xs text-muted-foreground">{mod.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Advanced Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Parâmetros Avançados
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Volume de Novas Vidas: {config.advanced.volumeNovasVidas}</Label>
                <Slider
                  value={[config.advanced.volumeNovasVidas]}
                  min={10} max={300} step={10}
                  onValueChange={([v]) => setConfig(prev => ({ ...prev, advanced: { ...prev.advanced, volumeNovasVidas: v } }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Taxa de Conversão: {config.advanced.taxaConversao}%</Label>
                <Slider
                  value={[config.advanced.taxaConversao]}
                  min={10} max={100} step={5}
                  onValueChange={([v]) => setConfig(prev => ({ ...prev, advanced: { ...prev.advanced, taxaConversao: v } }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Membros por Célula: {config.advanced.membrosPerCelula}</Label>
                <Slider
                  value={[config.advanced.membrosPerCelula]}
                  min={3} max={20} step={1}
                  onValueChange={([v]) => setConfig(prev => ({ ...prev, advanced: { ...prev.advanced, membrosPerCelula: v } }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tipos de Célula</Label>
              <div className="flex flex-wrap gap-2">
                {TIPO_CELULA_OPTIONS.map(tipo => (
                  <Button
                    key={tipo}
                    size="sm"
                    variant={config.advanced.tipoCelula.includes(tipo) ? 'default' : 'outline'}
                    onClick={() => toggleTipoCelula(tipo)}
                  >
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Distribuição por Faixa Etária (%)</Label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(config.advanced.distribuicaoIdade).map(([faixa, pct]) => (
                  <div key={faixa} className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">{faixa}</Label>
                    <Input
                      type="number" min={0} max={100} value={pct}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, distribuicaoIdade: { ...prev.advanced.distribuicaoIdade, [faixa]: parseInt(e.target.value) || 0 } },
                      }))}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Objetivo desta simulação..." />
          </div>

          {/* Pre-execution summary */}
          {hasCampos && config.modules.length > 0 && (
            <Alert className="border-primary/30 bg-primary/5">
              <FlaskConical className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Resumo:</strong> Seed Run será executado em <strong>{campusLabel}</strong> | <strong>{PERIOD_OPTIONS.find(p => p.value === config.period)?.label}</strong> | <strong>{config.modules.length} módulos</strong> selecionados.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={createRun.isPending || config.modules.length === 0 || !hasCampos}>
            {createRun.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-2" />}
            Criar Simulação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cleanup Dialog ───
function CleanupDialog({ open, onOpenChange, seedRun, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; seedRun: SeedRun; onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const REQUIRED = 'APAGAR_DADOS_TESTE';

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); setConfirmText(''); }}>
      <DialogContent className="sm:max-w-md border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Limpar Dados de Teste
          </DialogTitle>
          <DialogDescription>
            Serão apagados <strong>apenas</strong> registros com <code>seed_run_id={seedRun.id.slice(0, 8)}...</code>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Alert className="border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm text-destructive">
              Esta ação é irreversível. Dados reais <strong>não serão afetados</strong>.
            </AlertDescription>
          </Alert>
          <div className="space-y-1.5">
            <Label>
              Digite <code className="text-destructive font-mono text-sm bg-destructive/10 px-1 rounded">APAGAR_DADOS_TESTE</code>
            </Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="APAGAR_DADOS_TESTE"
              className="font-mono border-destructive/30"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={confirmText !== REQUIRED} onClick={() => { onConfirm(); setConfirmText(''); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Apagar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
