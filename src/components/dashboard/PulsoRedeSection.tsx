import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, AlertTriangle, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, Loader2, Church, Heart, ArrowLeft, MapPin, FolderTree,
} from 'lucide-react';
import { usePulsoRede } from '@/hooks/usePulsoRede';
import { CelulaAlertaStatus as CelulaReportStatus } from '@/hooks/usePulsoEngine';
import { AniversariantesSemanaCard } from './AniversariantesSemanaCard';
import { useMarcoDrilldown, type MarcoType, type MarcoDrilldownMember } from '@/hooks/useMarcoDrilldown';
import { useDemoScope } from '@/hooks/useDemoScope';

interface PulsoRedeSectionProps {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
  title?: string;
}

const MARCO_LABELS: Record<MarcoType, string> = {
  encontro_com_deus: 'Encontro c/ Deus',
  batismo: 'Batismo',
  is_discipulado: 'Discipulado',
  curso_lidere: 'Curso Lidere',
  renovo: 'Renovo',
  is_lider_em_treinamento: 'Líder em Treinamento',
};

export function PulsoRedeSection({ scopeType, scopeId, title }: PulsoRedeSectionProps) {
  const { data: pulso, isLoading } = usePulsoRede({ scopeType, scopeId });
  const [showAlertCells, setShowAlertCells] = useState(false);
  const [showStagnantMembers, setShowStagnantMembers] = useState(false);
  const [activeDrilldown, setActiveDrilldown] = useState<MarcoType | null>(null);
  const { campoId } = useDemoScope();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!pulso) return null;

  const engajamentoDiff = pulso.percentualEngajamento - pulso.percentualSemanaAnterior;
  const totalAlertas = pulso.celulasAlerta1Semana.length + pulso.celulasAlerta2Semanas.length + pulso.celulasAlerta3Semanas.length;
  const label = title || (scopeType === 'coordenacao' ? 'Pulso da Coordenação' : 'Pulso da Rede');
  const scopeLabel = scopeType === 'coordenacao' ? 'na coordenação' : 'na rede';

  // If drilldown is active, show the drilldown panel
  if (activeDrilldown) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">🫀 {label}</h2>
        <MarcoDrilldownPanel
          scopeType={scopeType}
          scopeId={scopeId}
          marcoType={activeDrilldown}
          campoId={campoId}
          onClose={() => setActiveDrilldown(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">🫀 {label}</h2>

      {/* Grid principal */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Engajamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Engajamento das Células
            </CardTitle>
            <CardDescription>Relatórios enviados esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold text-primary">{pulso.percentualEngajamento}%</span>
              <span className="text-sm text-muted-foreground mb-1">
                ({pulso.celulasComRelatorio} de {pulso.totalCelulas})
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mb-2">
              <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${pulso.percentualEngajamento}%` }} />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {engajamentoDiff >= 0 ? (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                  ↑ +{engajamentoDiff}pp vs semana anterior
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                  ↓ {engajamentoDiff}pp vs semana anterior
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className={totalAlertas > 0 ? 'border-amber-500/30' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Relatórios Pendentes
            </CardTitle>
            <CardDescription>Células sem envio de relatório</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-sm">🟢 1 semana</span>
              <Badge variant="secondary">{pulso.celulasAlerta1Semana.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5">
              <span className="text-sm">🟡 2 semanas</span>
              <Badge variant="outline" className="border-amber-500/50 text-amber-600">{pulso.celulasAlerta2Semanas.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
              <span className="text-sm">🔴 3+ semanas</span>
              <Badge variant="outline" className="border-destructive/50 text-destructive">{pulso.celulasAlerta3Semanas.length}</Badge>
            </div>
            {totalAlertas > 0 && (
              <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => setShowAlertCells(!showAlertCells)}>
                {showAlertCells ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {showAlertCells ? 'Ocultar detalhes' : 'Ver células pendentes'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Discipulado — clicável */}
        <Card
          className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
          onClick={() => setActiveDrilldown('is_discipulado')}
          role="button"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Caminho do Discipulado
            </CardTitle>
            <CardDescription>Discipulados ativos {scopeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-primary">{pulso.totalDiscipulados}</span>
              <span className="text-sm text-muted-foreground mb-1">discipulados ativos</span>
            </div>
          </CardContent>
        </Card>

        {/* Liderança — clicável */}
        <Card
          className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
          onClick={() => setActiveDrilldown('is_lider_em_treinamento')}
          role="button"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Movimento de Liderança
            </CardTitle>
            <CardDescription>Futuros líderes em formação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-primary">{pulso.lideresEmTreinamento}</span>
              <span className="text-sm text-muted-foreground mb-1">líderes em treinamento</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes alertas */}
      {showAlertCells && totalAlertas > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Detalhes – Células sem Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {pulso.celulasAlerta3Semanas.length > 0 && (
                  <AlertCellGroup label="🔴 3+ semanas sem relatório" cells={pulso.celulasAlerta3Semanas} />
                )}
                {pulso.celulasAlerta2Semanas.length > 0 && (
                  <AlertCellGroup label="🟡 2 semanas sem relatório" cells={pulso.celulasAlerta2Semanas} />
                )}
                {pulso.celulasAlerta1Semana.length > 0 && (
                  <AlertCellGroup label="🟢 1 semana sem relatório" cells={pulso.celulasAlerta1Semana} />
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Marcos Espirituais — clicáveis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Church className="h-4 w-4 text-primary" />
            Marcos Espirituais
          </CardTitle>
          <CardDescription>Crescimento espiritual real do rebanho — clique para ver detalhes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MarcoCard label="Encontro c/ Deus" value={pulso.marcosEncontro} icon="🔥" onClick={() => setActiveDrilldown('encontro_com_deus')} />
            <MarcoCard label="Batismo" value={pulso.marcosBatismo} icon="💧" onClick={() => setActiveDrilldown('batismo')} />
            <MarcoCard label="Discipulado" value={pulso.marcosDiscipulado} icon="📖" onClick={() => setActiveDrilldown('is_discipulado')} />
            <MarcoCard label="Curso Lidere" value={pulso.marcosCursoLidere} icon="🎓" onClick={() => setActiveDrilldown('curso_lidere')} />
            <MarcoCard label="Renovo" value={pulso.marcosRenovo} icon="🌿" onClick={() => setActiveDrilldown('renovo')} />
            <MarcoCard label="Líder em Treinamento" value={pulso.marcosLiderEmTreinamento} icon="⭐" onClick={() => setActiveDrilldown('is_lider_em_treinamento')} />
          </div>
        </CardContent>
      </Card>

      {/* Atenção Pastoral - Estagnação */}
      {pulso.stagnantCount > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Atenção Pastoral</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Há <strong>{pulso.stagnantCount} pessoa(s)</strong> com mais de 2 anos de igreja
                  que ainda não avançaram em marcos espirituais básicos (Encontro com Deus, Batismo ou Curso Lidere).
                </p>
                {pulso.stagnantMembers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs text-amber-700 hover:bg-amber-500/10"
                    onClick={() => setShowStagnantMembers(!showStagnantMembers)}
                  >
                    {showStagnantMembers ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    {showStagnantMembers ? 'Ocultar membros' : `Ver ${pulso.stagnantMembers.length} membro(s)`}
                  </Button>
                )}
              </div>
            </div>
            {showStagnantMembers && pulso.stagnantMembers.length > 0 && (
              <ScrollArea className="mt-3 h-56">
                <div className="space-y-2 pr-2">
                  {pulso.stagnantMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-background/60 border border-amber-500/10">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-amber-500/10 text-amber-700">{m.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.celula_name}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs border-amber-500/30 text-amber-700">
                        Sem marcos básicos
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aniversários da semana – com botão WhatsApp */}
      <AniversariantesSemanaCard scopeType={scopeType} scopeId={scopeId} />
    </div>
  );
}

// ─── Drilldown Panel ──────────────────────────────────────────────────────────

function MarcoDrilldownPanel({
  scopeType, scopeId, marcoType, campoId, onClose,
}: {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
  marcoType: MarcoType;
  campoId?: string | null;
  onClose: () => void;
}) {
  const { data: members, isLoading } = useMarcoDrilldown({ scopeType, scopeId, marcoType, campoId });
  const title = MARCO_LABELS[marcoType];

  // Group by coordenação
  const grouped = (members || []).reduce<Record<string, MarcoDrilldownMember[]>>((acc, m) => {
    const key = m.coordenacao_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando...' : `${members?.length ?? 0} pessoa(s) encontrada(s)`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        )}

        {!isLoading && !members?.length && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pessoa encontrada com este marco</p>
        )}

        {!isLoading && sortedGroups.length > 0 && (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-5 pr-2">
              {sortedGroups.map(([coordName, groupMembers]) => (
                <div key={coordName}>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderTree className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{coordName}</span>
                    <Badge variant="secondary" className="text-[10px] h-4">{groupMembers.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {groupMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/30 transition-colors hover:bg-muted/50">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={m.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{m.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {m.celula_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlertCellGroup({ label, cells }: { label: string; cells: CelulaReportStatus[] }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2">{label}</p>
      <div className="space-y-1">
        {cells.map(c => (
          <div key={c.celula_id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/30">
            <span>{c.celula_name}</span>
            <span className="text-xs text-muted-foreground">{c.coordenacao_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarcoCard({ label, value, icon, onClick }: { label: string; value: number; icon: string; onClick?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40 border border-border/50 text-center gap-1 cursor-pointer transition-all hover:border-primary/40 hover:bg-muted/60 hover:shadow-sm active:scale-[0.97]"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}
