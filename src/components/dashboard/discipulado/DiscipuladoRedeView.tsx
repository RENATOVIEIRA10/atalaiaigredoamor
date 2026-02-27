import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, Calendar, Users, TrendingUp } from 'lucide-react';
import { useDiscipuladoByRede, calcDiscipuladoStats } from '@/hooks/useDiscipulado';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  redeId: string;
}

export function DiscipuladoRedeView({ redeId }: Props) {
  const { data: encontros, isLoading } = useDiscipuladoByRede(redeId);
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const redeCoords = (coordenacoes || []).filter(c => c.rede_id === redeId);
  const redeCelulas = (celulas || []).filter(c => c.rede_id === redeId);
  const globalStats = calcDiscipuladoStats(encontros || []);

  // Group by coordenacao (via celula)
  const coordMap = new Map<string, { name: string; encontros: number; constancia: number; totalCelulas: number; celulasAtivas: number }>();
  for (const coord of redeCoords) {
    const coordCelulas = redeCelulas.filter(c => c.coordenacao_id === coord.id);
    const coordEncontros = (encontros || []).filter(e => coordCelulas.some(c => c.id === e.celula_id));
    const stats = calcDiscipuladoStats(coordEncontros);
    const celulasComEncontro = new Set(coordEncontros.map(e => e.celula_id)).size;

    coordMap.set(coord.id, {
      name: coord.name,
      encontros: stats.totalEncontros,
      constancia: stats.constancia,
      totalCelulas: coordCelulas.length,
      celulasAtivas: celulasComEncontro,
    });
  }

  const celulasComEncontro = new Set((encontros || []).map(e => e.celula_id)).size;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Discipulado — Rede</h2>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <p className="font-semibold text-sm">📖 Impacto da Santidade</p>
          <p className="text-xs text-muted-foreground mt-0.5">Discipulado Anual · Fev–Dez {new Date().getFullYear()}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="Encontros" value={globalStats.totalEncontros} />
        <StatCard icon={TrendingUp} label="Constância" value={`${globalStats.constancia}%`} />
        <StatCard icon={Users} label="Células ativas" value={`${celulasComEncontro}/${redeCelulas.length}`} />
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground">Por Coordenação</h3>

      {redeCoords.length === 0 ? (
        <EmptyState icon={Users} title="Sem coordenações" description="Nenhuma coordenação nesta rede" />
      ) : (
        <div className="space-y-2">
          {Array.from(coordMap.entries()).map(([id, data]) => (
            <Card key={id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{data.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {data.celulasAtivas}/{data.totalCelulas} células
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={data.constancia} className="flex-1 h-2" />
                  <span className="text-xs font-medium w-10 text-right">{data.constancia}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{data.encontros} encontros registrados</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground italic pt-2">
        Discipulado é presença, constância e cuidado.
      </p>
    </div>
  );
}
