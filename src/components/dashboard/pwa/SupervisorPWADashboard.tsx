import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ClipboardCheck, Plus, Eye, Calendar, Users, ChevronRight, AlertTriangle, Heart, Sprout, HeartPulse } from 'lucide-react';
import { usePlanejamentoBimestral } from '@/hooks/usePlanejamentoBimestral';
import { ProgressoCuidadoBar } from '../supervisor/ProgressoCuidadoBar';
import { PlanejamentoBimestralPanel } from '../supervisor/PlanejamentoBimestralPanel';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useSupervisores, useSupervisoesBySupervisor, Supervisao } from '@/hooks/useSupervisoes';
import { useCelulas } from '@/hooks/useCelulas';
import { SupervisaoFormDialog } from '../supervisor/SupervisaoFormDialog';
import { SupervisaoDetailsDialog } from '../supervisor/SupervisaoDetailsDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { MissionVerse } from '../MissionVerse';
import { MissionBlock } from '@/components/dashboard/MissionBlock';
import { useRole } from '@/contexts/RoleContext';
import { format, parseISO, startOfMonth, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsPWA } from '@/hooks/useIsPWA';

export function SupervisorPWADashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';
  const isPWA = useIsPWA();

  const { data: coordenacoes, isLoading: coordLoading } = useCoordenacoes();
  const { data: supervisores, isLoading: supLoading } = useSupervisores();
  const { scopeId, scopeType } = useRole();

  const autoSupervisor = scopeType === 'supervisor' && scopeId
    ? supervisores?.find(s => s.id === scopeId)
    : null;

  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>(autoSupervisor?.coordenacao_id || '');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>(autoSupervisor?.id || '');

  useEffect(() => {
    if (scopeType === 'supervisor' && scopeId && supervisores && !selectedSupervisor) {
      const sup = supervisores.find(s => s.id === scopeId);
      if (sup) {
        setSelectedCoordenacao(sup.coordenacao_id);
        setSelectedSupervisor(sup.id);
      }
    }
  }, [supervisores, scopeId, scopeType]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: celulas } = useCelulas();
  const { data: supervisoes, isLoading: supervisoesLoading } = useSupervisoesBySupervisor(selectedSupervisor);

  const filteredSupervisores = supervisores?.filter(s => !selectedCoordenacao || s.coordenacao_id === selectedCoordenacao) || [];
  const filteredCelulas = celulas?.filter(c => c.coordenacao_id === selectedCoordenacao) || [];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupervisao, setSelectedSupervisao] = useState<Supervisao | null>(null);

  if (coordLoading || supLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const currentSup = supervisores?.find(s => s.id === selectedSupervisor);
  const supName = currentSup?.leadership_couple
    ? `${currentSup.leadership_couple.spouse1?.name?.split(' ')[0] || ''} & ${currentSup.leadership_couple.spouse2?.name?.split(' ')[0] || ''}`
    : currentSup?.profile?.name || '';

  const monthStart = startOfMonth(new Date());
  const supervisoesThisMonth = (supervisoes || []).filter(s => isAfter(parseISO(s.data_supervisao), monthStart));
  const celulasNoEscopo = filteredCelulas.length;

  const needsSelection = !selectedSupervisor;

  if (needsSelection) {
    return (
      <div className="space-y-4">
        <MissionVerse role="supervisor" />
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Coordenação</p>
            <Select value={selectedCoordenacao} onValueChange={(v) => { setSelectedCoordenacao(v); setSelectedSupervisor(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{coordenacoes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>
        {selectedCoordenacao && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Supervisor</p>
              <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredSupervisores.map(s => {
                    const name = s.leadership_couple
                      ? `${s.leadership_couple.spouse1?.name || ''} & ${s.leadership_couple.spouse2?.name || ''}`
                      : s.profile?.name || 'Supervisor';
                    return <SelectItem key={s.id} value={s.id}>{name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (activeTab === 'plano') return (
    <div className="space-y-4">
      <PlanejamentoBimestralPanel supervisorId={selectedSupervisor} coordenacaoId={selectedCoordenacao} compact />
      <SupervisaoFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} supervisorId={selectedSupervisor} celulas={filteredCelulas} />
      {selectedSupervisao && (
        <SupervisaoDetailsDialog open={!!selectedSupervisao} onOpenChange={(open) => !open && setSelectedSupervisao(null)} supervisao={selectedSupervisao} />
      )}
    </div>
  );

  if (activeTab === 'acoes') return (
    <AcoesTab
      supervisorId={selectedSupervisor}
      celulas={filteredCelulas}
      supervisoes={supervisoes || []}
      isFormOpen={isFormOpen}
      setIsFormOpen={setIsFormOpen}
      selectedSupervisao={selectedSupervisao}
      setSelectedSupervisao={setSelectedSupervisao}
    />
  );

  if (activeTab === 'historico') return (
    <HistoricoTab
      supervisoes={supervisoes || []}
      isLoading={supervisoesLoading}
      onSelect={setSelectedSupervisao}
      selectedSupervisao={selectedSupervisao}
      setSelectedSupervisao={setSelectedSupervisao}
    />
  );

  // ── Início — 3 blocos pastorais ──
  return (
    <SupervisorInicioTab
      supName={supName}
      supervisoesThisMonth={supervisoesThisMonth}
      celulasNoEscopo={celulasNoEscopo}
      supervisoes={supervisoes || []}
      selectedSupervisor={selectedSupervisor}
      selectedCoordenacao={selectedCoordenacao}
      isFormOpen={isFormOpen}
      setIsFormOpen={setIsFormOpen}
      filteredCelulas={filteredCelulas}
      selectedSupervisao={selectedSupervisao}
      setSelectedSupervisao={setSelectedSupervisao}
    />
  );
}

function SupervisorInicioTab({
  supName, supervisoesThisMonth, celulasNoEscopo, supervisoes,
  selectedSupervisor, selectedCoordenacao, isFormOpen, setIsFormOpen,
  filteredCelulas, selectedSupervisao, setSelectedSupervisao,
}: {
  supName: string; supervisoesThisMonth: any[]; celulasNoEscopo: number; supervisoes: any[];
  selectedSupervisor: string; selectedCoordenacao: string; isFormOpen: boolean; setIsFormOpen: (v: boolean) => void;
  filteredCelulas: any[]; selectedSupervisao: any; setSelectedSupervisao: (v: any) => void;
}) {
  const { data: planejamento } = usePlanejamentoBimestral({ supervisorId: selectedSupervisor, coordenacaoId: selectedCoordenacao });

  const totalPlanejadas = planejamento?.minhas_semanas.reduce((sum, s) => sum + s.celulas.length, 0) || 0;
  const realizadas = planejamento?.minhas_semanas.reduce((sum, s) => sum + s.celulas.filter(c => c.realizada).length, 0) || 0;

  // Cells not yet supervised
  const celulasSupervisionadas = new Set(supervisoes.map((s: any) => s.celula_id));
  const celulasPendentes = filteredCelulas.filter(c => !celulasSupervisionadas.has(c.id));

  return (
    <div className="space-y-5">
      {/* Supervisor card */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">{supName || 'Supervisor'}</h2>
            <p className="text-sm text-muted-foreground">Dashboard do Supervisor</p>
          </div>
        </CardContent>
      </Card>

      <MissionVerse role="supervisor" />

      {/* ── BLOCO 1 — O que precisa da minha atenção ── */}
      <MissionBlock icon={AlertTriangle} title="O que precisa da minha atenção">
        {celulasPendentes.length > 0 ? (
          <Card className="border-l-4 border-l-amber-500/50">
            <CardContent className="py-3 px-4">
              <p className="text-sm font-medium">{celulasPendentes.length} célula(s) sem supervisão</p>
              <p className="text-xs text-muted-foreground">{celulasPendentes.map(c => c.name).join(', ')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground text-center">
              Todas as células supervisionadas 🙏
            </CardContent>
          </Card>
        )}

        <Button className="w-full h-14 text-base font-semibold" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Registrar Supervisão
        </Button>
      </MissionBlock>

      {/* ── BLOCO 2 — Movimento do Reino ── */}
      <MissionBlock icon={Sprout} title="Movimento do Reino">
        {planejamento && (
          <ProgressoCuidadoBar
            totalCells={totalPlanejadas}
            completedCells={realizadas}
            bimestreLabel={planejamento.bimestre_label}
          />
        )}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <ClipboardCheck className="h-4 w-4 text-primary mb-1" />
              <span className="text-lg font-bold">{supervisoesThisMonth.length}</span>
              <span className="text-xs text-muted-foreground">No mês</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Users className="h-4 w-4 text-primary mb-1" />
              <span className="text-lg font-bold">{celulasNoEscopo}</span>
              <span className="text-xs text-muted-foreground">Células</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-lg font-bold">{supervisoes.length}</span>
              <span className="text-xs text-muted-foreground">Total geral</span>
            </CardContent>
          </Card>
        </div>
      </MissionBlock>

      {/* ── BLOCO 3 — Saúde e Cuidado ── */}
      <MissionBlock icon={HeartPulse} title="Saúde e Cuidado">
        {celulasPendentes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">Células aguardando supervisão</p>
            {celulasPendentes.slice(0, 3).map(c => (
              <Card key={c.id} className="border-l-4 border-l-amber-500/60">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 text-xs font-bold shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {c.leadership_couple && (
                      <p className="text-xs text-muted-foreground truncate">
                        {c.leadership_couple.spouse1?.name?.split(' ')[0]} & {c.leadership_couple.spouse2?.name?.split(' ')[0]}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {celulasPendentes.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">+{celulasPendentes.length - 3} mais</p>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground text-center">
              ✅ Todas as células supervisionadas este período
            </CardContent>
          </Card>
        )}
      </MissionBlock>

      <SupervisaoFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} supervisorId={selectedSupervisor} celulas={filteredCelulas} />
      {selectedSupervisao && (
        <SupervisaoDetailsDialog open={!!selectedSupervisao} onOpenChange={(open) => !open && setSelectedSupervisao(null)} supervisao={selectedSupervisao} />
      )}
    </div>
  );
}

/* ── Aba Ações — reorganizada nos 3 blocos ── */
function AcoesTab({
  supervisorId, celulas, supervisoes, isFormOpen, setIsFormOpen, selectedSupervisao, setSelectedSupervisao,
}: {
  supervisorId: string;
  celulas: any[];
  supervisoes: Supervisao[];
  isFormOpen: boolean;
  setIsFormOpen: (v: boolean) => void;
  selectedSupervisao: Supervisao | null;
  setSelectedSupervisao: (v: Supervisao | null) => void;
}) {
  const [showCelulas, setShowCelulas] = useState(false);

  if (showCelulas) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setShowCelulas(false)} className="gap-1 -ml-2 h-11 touch-manipulation">← Voltar</Button>
        <h2 className="text-lg font-semibold">Células do meu escopo</h2>
        {celulas.length === 0 ? (
          <EmptyState icon={Users} title="Nenhuma célula" description="Nenhuma célula encontrada no seu escopo." />
        ) : (
          celulas.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm">{c.name}</h3>
                {c.leadership_couple && (
                  <p className="text-xs text-muted-foreground mt-1">
                    👫 {c.leadership_couple.spouse1?.name?.split(' ')[0]} & {c.leadership_couple.spouse2?.name?.split(' ')[0]}
                  </p>
                )}
                {c.meeting_day && (
                  <p className="text-xs text-muted-foreground">{c.meeting_day}{c.meeting_time ? ` às ${c.meeting_time}` : ''}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MissionBlock icon={AlertTriangle} title="O que precisa da minha atenção">
        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setIsFormOpen(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Registrar Supervisão</h3>
              <p className="text-xs text-muted-foreground">Visita à célula</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </MissionBlock>

      <MissionBlock icon={Sprout} title="Movimento do Reino">
        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setShowCelulas(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Células do meu escopo</h3>
              <p className="text-xs text-muted-foreground">{celulas.length} célula(s)</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </MissionBlock>

      <SupervisaoFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} supervisorId={supervisorId} celulas={celulas} />
      {selectedSupervisao && (
        <SupervisaoDetailsDialog open={!!selectedSupervisao} onOpenChange={(open) => !open && setSelectedSupervisao(null)} supervisao={selectedSupervisao} />
      )}
    </div>
  );
}

/* ── Aba Histórico ── */
function HistoricoTab({
  supervisoes, isLoading, onSelect, selectedSupervisao, setSelectedSupervisao,
}: {
  supervisoes: Supervisao[];
  isLoading: boolean;
  onSelect: (s: Supervisao) => void;
  selectedSupervisao: Supervisao | null;
  setSelectedSupervisao: (v: Supervisao | null) => void;
}) {
  const [filter, setFilter] = useState<number>(90);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - filter);

  const filtered = supervisoes.filter(s => new Date(s.data_supervisao) >= cutoff);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Histórico de Cuidado e Supervisão</h2>

      <div className="flex gap-2">
        {[30, 60, 90].map(days => (
          <Button key={days} variant={filter === days ? 'default' : 'outline'} size="sm" onClick={() => setFilter(days)}>
            {days}d
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description={`Nenhuma nos últimos ${filter} dias`} />
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card
              key={s.id}
              className={`cursor-pointer card-hover border-l-4 ${s.celula_realizada ? 'border-l-green-500' : 'border-l-destructive'}`}
              onClick={() => onSelect(s)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{s.celula?.name || 'Célula'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(s.data_supervisao), "dd 'de' MMM", { locale: ptBR })} · {s.horario_inicio} - {s.horario_termino}
                    </p>
                  </div>
                  <Badge variant={s.celula_realizada ? 'default' : 'destructive'} className="text-xs">
                    {s.celula_realizada ? 'Realizada' : 'Cancelada'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSupervisao && (
        <SupervisaoDetailsDialog open={!!selectedSupervisao} onOpenChange={(open) => !open && setSelectedSupervisao(null)} supervisao={selectedSupervisao} />
      )}
    </div>
  );
}
