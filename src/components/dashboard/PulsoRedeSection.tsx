import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Activity, AlertTriangle, BookOpen, GraduationCap,
  ChevronDown, ChevronUp, Loader2, Church, Heart,
} from 'lucide-react';
import { usePulsoRede } from '@/hooks/usePulsoRede';
import { CelulaAlertaStatus as CelulaReportStatus } from '@/hooks/usePulsoEngine';
import { AniversariantesSemanaCard } from './AniversariantesSemanaCard';

interface PulsoRedeSectionProps {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
  title?: string;
}

export function PulsoRedeSection({ scopeType, scopeId, title }: PulsoRedeSectionProps) {
  const { data: pulso, isLoading } = usePulsoRede({ scopeType, scopeId });
  const [showAlertCells, setShowAlertCells] = useState(false);
  const [showStagnantMembers, setShowStagnantMembers] = useState(false);

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
              Células em Alerta
            </CardTitle>
            <CardDescription>Sem envio de relatório</CardDescription>
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
                {showAlertCells ? 'Ocultar detalhes' : 'Ver células em risco'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Discipulado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Movimento de Discipulado
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

        {/* Liderança */}
        <Card>
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
            <ScrollArea className="max-h-64">
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

      {/* Marcos Espirituais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Church className="h-4 w-4 text-primary" />
            Marcos Espirituais
          </CardTitle>
          <CardDescription>Crescimento espiritual real do rebanho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MarcoCard label="Encontro c/ Deus" value={pulso.marcosEncontro} icon="🔥" />
            <MarcoCard label="Batismo" value={pulso.marcosBatismo} icon="💧" />
            <MarcoCard label="Discipulado" value={pulso.marcosDiscipulado} icon="📖" />
            <MarcoCard label="Curso Lidere" value={pulso.marcosCursoLidere} icon="🎓" />
            <MarcoCard label="Renovo" value={pulso.marcosRenovo} icon="🌿" />
            <MarcoCard label="Líder em Treinamento" value={pulso.marcosLiderEmTreinamento} icon="⭐" />
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
              <ScrollArea className="mt-3 max-h-56">
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

function MarcoCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40 border border-border/50 text-center gap-1">
      <span className="text-xl">{icon}</span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}
