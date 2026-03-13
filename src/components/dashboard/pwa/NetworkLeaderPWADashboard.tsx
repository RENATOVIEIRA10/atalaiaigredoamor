import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, FileText, Cake, AlertTriangle, MessageSquare, Network, ChevronRight, ClipboardCheck, Calendar, Eye, ExternalLink, Heart, GitBranch } from 'lucide-react';
import { AtalaiaLoader, SkPWA } from '@/components/ui/skeleton';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReportsByRede } from '@/hooks/useWeeklyReports';
import { usePulsoRede } from '@/hooks/usePulsoRede';
import { useAniversariantesSemana, AniversarianteSemana } from '@/hooks/useAniversariantesSemana';
import { useMultiplicacoes } from '@/hooks/useMultiplicacoes';
import { useSupervisaoRedeOverview } from '@/hooks/useSupervisaoRedeOverview';
import { useRole } from '@/contexts/RoleContext';
import { useDemoScope } from '@/hooks/useDemoScope';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from '../MissionVerse';
import { MissionBlock } from '../MissionBlock';
import { PulsoRedeSection } from '../PulsoRedeSection';
import { RadarSaudePanel } from '../RadarSaudePanel';
import { EmptyState } from '@/components/ui/empty-state';
import { getDateString } from '../DateRangeSelector';
import { subDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NetworkLeaderPWADashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';

  const { scopeId, scopeType } = useRole();
  const { data: redes, isLoading: redesLoading } = useRedes();

  const userRedes = redes || [];
  const [selectedRede, setSelectedRede] = useState<string>('');

  useEffect(() => {
    if (userRedes.length === 0 || selectedRede) return;
    if (scopeType === 'rede' && scopeId) {
      setSelectedRede(scopeId);
    } else if (userRedes.length === 1) {
      setSelectedRede(userRedes[0].id);
    }
  }, [scopeId, scopeType, userRedes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (redesLoading) {
    return <SkPWA />;
  }

  const selectedRedeData = userRedes.find(r => r.id === selectedRede);

  return (
    <div className="space-y-4">
      {userRedes.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Select value={selectedRede} onValueChange={setSelectedRede}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Selecione uma rede" />
              </SelectTrigger>
              <SelectContent>
                {userRedes.map((r) => {
                  const coupleNames = r.leadership_couple?.spouse1?.name
                    ? `${r.leadership_couple.spouse1.name}${r.leadership_couple?.spouse2?.name ? ` & ${r.leadership_couple.spouse2.name}` : ''}`
                    : null;
                  return (
                    <SelectItem key={r.id} value={r.id}>
                      <span>{r.name}</span>
                      {coupleNames && <span className="text-muted-foreground ml-1 text-xs">— {coupleNames}</span>}
                    </SelectItem>
                  );
                })}
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
              <PulsoRedeSection scopeType="rede" scopeId={selectedRede} title="Visão Pastoral da Rede" />
              <RadarSaudePanel scopeType="rede" scopeId={selectedRede} title="Saúde da Rede" compact />
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
  const { campoId } = useDemoScope();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: aniversariantes } = useAniversariantesSemana({ scopeType: 'rede', scopeId: redeId, campoId });
  const { data: pulso } = usePulsoRede({ scopeType: 'rede', scopeId: redeId });
  const { data: multiplicacoes } = useMultiplicacoes(campoId);
  const { data: supOverview } = useSupervisaoRedeOverview(redeId);

  const [drillDown, setDrillDown] = useState<'pendentes' | 'aniversariantes' | 'supervisoes_semana' | 'cobertura' | 'pendencias_bimestre' | null>(null);

  const redeCoordenacoes = coordenacoes?.filter(c => (c as any).rede_id === redeId) || [];
  const totalCelulas = pulso?.totalCelulas || 0;
  const celulasComRelatorio = pulso?.celulasComRelatorio || 0;
  const pendentes = totalCelulas - celulasComRelatorio;

  const ninetyDaysAgo = subDays(new Date(), 90);
  const recentMultiplicacoes = (multiplicacoes || []).filter((m: any) => new Date(m.data_multiplicacao) >= ninetyDaysAgo).length;

  // Drill-down views
  if (drillDown === 'pendentes') return <PendentesRedeView redeId={redeId} pulso={pulso} onBack={() => setDrillDown(null)} />;
  if (drillDown === 'aniversariantes') return <AniversariantesRedeView redeId={redeId} onBack={() => setDrillDown(null)} />;
  if (drillDown === 'supervisoes_semana') return <SupervisoesSemanaView data={supOverview?.supervisoes_semana || []} onBack={() => setDrillDown(null)} />;
  if (drillDown === 'cobertura') return <CoberturaBimestreView overview={supOverview} onBack={() => setDrillDown(null)} />;
  if (drillDown === 'pendencias_bimestre') return <PendenciasBimestreView pendencias={supOverview?.pendencias || []} onBack={() => setDrillDown(null)} />;

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

      {/* BLOCO 1 — O que precisa da minha atenção */}
      <MissionBlock icon={AlertTriangle} title="O que precisa da minha atenção">
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => setDrillDown('pendentes')} className="cursor-pointer active:scale-[0.97] transition-transform touch-manipulation">
            <StatCard icon={FileText} label="Pendentes" value={pendentes} className={pendentes > 0 ? 'border-amber-500/30' : ''} />
          </div>
          <div onClick={() => setDrillDown('aniversariantes')} className="cursor-pointer active:scale-[0.97] transition-transform touch-manipulation">
            <StatCard icon={Cake} label="Aniversários" value={aniversariantes?.length || 0} />
          </div>
        </div>

        {/* Supervisões */}
        <Card className="mt-3">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Supervisões
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <TappableRow
              label="Supervisões desta semana"
              value={supOverview?.supervisoes_semana.length || 0}
              onClick={() => setDrillDown('supervisoes_semana')}
            />
            <TappableRow
              label="Cobertura do bimestre"
              value={`${supOverview?.cobertura_percentual || 0}%`}
              onClick={() => setDrillDown('cobertura')}
              extra={<Progress value={supOverview?.cobertura_percentual || 0} className="h-1.5 mt-1" />}
            />
            <TappableRow
              label="Pendências do bimestre"
              value={supOverview?.pendencias.length || 0}
              variant={(supOverview?.pendencias.length || 0) > 0 ? 'warning' : 'ok'}
              onClick={() => setDrillDown('pendencias_bimestre')}
            />
          </CardContent>
        </Card>
      </MissionBlock>

      {/* BLOCO 2 — Movimento do Reino */}
      <MissionBlock icon={GitBranch} title="Movimento do Reino">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Network} label="Coordenações" value={redeCoordenacoes.length} />
          <StatCard icon={Users} label="Células" value={totalCelulas} />
        </div>
      </MissionBlock>

      {/* BLOCO 3 — Saúde e Cuidado */}
      <MissionBlock icon={Heart} title="Saúde e Cuidado">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-muted-foreground">📡 Radar</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div
              className="cursor-pointer active:bg-accent/30 rounded-lg transition-colors touch-manipulation"
              onClick={() => setDrillDown('pendentes')}
            >
              <RadarItem
                label="Células 3+ sem relatório"
                value={pulso?.celulasAlerta3Semanas?.length || 0}
                variant={pulso?.celulasAlerta3Semanas?.length ? 'danger' : 'ok'}
              />
            </div>
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
      </MissionBlock>
    </div>
  );
}

// ────────── Drill-down: Pendentes ──────────
function PendentesRedeView({ redeId, pulso, onBack }: { redeId: string; pulso: any; onBack: () => void }) {
  const allAlertCells = [
    ...(pulso?.celulasAlerta3Semanas || []),
    ...(pulso?.celulasAlerta2Semanas || []),
    ...(pulso?.celulasAlerta1Semana || []),
  ];

  return (
    <DrillDownContainer title="Células sem relatório" onBack={onBack}>
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
    </DrillDownContainer>
  );
}

// ────────── Drill-down: Supervisões da Semana ──────────
function SupervisoesSemanaView({ data, onBack }: { data: any[]; onBack: () => void }) {
  return (
    <DrillDownContainer title="Supervisões desta semana" onBack={onBack}>
      {data.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma supervisão esta semana</CardContent></Card>
      ) : (
        data.map(s => (
          <Card key={s.id} className={`border-l-4 ${s.celula_realizada ? 'border-l-green-500' : 'border-l-amber-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{s.celula_name}</p>
                  <p className="text-xs text-muted-foreground">{s.coordenacao_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    👤 {s.supervisor_name}
                    {s.is_coordinator_supervision && <Badge variant="outline" className="ml-2 text-[10px] px-1">Coord.</Badge>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={s.celula_realizada ? 'default' : 'outline'} className="text-xs">
                    {s.celula_realizada ? 'Realizada' : 'Planejada'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(s.data_supervisao), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </DrillDownContainer>
  );
}

// ────────── Drill-down: Cobertura do Bimestre ──────────
function CoberturaBimestreView({ overview, onBack }: { overview: any; onBack: () => void }) {
  return (
    <DrillDownContainer title="Cobertura do Bimestre" onBack={onBack}>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{overview?.cobertura_percentual || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">{overview?.bimestre_label}</p>
          </div>
          <Progress value={overview?.cobertura_percentual || 0} className="h-2" />
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">{overview?.celulas_supervisionadas_bimestre || 0}</p>
              <p className="text-xs text-muted-foreground">Supervisionadas</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{overview?.pendencias?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DrillDownContainer>
  );
}

// ────────── Drill-down: Pendências do Bimestre ──────────
function PendenciasBimestreView({ pendencias, onBack }: { pendencias: any[]; onBack: () => void }) {
  return (
    <DrillDownContainer title="Pendências do Bimestre" onBack={onBack}>
      {pendencias.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Todas as células foram supervisionadas! 🎉</CardContent></Card>
      ) : (
        pendencias.map(p => (
          <Card key={p.celula_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{p.celula_name}</p>
                  <p className="text-xs text-muted-foreground">{p.coordenacao_name}</p>
                  <p className="text-xs text-muted-foreground">👫 {p.leadership_couple_name}</p>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${p.days_since_last === null ? 'border-destructive/50 text-destructive' : p.days_since_last > 30 ? 'border-amber-500/50 text-amber-600' : ''}`}>
                  {p.days_since_last === null ? 'Nunca' : `${p.days_since_last}d atrás`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </DrillDownContainer>
  );
}

// ────────── Aba Ações ──────────
function RedeAcoes({ redeId }: { redeId: string }) {
  const [activeAction, setActiveAction] = useState<'cobranca' | 'aniversariantes' | null>(null);

  return (
    <div className="space-y-3">
      {!activeAction && (
        <>
          <ActionCard label="Cobrança em massa" icon={MessageSquare} description="Selecionar coordenações e cobrar via WhatsApp" onClick={() => setActiveAction('cobranca')} />
          <ActionCard label="Aniversariantes da semana" icon={Cake} description="Enviar parabéns via WhatsApp" onClick={() => setActiveAction('aniversariantes')} />
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
    <DrillDownContainer title="Células sem relatório" onBack={onBack}>
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
    </DrillDownContainer>
  );
}

// ────────── Drill-down: Aniversariantes ──────────
function AniversariantesRedeView({ redeId, onBack }: { redeId: string; onBack: () => void }) {
  const { campoId } = useDemoScope();
  const { data: aniversariantes } = useAniversariantesSemana({ scopeType: 'rede', scopeId: redeId, campoId });

  return (
    <DrillDownContainer title="Aniversariantes da semana" onBack={onBack}>
      {!aniversariantes || aniversariantes.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum aniversariante esta semana</CardContent></Card>
      ) : (
        aniversariantes.map((a: AniversarianteSemana) => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.celula_name} • {a.display_date}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1 text-green-600 border-green-600/30 h-10"
                  onClick={() => {
                    const msg = encodeURIComponent(`Feliz aniversário, ${a.name}! 🎂🎉\n\nQue Deus abençoe ricamente a sua vida!\n\nCom carinho ❤️`);
                    window.location.href = `https://wa.me/?text=${msg}`;
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Parabéns
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </DrillDownContainer>
  );
}

// ────────── Shared components ──────────

function DrillDownContainer({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
        <ChevronRight className="h-4 w-4 rotate-180" />
        {title}
      </Button>
      {children}
    </div>
  );
}

function TappableRow({ label, value, onClick, variant, extra }: { label: string; value: string | number; onClick?: () => void; variant?: 'ok' | 'warning'; extra?: React.ReactNode }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-colors touch-manipulation ${onClick ? 'cursor-pointer active:bg-accent/30' : ''} ${variant === 'warning' ? 'bg-amber-500/5' : 'bg-muted/30'}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{label}</p>
        {extra}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={variant === 'warning' ? 'outline' : 'secondary'} className={`text-xs ${variant === 'warning' ? 'border-amber-500/50 text-amber-600' : ''}`}>
          {value}
        </Badge>
        {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  );
}

function RadarItem({ label, value, variant }: { label: string; value: string | number; variant: 'ok' | 'danger' | 'neutral' }) {
  const colorClass = variant === 'danger' ? 'text-destructive' : variant === 'ok' ? 'text-green-600' : 'text-muted-foreground';
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
      <span className="text-sm">{label}</span>
      <Badge variant="outline" className={`text-xs ${colorClass}`}>{value}</Badge>
    </div>
  );
}

function ActionCard({ label, icon: Icon, description, onClick }: { label: string; icon: any; description: string; onClick: () => void }) {
  return (
    <Card className="cursor-pointer active:scale-[0.98] transition-transform touch-manipulation" onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  );
}
