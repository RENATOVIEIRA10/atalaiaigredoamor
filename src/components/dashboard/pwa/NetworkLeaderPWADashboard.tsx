import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, FileText, Cake, AlertTriangle, MessageSquare, Network, ChevronRight, GitBranch, ExternalLink } from 'lucide-react';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReportsByRede } from '@/hooks/useWeeklyReports';
import { usePulsoRede } from '@/hooks/usePulsoRede';
import { useAniversariantesSemana, AniversarianteSemana } from '@/hooks/useAniversariantesSemana';
import { useMultiplicacoes } from '@/hooks/useMultiplicacoes';
import { useRole } from '@/contexts/RoleContext';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from '../MissionVerse';
import { PulsoRedeSection } from '../PulsoRedeSection';
import { RadarSaudePanel } from '../RadarSaudePanel';
import { EmptyState } from '@/components/ui/empty-state';
import { getDateString } from '../DateRangeSelector';
import { subDays } from 'date-fns';

export function NetworkLeaderPWADashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';

  const { scopeId, scopeType } = useRole();
  const { data: redes, isLoading: redesLoading } = useRedes();

  const userRedes = redes || [];
  const [selectedRede, setSelectedRede] = useState<string>('');

  // Auto-select if scoped
  if (scopeType === 'rede' && scopeId && !selectedRede && userRedes.length > 0) {
    setSelectedRede(scopeId);
  }

  if (redesLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedRedeData = userRedes.find(r => r.id === selectedRede);

  return (
    <div className="space-y-4">
      {/* Rede selector (only if multiple) */}
      {userRedes.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Select value={selectedRede} onValueChange={setSelectedRede}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Selecione uma rede" />
              </SelectTrigger>
              <SelectContent>
                {userRedes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedRede ? (
        <>
          {activeTab === 'inicio' && <RedeInicio redeId={selectedRede} redeData={selectedRedeData} />}
          {activeTab === 'pulso' && (
            <div className="space-y-6">
              <PulsoRedeSection scopeType="rede" scopeId={selectedRede} title="Pulso da Rede" />
              <RadarSaudePanel scopeType="rede" scopeId={selectedRede} title="Radar de Saúde" compact />
            </div>
          )}
          {activeTab === 'acoes' && <RedeAcoes redeId={selectedRede} />}
        </>
      ) : (
        <EmptyState icon={Network} title="Selecione uma rede" description="Escolha sua rede para começar" />
      )}
    </div>
  );
}

// ────────── Aba Início ──────────
function RedeInicio({ redeId, redeData }: { redeId: string; redeData: any }) {
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();
  const dateRange = { from: getDateString(subDays(new Date(), 6)), to: getDateString(new Date()) };
  const { data: redeReports } = useWeeklyReportsByRede(redeId, dateRange);
  const { data: aniversariantes } = useAniversariantesSemana({ scopeType: 'rede', scopeId: redeId });
  const { data: pulso } = usePulsoRede({ scopeType: 'rede', scopeId: redeId });
  const { data: multiplicacoes } = useMultiplicacoes();

  const redeCoordenacoes = coordenacoes?.filter(c => {
    // Filter coordenacoes belonging to this rede
    return (c as any).rede_id === redeId;
  }) || [];

  const totalCelulas = pulso?.totalCelulas || 0;
  const celulasComRelatorio = pulso?.celulasComRelatorio || 0;
  const pendentes = totalCelulas - celulasComRelatorio;

  // Multiplicações últimos 90 dias
  const ninetyDaysAgo = subDays(new Date(), 90);
  const recentMultiplicacoes = (multiplicacoes || []).filter((m: any) => new Date(m.data_multiplicacao) >= ninetyDaysAgo).length;

  return (
    <div className="space-y-4">
      <MissionVerse role="rede_leader" />

      {/* Couple card */}
      {redeData?.leadership_couple && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {redeData.leadership_couple.spouse1 && (
                  <Avatar className="h-11 w-11 border-2 border-background">
                    <AvatarImage src={redeData.leadership_couple.spouse1.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{redeData.leadership_couple.spouse1.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                {redeData.leadership_couple.spouse2 && (
                  <Avatar className="h-11 w-11 border-2 border-background">
                    <AvatarImage src={redeData.leadership_couple.spouse2.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{redeData.leadership_couple.spouse2.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{redeData.leadership_couple.spouse1?.name} & {redeData.leadership_couple.spouse2?.name}</p>
                <p className="text-xs text-muted-foreground">Líderes de Rede</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Network} label="Coordenações" value={redeCoordenacoes.length} />
        <StatCard icon={Users} label="Células" value={totalCelulas} />
        <StatCard icon={FileText} label="Pendentes" value={pendentes} className={pendentes > 0 ? 'border-amber-500/30' : ''} />
        <StatCard icon={Cake} label="Aniversários" value={aniversariantes?.length || 0} />
      </div>

      {/* Radar card */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">📡 Radar</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <RadarItem
            label="Células 3+ sem relatório"
            value={pulso?.celulasAlerta3Semanas?.length || 0}
            variant={pulso?.celulasAlerta3Semanas?.length ? 'danger' : 'ok'}
          />
          <RadarItem
            label="Multiplicações (90 dias)"
            value={recentMultiplicacoes}
            variant="neutral"
          />
          <RadarItem
            label="Engajamento semanal"
            value={`${pulso?.percentualEngajamento || 0}%`}
            variant={pulso?.percentualEngajamento && pulso.percentualEngajamento < 50 ? 'danger' : 'ok'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ────────── Aba Ações ──────────
function RedeAcoes({ redeId }: { redeId: string }) {
  const [activeAction, setActiveAction] = useState<'cobranca' | 'aniversariantes' | 'relatorio' | null>(null);

  return (
    <div className="space-y-3">
      {!activeAction && (
        <>
          <ActionCard label="Cobrança em massa" icon={MessageSquare} description="Selecionar coordenações e cobrar via WhatsApp" onClick={() => setActiveAction('cobranca')} />
          <ActionCard label="Aniversariantes da semana" icon={Cake} description="Enviar parabéns via WhatsApp" onClick={() => setActiveAction('aniversariantes')} />
          <ActionCard label="Relatório para Pastores" icon={ExternalLink} description="Abrir no navegador (versão completa)" onClick={() => {
            window.open(window.location.origin + '/dashboard', '_blank');
          }} />
        </>
      )}

      {activeAction === 'cobranca' && <CobrancaMassaView redeId={redeId} onBack={() => setActiveAction(null)} />}
      {activeAction === 'aniversariantes' && <AniversariantesRedeView redeId={redeId} onBack={() => setActiveAction(null)} />}
    </div>
  );
}

function CobrancaMassaView({ redeId, onBack }: { redeId: string; onBack: () => void }) {
  const { data: pulso } = usePulsoRede({ scopeType: 'rede', scopeId: redeId });

  const allAlertCells = [
    ...(pulso?.celulasAlerta3Semanas || []),
    ...(pulso?.celulasAlerta2Semanas || []),
    ...(pulso?.celulasAlerta1Semana || []),
  ];

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">← Voltar</Button>
      <h3 className="text-sm font-semibold text-muted-foreground">Células sem relatório</h3>
      {allAlertCells.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Todas as células estão em dia! 🎉</CardContent></Card>
      ) : (
        allAlertCells.map(cel => (
          <Card key={cel.celula_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{cel.celula_name}</p>
                  <p className="text-xs text-muted-foreground">{cel.coordenacao_name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1 text-green-600 border-green-600/30 h-10"
                  onClick={() => {
                    const msg = encodeURIComponent(`Olá! 👋\n\nEste é um lembrete para enviar o relatório semanal da célula *${cel.celula_name}*.\n\nContamos com vocês! ❤️`);
                    window.location.href = `https://wa.me/?text=${msg}`;
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Cobrar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AniversariantesRedeView({ redeId, onBack }: { redeId: string; onBack: () => void }) {
  const { data: aniversariantes, isLoading } = useAniversariantesSemana({ scopeType: 'rede', scopeId: redeId });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">← Voltar</Button>
      <h3 className="text-sm font-semibold text-muted-foreground">Aniversariantes da semana</h3>
      {!aniversariantes?.length ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum aniversário esta semana</CardContent></Card>
      ) : (
        aniversariantes.map(b => (
          <BirthdayCard key={b.id} b={b} />
        ))
      )}
    </div>
  );
}

// ────────── Shared components ──────────
function BirthdayCard({ b }: { b: AniversarianteSemana }) {
  const firstName = b.name.split(' ')[0];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={b.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{b.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{b.name}</p>
            <p className="text-xs text-muted-foreground">{b.celula_name} · {b.display_date}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {b.is_today && <Badge className="bg-primary/10 text-primary text-xs">Hoje 🎂</Badge>}
            {b.whatsapp && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-green-600 border-green-600/30"
                onClick={() => {
                  const msg = encodeURIComponent(`Feliz aniversário, ${firstName}! 🎉\n\nQue Jesus te abençoe muito! ❤️\n\n— Rede Amor a 2`);
                  window.location.href = `https://wa.me/${b.whatsapp!.replace(/\D/g, '')}?text=${msg}`;
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RadarItem({ label, value, variant }: { label: string; value: number | string; variant: 'danger' | 'ok' | 'neutral' }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
      <span className="text-sm">{label}</span>
      <Badge variant="outline" className={
        variant === 'danger' ? 'border-destructive/50 text-destructive' :
        variant === 'ok' ? 'border-green-500/50 text-green-600' :
        ''
      }>
        {value}
      </Badge>
    </div>
  );
}

function ActionCard({ label, icon: Icon, description, onClick }: { label: string; icon: any; description: string; onClick: () => void }) {
  return (
    <Card className="cursor-pointer active:bg-accent/50 touch-manipulation transition-colors" onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  );
}
