import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, FileText, Cake, AlertTriangle, MessageSquare, ClipboardCheck, Eye, ChevronRight, Calendar } from 'lucide-react';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReportsByCoordenacao } from '@/hooks/useWeeklyReports';
import { usePulsoRede } from '@/hooks/usePulsoRede';
import { useAniversariantesSemana, AniversarianteSemana } from '@/hooks/useAniversariantesSemana';
import { useRole } from '@/contexts/RoleContext';
import { useDemoScope } from '@/hooks/useDemoScope';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from '../MissionVerse';
import { PulsoRedeSection } from '../PulsoRedeSection';
import { RadarSaudePanel } from '../RadarSaudePanel';
import { SupervisoesList } from '../SupervisoesList';
import { useSupervisoesByCoordenacao } from '@/hooks/useSupervisoes';
import { usePlanejamentoBimestral } from '@/hooks/usePlanejamentoBimestral';
import { useSupervisores } from '@/hooks/useSupervisoes';
import { EmptyState } from '@/components/ui/empty-state';
import { getDateString } from '../DateRangeSelector';
import { subDays, startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CoordinatorPWADashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';

  const { scopeId, scopeType } = useRole();
  const { data: coordenacoes, isLoading: coordLoading } = useCoordenacoes();

  const userCoordenacoes = scopeType === 'coordenacao' && scopeId
    ? (coordenacoes || []).filter(c => c.id === scopeId)
    : coordenacoes || [];

  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>('');

  if (scopeType === 'coordenacao' && scopeId && !selectedCoordenacao && userCoordenacoes.length > 0) {
    setSelectedCoordenacao(scopeId);
  }

  if (coordLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedCoordData = userCoordenacoes.find(c => c.id === selectedCoordenacao);

  return (
    <div className="space-y-4">
      {userCoordenacoes.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Select value={selectedCoordenacao} onValueChange={setSelectedCoordenacao}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Selecione uma coordenação" />
              </SelectTrigger>
              <SelectContent>
                {userCoordenacoes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedCoordenacao ? (
        <>
          {activeTab === 'inicio' && <CoordInicio coordId={selectedCoordenacao} coordData={selectedCoordData} />}
          {activeTab === 'pulso' && (
            <div className="space-y-6">
              <PulsoRedeSection scopeType="coordenacao" scopeId={selectedCoordenacao} title="Pulso da Coordenação" />
              <RadarSaudePanel scopeType="coordenacao" scopeId={selectedCoordenacao} title="Radar de Saúde" compact />
            </div>
          )}
          {activeTab === 'acoes' && <CoordAcoes coordId={selectedCoordenacao} />}
        </>
      ) : (
        <EmptyState icon={Users} title="Selecione uma coordenação" description="Escolha sua coordenação para começar" />
      )}
    </div>
  );
}

// ────────── Aba Início ──────────
function CoordInicio({ coordId, coordData }: { coordId: string; coordData: any }) {
  const { campoId } = useDemoScope();
  const { data: celulas } = useCelulas();
  const dateRange = { from: getDateString(subDays(new Date(), 6)), to: getDateString(new Date()) };
  const { data: reports } = useWeeklyReportsByCoordenacao(coordId, dateRange);
  const { data: aniversariantes } = useAniversariantesSemana({ scopeType: 'coordenacao', scopeId: coordId, campoId });
  const { data: supervisoes } = useSupervisoesByCoordenacao(coordId);

  // Drill-down state
  const [drillDown, setDrillDown] = useState<'pendentes' | 'aniversariantes' | 'supervisoes_semana' | null>(null);

  const coordCelulas = celulas?.filter(c => c.coordenacao_id === coordId) || [];
  const totalCelulas = coordCelulas.length;
  const celulasComRelatorio = new Set((reports || []).map(r => r.celula_id)).size;
  const pendentes = totalCelulas - celulasComRelatorio;

  // Supervisões desta semana
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const supervisoesSemana = (supervisoes || []).filter(s => {
    const d = new Date(s.data_supervisao);
    return d >= weekStart && d <= weekEnd;
  });

  // Drill-down views
  if (drillDown === 'pendentes') return <PendentesView coordId={coordId} onBack={() => setDrillDown(null)} />;
  if (drillDown === 'aniversariantes') return <AniversariantesView coordId={coordId} onBack={() => setDrillDown(null)} />;
  if (drillDown === 'supervisoes_semana') return <SupervisoesSemanaCoordView supervisoes={supervisoesSemana} onBack={() => setDrillDown(null)} />;

  return (
    <div className="space-y-4">
      <MissionVerse role="coordenador" />

      {/* Couple card */}
      {coordData?.leadership_couple && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {coordData.leadership_couple.spouse1 && (
                  <Avatar className="h-11 w-11 border-2 border-background">
                    <AvatarImage src={coordData.leadership_couple.spouse1.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{coordData.leadership_couple.spouse1.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                {coordData.leadership_couple.spouse2 && (
                  <Avatar className="h-11 w-11 border-2 border-background">
                    <AvatarImage src={coordData.leadership_couple.spouse2.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">{coordData.leadership_couple.spouse2.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{coordData.leadership_couple.spouse1?.name} & {coordData.leadership_couple.spouse2?.name}</p>
                <p className="text-xs text-muted-foreground">Coordenadores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs — clickable */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Células" value={totalCelulas} />
        <div onClick={() => setDrillDown('pendentes')} className="cursor-pointer active:scale-[0.97] transition-transform touch-manipulation">
          <StatCard icon={FileText} label="Pendentes" value={pendentes} className={pendentes > 0 ? 'border-amber-500/30' : ''} />
        </div>
        <div onClick={() => setDrillDown('aniversariantes')} className="cursor-pointer active:scale-[0.97] transition-transform touch-manipulation">
          <StatCard icon={Cake} label="Aniversários" value={aniversariantes?.length || 0} />
        </div>
      </div>

      {/* Ações da semana (NEW) */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Ações da semana
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <TappableRow
            label="Supervisões desta semana"
            value={supervisoesSemana.length}
            onClick={() => setDrillDown('supervisoes_semana')}
          />
          <TappableRow
            label="Células sem relatório"
            value={pendentes}
            variant={pendentes > 0 ? 'warning' : 'ok'}
            onClick={() => setDrillDown('pendentes')}
          />
          <TappableRow
            label="Aniversariantes"
            value={aniversariantes?.length || 0}
            onClick={() => setDrillDown('aniversariantes')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ────────── Drill-down: Supervisões da Semana (Coord) ──────────
function SupervisoesSemanaCoordView({ supervisoes, onBack }: { supervisoes: any[]; onBack: () => void }) {
  return (
    <DrillDownContainer title="Supervisões desta semana" onBack={onBack}>
      {supervisoes.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma supervisão esta semana</CardContent></Card>
      ) : (
        supervisoes.map(s => (
          <Card key={s.id} className={`border-l-4 ${s.celula_realizada ? 'border-l-green-500' : 'border-l-amber-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{s.celula?.name || 'Célula'}</p>
                  <p className="text-xs text-muted-foreground">
                    👤 {s.supervisor?.profile?.name || 'Supervisor'}
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

// ────────── Aba Ações ──────────
function CoordAcoes({ coordId }: { coordId: string }) {
  const [activeAction, setActiveAction] = useState<'pendentes' | 'aniversariantes' | 'supervisoes' | null>(null);

  return (
    <div className="space-y-3">
      {!activeAction && (
        <>
          <ActionCard label="Células sem relatório" icon={AlertTriangle} description="Cobrar relatórios via WhatsApp" onClick={() => setActiveAction('pendentes')} />
          <ActionCard label="Aniversariantes da semana" icon={Cake} description="Enviar parabéns via WhatsApp" onClick={() => setActiveAction('aniversariantes')} />
          <ActionCard label="Supervisões" icon={ClipboardCheck} description="Registrar e ver histórico" onClick={() => setActiveAction('supervisoes')} />
        </>
      )}

      {activeAction === 'pendentes' && <PendentesView coordId={coordId} onBack={() => setActiveAction(null)} />}
      {activeAction === 'aniversariantes' && <AniversariantesView coordId={coordId} onBack={() => setActiveAction(null)} />}
      {activeAction === 'supervisoes' && <SupervisoesView coordId={coordId} onBack={() => setActiveAction(null)} />}
    </div>
  );
}

function PendentesView({ coordId, onBack }: { coordId: string; onBack: () => void }) {
  const { data: celulas } = useCelulas();
  const dateRange = { from: getDateString(subDays(new Date(), 6)), to: getDateString(new Date()) };
  const { data: reports } = useWeeklyReportsByCoordenacao(coordId, dateRange);

  const coordCelulas = celulas?.filter(c => c.coordenacao_id === coordId) || [];
  const celulasComRelatorio = new Set((reports || []).map(r => r.celula_id));
  const pendentes = coordCelulas.filter(c => !celulasComRelatorio.has(c.id));

  return (
    <DrillDownContainer title="Células sem relatório esta semana" onBack={onBack}>
      {pendentes.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Todas as células enviaram relatório! 🎉</CardContent></Card>
      ) : (
        pendentes.map(cel => (
          <Card key={cel.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{cel.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cel.leadership_couple
                      ? `${cel.leadership_couple.spouse1?.name} & ${cel.leadership_couple.spouse2?.name}`
                      : 'Sem líderes'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1 text-green-600 border-green-600/30 h-10"
                  onClick={() => {
                    const msg = encodeURIComponent(`Olá! 👋\n\nEste é um lembrete amigável para enviar o relatório semanal da célula *${cel.name}*.\n\nContamos com vocês! ❤️`);
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

function AniversariantesView({ coordId, onBack }: { coordId: string; onBack: () => void }) {
  const { campoId } = useDemoScope();
  const { data: aniversariantes, isLoading } = useAniversariantesSemana({ scopeType: 'coordenacao', scopeId: coordId, campoId });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <DrillDownContainer title="Aniversariantes da semana" onBack={onBack}>
      {!aniversariantes?.length ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum aniversário esta semana</CardContent></Card>
      ) : (
        aniversariantes.map(b => (
          <BirthdayCard key={b.id} b={b} />
        ))
      )}
    </DrillDownContainer>
  );
}

function SupervisoesView({ coordId, onBack }: { coordId: string; onBack: () => void }) {
  const { data: supervisoes, isLoading } = useSupervisoesByCoordenacao(coordId);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <DrillDownContainer title="Supervisões" onBack={onBack}>
      {supervisoes && supervisoes.length > 0 ? (
        <SupervisoesList supervisoes={supervisoes} />
      ) : (
        <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description="As supervisões aparecerão aqui" />
      )}
    </DrillDownContainer>
  );
}

// ────────── Shared components ──────────
function DrillDownContainer({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 h-11 touch-manipulation">← Voltar</Button>
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function TappableRow({ label, value, variant, onClick }: {
  label: string;
  value: number | string;
  variant?: 'warning' | 'ok';
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 cursor-pointer active:bg-accent/50 touch-manipulation transition-colors"
      onClick={onClick}
    >
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={
          variant === 'warning' ? 'border-amber-500/50 text-amber-600' :
          variant === 'ok' ? 'border-green-500/50 text-green-600' :
          ''
        }>
          {value}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

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
