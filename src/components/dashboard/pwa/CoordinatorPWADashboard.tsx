import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, FileText, Cake, AlertTriangle, MessageSquare, ClipboardCheck, Eye, ChevronRight } from 'lucide-react';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReportsByCoordenacao } from '@/hooks/useWeeklyReports';
import { usePulsoRede } from '@/hooks/usePulsoRede';
import { useAniversariantesSemana, AniversarianteSemana } from '@/hooks/useAniversariantesSemana';
import { useRole } from '@/contexts/RoleContext';
import { StatCard } from '@/components/ui/stat-card';
import { MissionVerse } from '../MissionVerse';
import { PulsoRedeSection } from '../PulsoRedeSection';
import { SupervisoesList } from '../SupervisoesList';
import { useSupervisoesByCoordenacao } from '@/hooks/useSupervisoes';
import { EmptyState } from '@/components/ui/empty-state';
import { getDateString } from '../DateRangeSelector';
import { subDays } from 'date-fns';

export function CoordinatorPWADashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';

  const { scopeId, scopeType } = useRole();
  const { data: coordenacoes, isLoading: coordLoading } = useCoordenacoes();

  const userCoordenacoes = scopeType === 'coordenacao' && scopeId
    ? (coordenacoes || []).filter(c => c.id === scopeId)
    : coordenacoes || [];

  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>('');

  // Auto-select if scoped
  if (scopeType === 'coordenacao' && scopeId && !selectedCoordenacao && userCoordenacoes.length > 0) {
    setSelectedCoordenacao(scopeId);
  }

  if (coordLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedCoordData = userCoordenacoes.find(c => c.id === selectedCoordenacao);

  return (
    <div className="space-y-4">
      {/* Coordenação selector (only if multiple) */}
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
          {activeTab === 'pulso' && <PulsoRedeSection scopeType="coordenacao" scopeId={selectedCoordenacao} title="Pulso da Coordenação" />}
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
  const { data: celulas } = useCelulas();
  const dateRange = { from: getDateString(subDays(new Date(), 6)), to: getDateString(new Date()) };
  const { data: reports } = useWeeklyReportsByCoordenacao(coordId, dateRange);
  const { data: aniversariantes } = useAniversariantesSemana({ scopeType: 'coordenacao', scopeId: coordId });
  const { data: pulso } = usePulsoRede({ scopeType: 'coordenacao', scopeId: coordId });

  const coordCelulas = celulas?.filter(c => c.coordenacao_id === coordId) || [];
  const totalCelulas = coordCelulas.length;
  const celulasComRelatorio = new Set((reports || []).map(r => r.celula_id)).size;
  const pendentes = totalCelulas - celulasComRelatorio;

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

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Células" value={totalCelulas} />
        <StatCard icon={FileText} label="Pendentes" value={pendentes} className={pendentes > 0 ? 'border-amber-500/30' : ''} />
        <StatCard icon={Cake} label="Aniversários" value={aniversariantes?.length || 0} />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Próximas ações</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <ActionButton
            label={`Ver células sem relatório (${pendentes})`}
            icon={AlertTriangle}
            disabled={pendentes === 0}
            href="/dashboard?tab=acoes"
          />
          <ActionButton
            label={`Ver aniversariantes (${aniversariantes?.length || 0})`}
            icon={Cake}
            disabled={!aniversariantes?.length}
            href="/dashboard?tab=acoes"
          />
        </CardContent>
      </Card>
    </div>
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
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">← Voltar</Button>
      <h3 className="text-sm font-semibold text-muted-foreground">Células sem relatório esta semana</h3>
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
                    const url = `https://wa.me/?text=${msg}`;
                    window.location.href = url;
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

function AniversariantesView({ coordId, onBack }: { coordId: string; onBack: () => void }) {
  const { data: aniversariantes, isLoading } = useAniversariantesSemana({ scopeType: 'coordenacao', scopeId: coordId });

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

function SupervisoesView({ coordId, onBack }: { coordId: string; onBack: () => void }) {
  const { data: supervisoes, isLoading } = useSupervisoesByCoordenacao(coordId);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">← Voltar</Button>
      <h3 className="text-sm font-semibold text-muted-foreground">Supervisões</h3>
      {supervisoes && supervisoes.length > 0 ? (
        <SupervisoesList supervisoes={supervisoes} />
      ) : (
        <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description="As supervisões aparecerão aqui" />
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

function ActionButton({ label, icon: Icon, disabled, href }: { label: string; icon: any; disabled?: boolean; href: string }) {
  return (
    <Button
      variant="outline"
      className="w-full justify-between h-12 text-sm"
      disabled={disabled}
      onClick={() => { if (!disabled) window.location.href = href; }}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Button>
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
