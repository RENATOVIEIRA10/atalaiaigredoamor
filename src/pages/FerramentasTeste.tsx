import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FlaskConical, Play, Trash2, Download, FileText, Users, Calendar,
  GitBranch, Shield, AlertTriangle, CheckCircle2, RefreshCw, Network,
  Database, Terminal, ChevronRight, Info, FileDown, Loader2, XCircle, Eye
} from 'lucide-react';
import {
  useSeedRuns, useCreateSeedRun, useSeedActions,
  getPeriodDates, buildCSVExportUrl, getWeekCount, SeedPeriodPreset, SeedRun, SeedStepResult
} from '@/hooks/useSeedRuns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useCelulas } from '@/hooks/useCelulas';


// ─── Status Badge ───
function StatusBadge({ status, cleanedAt }: { status: string; cleanedAt?: string | null }) {
  if (cleanedAt) return <Badge variant="outline" className="text-muted-foreground">Limpo</Badge>;
  if (status === 'running') return <Badge variant="outline" className="border-warning text-warning animate-pulse">Em execução</Badge>;
  if (status === 'done') return <Badge variant="outline" className="border-primary text-primary">Concluído</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Falhou</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

// ─── Env Badge ───
function EnvBadge({ env }: { env: string }) {
  if (env === 'prod') return <Badge variant="destructive" className="opacity-80">PRODUÇÃO</Badge>;
  return <Badge variant="secondary">Dev</Badge>;
}

// ─── Step Status Icon ───
function StepIcon({ status }: { status: SeedStepResult['status'] }) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />;
  return <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />;
}

// ─── CSV Export buttons ───
const CSV_EXPORTS = [
  { type: 'membros', label: 'Membros', icon: Users },
  { type: 'relatorios', label: 'Relatórios Semanais', icon: FileText },
  { type: 'celulas', label: 'Células', icon: Database },
  { type: 'coordenacoes', label: 'Coordenações', icon: GitBranch },
  { type: 'supervisoes', label: 'Supervisões', icon: Shield },
  { type: 'multiplicacoes', label: 'Multiplicações', icon: GitBranch },
  { type: 'pendencias', label: 'Pendências / Risco', icon: AlertTriangle },
  { type: 'aniversariantes', label: 'Aniversariantes', icon: Calendar },
];

function downloadCSV(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

// ─── Seed Run Card ───
function SeedRunCard({ run, onSelect, isSelected }: { run: SeedRun; onSelect: () => void; isSelected: boolean }) {
  const totals = run.totals || {};
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-mono">{run.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <EnvBadge env={run.environment} />
            <StatusBadge status={run.status} cleanedAt={run.cleaned_at} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {Object.keys(totals).length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {totals.members && <span>👥 {totals.members} membros</span>}
            {totals.reports && <span>📋 {totals.reports} relatórios</span>}
            {totals.supervisoes && <span>🔍 {totals.supervisoes} supervisões</span>}
            {totals.multiplicacoes && <span>🌱 {totals.multiplicacoes} multiplicações</span>}
            {totals.novas_vidas && <span>🕊️ {totals.novas_vidas} novas vidas</span>}
            {totals.encaminhamentos && <span>📍 {totals.encaminhamentos} encaminhamentos</span>}
          </div>
        )}
        {isSelected && (
          <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
            <ChevronRight className="h-3 w-3" />
            Selecionado para ações
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Create Seed Run Dialog ───
function CreateSeedRunDialog({
  open, onOpenChange, onCreated
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (run: SeedRun) => void;
}) {
  const [name, setName] = useState(`SEED_${format(new Date(), 'yyyy_MM_dd')}`);
  const [env, setEnv] = useState<'dev' | 'prod'>('dev');
  const [notes, setNotes] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const createRun = useCreateSeedRun();
  const isProd = env === 'prod';
  const confirmRequired = isProd ? 'GERAR_DADOS_TESTE' : '';
  const canSubmit = !isProd || confirmText === confirmRequired;

  const handle = async () => {
    const run = await createRun.mutateAsync({ name, environment: env, notes });
    onCreated(run);
    onOpenChange(false);
    setConfirmText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Novo Seed Run
          </DialogTitle>
          <DialogDescription>
            Cria um envelope isolado para dados de teste. Cada ação ficará vinculada a este seed_run_id.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do Seed Run</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Ex: CANARY_2026_Q1</p>
          </div>

          <div className="space-y-1.5">
            <Label>Ambiente</Label>
            <Select value={env} onValueChange={v => setEnv(v as 'dev' | 'prod')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Desenvolvimento</SelectItem>
                <SelectItem value="prod">⚠️ Produção (Canary)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isProd && (
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                <strong>Você está em PRODUÇÃO.</strong> Os dados serão marcados como <code>is_test_data=true</code> e podem ser limpos integralmente.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Objetivo deste seed run..." />
          </div>

          {isProd && (
            <div className="space-y-1.5">
              <Label>Digite <code className="text-destructive font-mono text-sm bg-destructive/10 px-1 rounded">GERAR_DADOS_TESTE</code> para confirmar</Label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="GERAR_DADOS_TESTE"
                className="font-mono border-destructive/30"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handle} disabled={!canSubmit || createRun.isPending}>
            {createRun.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-2" />}
            Criar Seed Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cleanup Dialog ───
function CleanupDialog({
  open, onOpenChange, seedRun, onConfirm
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seedRun: SeedRun | null;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const REQUIRED = 'APAGAR_DADOS_TESTE';

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); setConfirmText(''); }}>
      <DialogContent className="sm:max-w-md border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Limpar Dados de Teste
          </DialogTitle>
          <DialogDescription>
            Serão apagados <strong>apenas</strong> registros com <code>is_test_data=true</code> e <code>seed_run_id={seedRun?.id?.slice(0, 8)}...</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="border-destructive/40 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm text-destructive">
              Esta ação é irreversível. Os dados de teste serão removidos permanentemente.
              <br />Dados reais <strong>não serão afetados</strong>.
            </AlertDescription>
          </Alert>

          <div className="text-sm space-y-1">
            <p className="font-medium">O que será apagado:</p>
            <ul className="text-muted-foreground text-sm space-y-0.5 pl-4">
              <li>• Membros gerados pelo seed</li>
              <li>• Relatórios semanais de teste</li>
              <li>• Supervisões de teste</li>
              <li>• Multiplicações e células destino de teste</li>
              <li>• Perfis de membros sintéticos</li>
              <li>• Novas Vidas e Encaminhamentos (Recomeço)</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label>Digite <code className="text-destructive font-mono text-sm bg-destructive/10 px-1 rounded">APAGAR_DADOS_TESTE</code> para confirmar</Label>
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
          <Button
            variant="destructive"
            disabled={confirmText !== REQUIRED}
            onClick={() => { onConfirm(); setConfirmText(''); }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Apagar Dados de Teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Demo Dashboard Dialog ───
function DemoDashboardDialog({
  open, onOpenChange, seedRuns
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seedRuns: SeedRun[];
}) {
  const navigate = useNavigate();
  const [selectedSeedRunId, setSelectedSeedRunId] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const validRuns = seedRuns.filter(r => r.status === 'done' && !r.cleaned_at);

  const handleOpen = () => {
    if (!selectedSeedRunId || !selectedRole) return;
    // Store demo mode in sessionStorage so dashboards can pick it up
    sessionStorage.setItem('demo_seed_run_id', selectedSeedRunId);
    sessionStorage.setItem('demo_role', selectedRole);
    onOpenChange(false);
    navigate('/dashboard?demo=true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Dashboard de Demonstração
          </DialogTitle>
          <DialogDescription>
            Visualize os dashboards reais com dados sintéticos do seed run selecionado. Nenhum dado real será exibido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {validRuns.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Nenhum seed run concluído disponível. Execute um seed run antes de abrir o dashboard de demonstração.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Seed Run</Label>
                <Select value={selectedSeedRunId} onValueChange={setSelectedSeedRunId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um seed run..." />
                  </SelectTrigger>
                  <SelectContent>
                    {validRuns.map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-mono text-xs">
                        {r.name} — {format(new Date(r.created_at), 'dd/MM/yy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Papel de visualização</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um papel..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pastor">Pastor Sênior — Painel completo</SelectItem>
                    <SelectItem value="rede_leader">Líder de Rede — Dashboard da rede</SelectItem>
                    <SelectItem value="coordenador">Coordenador — Dashboard da coordenação</SelectItem>
                    <SelectItem value="supervisor">Supervisor — Dashboard do supervisor</SelectItem>
                    <SelectItem value="celula_leader">Líder de Célula — Dashboard da célula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  O dashboard abrirá em modo demonstração. Um banner laranja indicará que os dados exibidos são sintéticos.
                  Acesse <strong>Ferramentas de Teste</strong> para voltar ao modo normal.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleOpen}
            disabled={!selectedSeedRunId || !selectedRole || validRuns.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Abrir Dashboard de Demonstração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Action Panel (for selected seed run) ───
function SeedActionPanel({ seedRun, onCleanup }: { seedRun: SeedRun; onCleanup: () => void }) {
  const { runAction, isRunning, steps, clearSteps } = useSeedActions(seedRun.id);
  const [preset, setPreset] = useState<SeedPeriodPreset>('3m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [cd1Mode, setCd1Mode] = useState(false);
  const isCleaned = !!seedRun.cleaned_at;
  const { data: celulas } = useCelulas();
  const celulaCount = (celulas || []).filter(c => !c.is_test_data).length;

  const period = getPeriodDates(preset, customFrom, customTo);
  const weekCount = getWeekCount(period.from, period.to);
  const totalCellEstimate = cd1Mode ? celulaCount + (3 * 4 * 12) : celulaCount; // 3 redes × 4 coords × 12 cells
  const estimatedMembers = totalCellEstimate * 7;
  const estimatedReports = totalCellEstimate * weekCount;

  const CD1_ACTIONS = [
    { action: 'seed_hierarchy', label: '🏗️ Criar Hierarquia Multi-Rede', desc: 'Cria 3 redes (Impulse, Acelere, UP) + coords + supervisores + células', needsPeriod: false },
    { action: 'seed_members', label: '👥 Gerar Membros + Marcos', desc: `7 membros por célula (≈${estimatedMembers})`, needsPeriod: false },
    { action: 'seed_reports', label: '📋 Gerar Relatórios Semanais', desc: `1 por semana por célula (≈${estimatedReports})`, needsPeriod: true },
    { action: 'seed_supervisoes', label: '🔍 Gerar Supervisões', desc: '2-3 por supervisor no período', needsPeriod: true },
    { action: 'seed_multiplicacoes', label: '🌱 Gerar Multiplicações', desc: '~15% das células multiplicam', needsPeriod: true },
    { action: 'seed_novas_vidas', label: '🕊️ Gerar Novas Vidas (Recomeço)', desc: '60-120 visitantes cross-rede', needsPeriod: false },
    { action: 'seed_encaminhamentos', label: '📍 Gerar Encaminhamentos', desc: 'Encaminha novas vidas para células cross-rede', needsPeriod: false },
  ];

  const SEED_ACTIONS = cd1Mode ? CD1_ACTIONS : [
    { action: 'seed_members', label: '👥 Gerar Membros + Marcos', desc: `7 membros por célula com endereço real (≈${estimatedMembers})`, needsPeriod: false },
    { action: 'seed_reports', label: '📋 Gerar Relatórios Semanais', desc: `1 por semana por célula (≈${estimatedReports})`, needsPeriod: true },
    { action: 'seed_supervisoes', label: '🔍 Gerar Supervisões', desc: 'Mínimo 2-3 por supervisor no período', needsPeriod: true },
    { action: 'seed_multiplicacoes', label: '🌱 Gerar Multiplicações', desc: '~15% das células multiplicam', needsPeriod: true },
    { action: 'seed_novas_vidas', label: '🕊️ Gerar Novas Vidas (Recomeço)', desc: '60-120 visitantes com endereço Olinda/Paulista', needsPeriod: false },
    { action: 'seed_encaminhamentos', label: '📍 Gerar Encaminhamentos', desc: 'Encaminha novas vidas para células cross-rede', needsPeriod: false },
  ];

  const run = async (action: string, label: string, needsPeriod: boolean) => {
    const extra: Record<string, string> = {};
    if (needsPeriod) { extra.period_from = period.from; extra.period_to = period.to; }
    if (cd1Mode) extra.include_test_cells = 'true';
    await runAction(action, label, extra);
  };

  const runAll = async () => {
    clearSteps();
    for (const item of SEED_ACTIONS) {
      try {
        await run(item.action, item.label, item.needsPeriod);
      } catch {
        break;
      }
    }
  };

  if (isCleaned) {
    return (
      <Alert className="border-muted">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        <AlertDescription>
          Este seed run foi limpo em {format(new Date(seedRun.cleaned_at!), "dd/MM/yyyy HH:mm", { locale: ptBR })}.
          Nenhuma ação disponível.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* CD1 Mode Toggle */}
      <Card className={`border-dashed ${cd1Mode ? 'border-primary/50 bg-primary/5' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Modo CD1 Multi-Redes
            </CardTitle>
            <Button
              size="sm"
              variant={cd1Mode ? 'default' : 'outline'}
              onClick={() => setCd1Mode(!cd1Mode)}
              disabled={isRunning}
            >
              {cd1Mode ? '✓ CD1 Ativo' : 'Ativar CD1'}
            </Button>
          </div>
          {cd1Mode && (
            <CardDescription className="text-xs">
              Criará 3 redes novas (Impulse, Acelere, UP) + hierarquia completa + dados para TODAS as células (reais + teste).
              Estimativa: ~{3 * 4 * 12} células novas + {estimatedMembers} membros + {estimatedReports} relatórios.
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Period selector */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Período de Geração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['1m', '3m', '6m', '12m', 'custom'] as SeedPeriodPreset[]).map(p => (
              <Button
                key={p}
                size="sm"
                variant={preset === p ? 'default' : 'outline'}
                onClick={() => setPreset(p)}
                disabled={isRunning}
              >
                {p === 'custom' ? 'Personalizado' : p === '1m' ? '1 mês' : p === '3m' ? '3 meses' : p === '6m' ? '6 meses' : '12 meses'}
              </Button>
            ))}
          </div>
          {preset === 'custom' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">De (YYYY-MM-DD)</Label>
                <Input value={customFrom} onChange={e => setCustomFrom(e.target.value)} placeholder="2025-01-01" className="font-mono text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Até (YYYY-MM-DD)</Label>
                <Input value={customTo} onChange={e => setCustomTo(e.target.value)} placeholder="2025-12-31" className="font-mono text-sm" />
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-mono bg-muted/30 rounded-md p-2">
            <span>📅 {period.from} → {period.to}</span>
            <span>📆 {weekCount} semanas</span>
            <span>👥 ≈{estimatedMembers} membros</span>
            <span>📋 ≈{estimatedReports} relatórios</span>
          </div>
        </CardContent>
      </Card>

      {/* Run All button */}
      <Button
        className="w-full gap-2"
        size="lg"
        onClick={runAll}
        disabled={isRunning}
      >
        {isRunning
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Executando...</>
          : <><Play className="h-4 w-4" /> Executar Tudo em Sequência</>
        }
      </Button>

      {/* Individual actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ações Individuais</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEED_ACTIONS.map(item => {
            const step = steps.find(s => s.step === item.action);
            return (
              <Card key={item.action} className={`border transition-colors ${step?.status === 'done' ? 'border-primary/40 bg-primary/5' : step?.status === 'failed' ? 'border-destructive/40 bg-destructive/5' : ''}`}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{item.label}</CardTitle>
                    {step && <StepIcon status={step.status} />}
                  </div>
                  <CardDescription className="text-xs">{item.desc}</CardDescription>
                  {step?.status === 'done' && (
                    <p className="text-xs text-primary font-medium">✓ {step.created} criados</p>
                  )}
                  {step?.status === 'failed' && (
                    <p className="text-xs text-destructive font-medium">✗ {step.error}</p>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Button
                    size="sm"
                    variant={step?.status === 'done' ? 'outline' : 'default'}
                    onClick={() => run(item.action, item.label, item.needsPeriod)}
                    disabled={isRunning}
                    className="w-full"
                  >
                    {step?.status === 'running'
                      ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Executando...</>
                      : step?.status === 'done'
                        ? <><RefreshCw className="h-3 w-3 mr-1.5" /> Re-executar</>
                        : <><Play className="h-3 w-3 mr-1.5" /> Executar</>
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Execution log */}
      {steps.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              Progresso de execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.step} className="flex items-center gap-2 text-xs">
                  <StepIcon status={step.status} />
                  <span className={`flex-1 font-mono ${step.status === 'failed' ? 'text-destructive' : step.status === 'done' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  {step.status === 'done' && <span className="text-primary font-medium">{step.created} criados</span>}
                  {step.status === 'failed' && <span className="text-destructive">{step.error}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Cleanup */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-destructive/80 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Zona de Limpeza
        </h3>
        <Alert className="border-destructive/20 bg-destructive/5">
          <Info className="h-4 w-4 text-destructive/70" />
          <AlertDescription className="text-xs text-muted-foreground">
            Remove apenas registros marcados com <code>is_test_data=true</code> deste seed run.
            Dados reais nunca são afetados.
          </AlertDescription>
        </Alert>
        <Button variant="destructive" size="sm" onClick={onCleanup} className="gap-2" disabled={isRunning}>
          <Trash2 className="h-4 w-4" />
          Limpar Dados de Teste
        </Button>
      </div>
    </div>
  );
}

// ─── CSV Export Panel ───
function CSVExportPanel() {
  const [includeTest, setIncludeTest] = useState(false);
  const [selectedSeedRun, setSelectedSeedRun] = useState('');
  const { data: seedRuns } = useSeedRuns();

  const handleDownload = (type: string) => {
    const url = buildCSVExportUrl(type, {
      includeTest,
      seedRunId: includeTest && selectedSeedRun ? selectedSeedRun : undefined,
    });
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    downloadCSV(url, `${type}_${dateStr}.csv`);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Padrão: apenas dados reais</strong> (is_test_data = false).
          Ative "Modo Ensaio" abaixo para incluir ou filtrar dados de teste.
        </AlertDescription>
      </Alert>

      {/* Test data toggle */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Modo Ensaio (Admin Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={includeTest ? 'default' : 'outline'}
              onClick={() => setIncludeTest(!includeTest)}
            >
              {includeTest ? '✓ Incluir dados de teste' : 'Exportar apenas dados reais'}
            </Button>
          </div>
          {includeTest && (
            <div className="space-y-1.5">
              <Label className="text-xs">Filtrar por Seed Run (opcional)</Label>
              <Select value={selectedSeedRun} onValueChange={setSelectedSeedRun}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue placeholder="Todos os seeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os seeds</SelectItem>
                  {(seedRuns || []).map(r => (
                    <SelectItem key={r.id} value={r.id} className="font-mono text-xs">
                      {r.name} — {r.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Exportar CSVs</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {CSV_EXPORTS.map(item => (
            <Card key={item.type} className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDownload(item.type)}>
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                CSV
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function FerramentasTeste() {
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const { data: seedRuns, isLoading, refetch } = useSeedRuns();
  const [createOpen, setCreateOpen] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<SeedRun | null>(null);
  const { runCleanup, isRunning } = useSeedActions(selectedRun?.id || null);

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleCleanup = async () => {
    if (!selectedRun) return;
    setCleanupOpen(false);
    await runCleanup(selectedRun.id);
    refetch();
  };

  return (
    <AppLayout title="Ferramentas de Teste">
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FlaskConical className="h-7 w-7 text-primary" />
              Ferramentas de Teste
            </h1>
            <p className="text-muted-foreground mt-1">
              Seed & Auditoria — Crie, valide e limpe dados sintéticos com rastreabilidade total.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDemoOpen(true)} className="gap-2">
              <Eye className="h-4 w-4" />
              Dashboard de Demonstração
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Novo Seed Run
            </Button>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Isolamento garantido:</strong> Todo dado sintético carrega <code className="bg-muted px-1 rounded text-xs">is_test_data=true</code> +{' '}
            <code className="bg-muted px-1 rounded text-xs">seed_run_id</code>.
            Dashboards e relatórios padrão <strong>nunca exibem</strong> dados de teste.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="seeds" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="seeds" className="gap-1.5">
              <Database className="h-4 w-4" />
              Seed Runs
            </TabsTrigger>
            <TabsTrigger value="exports" className="gap-1.5">
              <Download className="h-4 w-4" />
              Exportações CSV
            </TabsTrigger>
          </TabsList>

          {/* ── Seed Runs Tab ── */}
          <TabsContent value="seeds" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
              {/* Left: list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Histórico de Seeds</h2>
                  <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1.5 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizar
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (seedRuns || []).length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhum seed run ainda</p>
                      <p className="text-sm mt-1">Crie seu primeiro seed run para começar.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollArea className="h-[500px] pr-2">
                    <div className="space-y-2">
                      {(seedRuns || []).map(run => (
                        <SeedRunCard
                          key={run.id}
                          run={run}
                          isSelected={selectedRun?.id === run.id}
                          onSelect={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Right: actions */}
              <div>
                {selectedRun ? (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">{selectedRun.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <EnvBadge env={selectedRun.environment} />
                          <StatusBadge status={selectedRun.status} cleanedAt={selectedRun.cleaned_at} />
                        </div>
                      </div>
                      <CardDescription className="text-xs font-mono text-muted-foreground/70">
                        ID: {selectedRun.id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SeedActionPanel
                        seedRun={selectedRun}
                        onCleanup={() => setCleanupOpen(true)}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed h-full min-h-64 flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground py-12">
                      <ChevronRight className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Selecione um seed run</p>
                      <p className="text-sm mt-1">Clique em um seed run à esquerda para ver as ações disponíveis.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── CSV Exports Tab ── */}
          <TabsContent value="exports">
            <CSVExportPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateSeedRunDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={run => setSelectedRun(run)}
      />

      <CleanupDialog
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        seedRun={selectedRun}
        onConfirm={handleCleanup}
      />

      <DemoDashboardDialog
        open={demoOpen}
        onOpenChange={setDemoOpen}
        seedRuns={seedRuns || []}
      />
    </AppLayout>
  );
}
