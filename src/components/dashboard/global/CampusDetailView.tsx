import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Home, Users, ShieldAlert, Eye,
  BookOpen, Heart, ChevronRight, Loader2
} from 'lucide-react';
import { useCampusRedesDetail, useCampusAlerts, RedeDetail } from '@/hooks/useGlobalKingdomData';

interface Props {
  campoId: string;
  campoNome: string;
  onBack: () => void;
  onSelectRede: (redeId: string, redeNome: string) => void;
  includeSynthetic?: boolean;
}

export function CampusDetailView({ campoId, campoNome, onBack, onSelectRede, includeSynthetic = false }: Props) {
  const { data: redes, isLoading: redesLoading } = useCampusRedesDetail(campoId, includeSynthetic);
  const { data: alerts, isLoading: alertsLoading } = useCampusAlerts(campoId, includeSynthetic);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{campoNome}</h2>
          <p className="text-sm text-muted-foreground">Redes e alertas do campus</p>
        </div>
      </div>

      {/* Alertas */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          ⚠️ Top Alertas do Campus
        </h3>
        {alertsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : alerts && alerts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {alerts.map((alert, i) => (
              <Card key={i} className={alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/20 bg-amber-500/5'}>
                <CardContent className="p-4 flex items-start gap-3">
                  <ShieldAlert className={`h-5 w-5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-amber-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0">{alert.count}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum alerta no momento ✨</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Redes */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          🕸️ Redes do Campus
        </h3>
        {redesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : redes && redes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {redes.map((rede) => (
              <RedeCard key={rede.id} rede={rede} onSelect={onSelectRede} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">Nenhuma rede encontrada para este campus</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function RedeCard({ rede, onSelect }: { rede: RedeDetail; onSelect: (id: string, name: string) => void }) {
  return (
    <Card className="card-hover cursor-pointer group hover:border-primary/30" onClick={() => onSelect(rede.id, rede.name)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{rede.name}</CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5"><Home className="h-3.5 w-3.5" /> Células</span>
          <span className="font-semibold tabular-nums">{rede.celulas_count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Membros</span>
          <span className="font-semibold tabular-nums">{rede.membros_count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Engajamento</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{rede.engajamento_pct}%</span>
            <Badge variant="secondary" className="text-xs">{rede.relatorios_semana}/{rede.celulas_count}</Badge>
          </div>
        </div>
        <Progress value={rede.engajamento_pct} className="h-1.5 mt-1" />
      </CardContent>
    </Card>
  );
}
