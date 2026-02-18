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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FlaskConical, Play, Trash2, Download, FileText, Users, Calendar,
  GitBranch, Shield, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Database, Terminal, ChevronRight, Info, FileDown
} from 'lucide-react';
import {
  useSeedRuns, useCreateSeedRun, useSeedActions,
  getPeriodDates, buildCSVExportUrl, SeedPeriodPreset, SeedRun
} from '@/hooks/useSeedRuns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ─── Status Badge ───
function StatusBadge({ status, cleanedAt }: { status: string; cleanedAt?: string | null }) {
  if (cleanedAt) return <Badge variant="outline" className="text-muted-foreground">Limpo</Badge>;
  if (status === 'running') return <Badge variant="outline" className="border-warning text-warning">Em execução</Badge>;
  if (status === 'done') return <Badge variant="outline" className="border-primary text-primary">Concluído</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Falhou</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

// ─── Env Badge ───
function EnvBadge({ env }: { env: string }) {
  if (env === 'prod') return <Badge variant="destructive" className="opacity-80">PRODUÇÃO</Badge>;
  return <Badge variant="secondary">Dev</Badge>;
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

// ─── Seed Run Detail Card ───
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
                <strong>Você está em PRODUÇÃO.</strong> Nada será criado sem a confirmação abaixo.
                Os dados serão marcados como <code>is_test_data=true</code> e podem ser limpos integralmente.
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
                autoFocus
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
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label>Digite <code className="text-destructive font-mono text-sm bg-destructive/10 px-1 rounded">APAGAR_DADOS_TESTE</code> para confirmar</Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="APAGAR_DADOS_TESTE"
              className="font-mono border-destructive/30"
              autoFocus
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

// ─── Action Panel (for selected seed run) ───
function SeedActionPanel({ seedRun, onCleanup }: { seedRun: SeedRun; onCleanup: () => void }) {
  const { runAction, isRunning, lastResult } = useSeedActions(seedRun.id);
  const [preset, setPreset] = useState<SeedPeriodPreset>('3m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const isCleaned = !!seedRun.cleaned_at;

  const period = getPeriodDates(preset, customFrom, customTo);

  const run = async (action: string, label: string, extra?: Record<string, string>) => {
    const line = `[${format(new Date(), 'HH:mm:ss')}] Iniciando: ${label}...`;
    setActionLog(prev => [...prev, line]);
    try {
      const result = await runAction(action, extra);
      setActionLog(prev => [...prev, `  ✓ ${result?.created ?? 0} registros criados`]);
    } catch {
      setActionLog(prev => [...prev, `  ✗ Falhou`]);
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
          ) : (
            <p className="text-xs text-muted-foreground font-mono">
              {period.from} → {period.to}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ações de Seed</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { action: 'seed_members', label: '👥 Gerar Membros + Marcos', desc: '7 membros fictícios por célula com marcos espirituais' },
            { action: 'seed_reports', label: '📋 Gerar Relatórios Semanais', desc: '1 relatório por semana por célula no período' },
            { action: 'seed_supervisoes', label: '🔍 Gerar Supervisões', desc: '2 supervisões por supervisor no período' },
            { action: 'seed_multiplicacoes', label: '🌱 Gerar Multiplicações', desc: '~20% das células multiplicam no período' },
          ].map(item => (
            <Card key={item.action} className="border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">{item.label}</CardTitle>
                <CardDescription className="text-xs">{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Button
                  size="sm"
                  onClick={() => run(item.action, item.label,
                    item.action !== 'seed_members' ? { period_from: period.from, period_to: period.to } : undefined
                  )}
                  disabled={isRunning}
                  className="w-full"
                >
                  {isRunning ? <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> : <Play className="h-3 w-3 mr-1.5" />}
                  Executar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" />
              Log de execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="font-mono text-xs space-y-0.5 text-muted-foreground">
                {actionLog.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </ScrollArea>
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
            Dados reais nunca são afetados. A operação registra auditoria de quem limpou e quando.
          </AlertDescription>
        </Alert>
        <Button variant="destructive" size="sm" onClick={onCleanup} className="gap-2">
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
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Novo Seed Run
          </Button>
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
    </AppLayout>
  );
}
