import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Cake, Zap, Clock, CheckCircle, AlertTriangle, ChevronRight, Heart, History, Settings2, BookOpen, Sprout, HeartPulse, Loader2 } from 'lucide-react';
import { SkPWA } from '@/components/ui/skeleton';
import { useCelulas } from '@/hooks/useCelulas';
import { useWeeklyReports, getCurrentWeekStart } from '@/hooks/useWeeklyReports';
import { useMembers } from '@/hooks/useMembers';
import { useNovasVidasByCelula } from '@/hooks/useNovasVidas';
import { useRole } from '@/contexts/RoleContext';
import { CelulaDetailsDialog } from '../CelulaDetailsDialog';
import { CellLeaderMembrosTab } from '../cellleader/CellLeaderMembrosTab';
import { CellLeaderPulsoTab } from '../cellleader/CellLeaderPulsoTab';
import { CellLeaderNovasVidasTab } from '../cellleader/CellLeaderNovasVidasTab';
import { CellProfilePWA } from '../cellleader/CellProfilePWA';
import { DiscipuladoCellLeaderTab } from '../discipulado/DiscipuladoCellLeaderTab';
import { MissionVerse } from '../MissionVerse';
import { MissionBlock } from '@/components/dashboard/MissionBlock';
import { EmptyState } from '@/components/ui/empty-state';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CellLeaderPWADashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inicio';
  const { scopeId } = useRole();
  const { data: celulas, isLoading: celulasLoading } = useCelulas();
  const celula = (celulas || []).find(c => c.id === scopeId) || (celulas || [])[0];
  const celulaId = celula?.id || '';

  const { data: reports, isLoading: reportsLoading } = useWeeklyReports(celulaId);
  const { data: members } = useMembers(celulaId);
  const { data: novasVidas } = useNovasVidasByCelula(celulaId);

  const [celulaDialogOpen, setCelulaDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<number>(30);

  if (celulasLoading) {
    return <SkPWA />;
  }

  if (!celula) {
    return <EmptyState icon={Users} title="Nenhuma célula vinculada" description="Você ainda não está vinculado a uma célula." />;
  }

  const currentWeekStart = getCurrentWeekStart();
  const thisWeekReport = (reports || []).find(r => r.week_start === currentWeekStart);
  const lastReport = (reports || []).length > 0 ? (reports || [])[0] : null;
  const activeMembers = (members || []).filter(m => m.is_active);
  const activeNovasVidas = (novasVidas || []).filter(v => !['nao_convertida'].includes(v.status));

  const coupleName = celula.leadership_couple
    ? `${celula.leadership_couple.spouse1?.name?.split(' ')[0] || ''} & ${celula.leadership_couple.spouse2?.name?.split(' ')[0] || ''}`
    : '';

  if (activeTab === 'acoes') return <AcoesTab celulaId={celulaId} celulaName={celula.name} coupleNames={coupleName} onOpenReport={() => setCelulaDialogOpen(true)} novasVidasCount={activeNovasVidas.length} />;
  if (activeTab === 'historico') return <HistoricoTab celulaId={celulaId} reports={reports || []} isLoading={reportsLoading} filter={reportFilter} setFilter={setReportFilter} />;

  // ── Início tab — 3 blocos pastorais ──
  return (
    <div className="space-y-5">
      {/* Cell + leader card */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
            {celula.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">{celula.name}</h2>
            {coupleName && <p className="text-sm text-muted-foreground">👫 {coupleName}</p>}
          </div>
        </CardContent>
      </Card>

      <MissionVerse role="celula_leader" />

      {/* ── BLOCO 1 — O que precisa da minha atenção ── */}
      <MissionBlock icon={AlertTriangle} title="O que precisa da minha atenção">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              {thisWeekReport ? (
                <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500 mb-1" />
              )}
              <span className="text-xs text-muted-foreground">Relatório da semana</span>
              <Badge variant={thisWeekReport ? 'default' : 'secondary'} className="text-xs mt-0.5">
                {thisWeekReport ? 'Enviado ✓' : 'Pendente'}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Clock className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Último envio</span>
              <span className="text-sm font-semibold mt-0.5">
                {lastReport?.meeting_date
                  ? format(parseISO(lastReport.meeting_date), 'dd/MM', { locale: ptBR })
                  : lastReport?.week_start
                    ? format(parseISO(lastReport.week_start), 'dd/MM', { locale: ptBR })
                    : '—'}
              </span>
            </CardContent>
          </Card>
        </div>

        {activeNovasVidas.length > 0 && (
          <Card
            className="border-primary/30 cursor-pointer card-hover active:scale-[0.98] transition-all"
            onClick={() => setSearchParams({ tab: 'acoes', view: 'novas-vidas' })}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Vidas Aguardando Contato</h3>
                <p className="text-xs text-muted-foreground">{activeNovasVidas.length} vida{activeNovasVidas.length > 1 ? 's' : ''} encaminhada{activeNovasVidas.length > 1 ? 's' : ''}</p>
              </div>
              <Badge className="shrink-0">{activeNovasVidas.length}</Badge>
            </CardContent>
          </Card>
        )}

        {/* Primary CTA */}
        {!thisWeekReport && (
          <Button
            className="w-full h-14 text-base font-semibold"
            onClick={() => setCelulaDialogOpen(true)}
          >
            <FileText className="h-5 w-5 mr-2" />
            Fazer Relatório da Semana
          </Button>
        )}
      </MissionBlock>

      {/* ── BLOCO 2 — Movimento do Reino ── */}
      <MissionBlock icon={Sprout} title="Movimento do Reino">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Users className="h-4 w-4 text-primary mb-1" />
              <span className="text-xs text-muted-foreground">Membros ativos</span>
              <span className="text-lg font-bold">{activeMembers.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Heart className="h-4 w-4 text-primary mb-1" />
              <span className="text-xs text-muted-foreground">Novas vidas</span>
              <span className="text-lg font-bold">{activeNovasVidas.length}</span>
            </CardContent>
          </Card>
        </div>
      </MissionBlock>

      {/* ── BLOCO 3 — Saúde e Cuidado ── */}
      <MissionBlock icon={HeartPulse} title="Saúde e Cuidado">
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => setSearchParams({ tab: 'acoes' })}
        >
          <Users className="h-4 w-4 mr-2" />
          Ver membros e aniversariantes
        </Button>
      </MissionBlock>

      {celulaDialogOpen && (
        <CelulaDetailsDialog
          open={celulaDialogOpen}
          onOpenChange={setCelulaDialogOpen}
          celulaId={celulaId}
          celulaName={celula.name}
        />
      )}
    </div>
  );
}

/* ── Aba Ações — reagrupada nos 3 blocos ── */
function AcoesTab({ celulaId, celulaName, coupleNames, onOpenReport, novasVidasCount }: {
  celulaId: string; celulaName: string; coupleNames?: string; onOpenReport: () => void; novasVidasCount: number;
}) {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view');
  const [showMembers, setShowMembers] = useState(initialView === 'membros');
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [showNovasVidas, setShowNovasVidas] = useState(initialView === 'novas-vidas');
  const [showCellProfile, setShowCellProfile] = useState(false);
  const [showDiscipulado, setShowDiscipulado] = useState(initialView === 'discipulado');
  const [celulaDialogOpen, setCelulaDialogOpen] = useState(initialView === 'relatorio');

  if (showCellProfile) {
    return <CellProfilePWA celulaId={celulaId} onBack={() => setShowCellProfile(false)} />;
  }

  if (showDiscipulado) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDiscipulado(false)} className="flex items-center justify-center h-11 w-11 rounded-xl active:bg-accent/60 touch-manipulation transition-colors">
            <ChevronRight className="h-5 w-5 rotate-180 text-foreground" />
          </button>
          <h2 className="text-lg font-semibold">Discipulado</h2>
        </div>
        <DiscipuladoCellLeaderTab celulaId={celulaId} celulaName={celulaName} redeId={undefined} />
      </div>
    );
  }

  if (showMembers) {
    return <CellLeaderMembrosTab celulaId={celulaId} celulaName={celulaName} />;
  }

  if (showBirthdays) {
    return <CellLeaderPulsoTab celulaId={celulaId} />;
  }

  if (showNovasVidas) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNovasVidas(false)} className="flex items-center justify-center h-11 w-11 rounded-xl active:bg-accent/60 touch-manipulation transition-colors">
            <ChevronRight className="h-5 w-5 rotate-180 text-foreground" />
          </button>
          <h2 className="text-lg font-semibold">Novas Vidas Recebidas</h2>
        </div>
        <CellLeaderNovasVidasTab celulaId={celulaId} celulaName={celulaName} coupleNames={coupleNames} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── BLOCO 1 — Atenção ── */}
      <MissionBlock icon={AlertTriangle} title="O que precisa da minha atenção">
        {novasVidasCount > 0 && (
          <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all border-primary/30" onClick={() => setShowNovasVidas(true)}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Vidas Aguardando Contato</h3>
                <p className="text-xs text-muted-foreground">{novasVidasCount} aguardando acompanhamento</p>
              </div>
              <Badge className="shrink-0">{novasVidasCount}</Badge>
            </CardContent>
          </Card>
        )}

        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setCelulaDialogOpen(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Fazer Relatório</h3>
              <p className="text-xs text-muted-foreground">Preencher e enviar no WhatsApp</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </MissionBlock>

      {/* ── BLOCO 2 — Movimento ── */}
      <MissionBlock icon={Sprout} title="Movimento do Reino">
        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setShowMembers(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Membros da Célula</h3>
              <p className="text-xs text-muted-foreground">Ver, adicionar e editar membros</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </MissionBlock>

      {/* ── BLOCO 3 — Saúde e Cuidado ── */}
      <MissionBlock icon={HeartPulse} title="Saúde e Cuidado">
        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setShowBirthdays(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Cake className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Aniversariantes</h3>
              <p className="text-xs text-muted-foreground">Da semana + enviar parabéns</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setShowDiscipulado(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Discipulado</h3>
              <p className="text-xs text-muted-foreground">Registrar encontros mensais</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer card-hover active:scale-[0.98] transition-all" onClick={() => setShowCellProfile(true)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Configurar Minha Célula</h3>
              <p className="text-xs text-muted-foreground">Perfil, tipo, bairro e horário</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </MissionBlock>

      {celulaDialogOpen && (
        <CelulaDetailsDialog
          open={celulaDialogOpen}
          onOpenChange={setCelulaDialogOpen}
          celulaId={celulaId}
          celulaName={celulaName}
        />
      )}
    </div>
  );
}

/* ── Aba Histórico ── */
interface HistoricoTabProps {
  celulaId: string;
  reports: any[];
  isLoading: boolean;
  filter: number;
  setFilter: (n: number) => void;
}

function HistoricoTab({ celulaId, reports, isLoading, filter, setFilter }: HistoricoTabProps) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - filter);

  const filtered = reports.filter(r => {
    const d = r.meeting_date || r.week_start;
    return new Date(d) >= cutoff;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Relatórios</h2>
      </div>

      {/* Period filter */}
      <div className="flex gap-2">
        {[30, 60, 90].map(days => (
          <Button
            key={days}
            variant={filter === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(days)}
          >
            {days}d
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum relatório" description={`Nenhum relatório nos últimos ${filter} dias`} />
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {r.meeting_date
                        ? format(parseISO(r.meeting_date), "dd 'de' MMM", { locale: ptBR })
                        : format(parseISO(r.week_start), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>{r.members_present} presentes</span>
                      <span>{r.visitors} visitantes</span>
                      <span>{r.children} crianças</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {r.members_present + r.visitors + r.children} total
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
