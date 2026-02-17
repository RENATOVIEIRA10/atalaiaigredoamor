import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertTriangle, BookOpen, GraduationCap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { usePulsoRede, PulsoRedeData } from '@/hooks/usePulsoRede';
import { CelulaReportStatus } from '@/hooks/usePulsoPastoral';

interface PulsoRedeSectionProps {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
  title?: string;
}

export function PulsoRedeSection({ scopeType, scopeId, title }: PulsoRedeSectionProps) {
  const { data: pulso, isLoading } = usePulsoRede({ scopeType, scopeId });
  const [showAlertCells, setShowAlertCells] = useState(false);

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
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🫀 {label}</h2>
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

      {/* Alert details */}
      {showAlertCells && totalAlertas > 0 && (
        <Card className="mt-4">
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
    </section>
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
