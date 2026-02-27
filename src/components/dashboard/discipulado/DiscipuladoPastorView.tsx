import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, Calendar, TrendingUp, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRedes } from '@/hooks/useRedes';
import { useCelulas } from '@/hooks/useCelulas';
import { calcDiscipuladoStats, DiscipuladoEncontro } from '@/hooks/useDiscipulado';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';

export function DiscipuladoPastorView() {
  const { data: redes } = useRedes();
  const { data: celulas } = useCelulas();

  const { data: allEncontros, isLoading } = useQuery({
    queryKey: ['discipulado-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipulado_encontros')
        .select('id, celula_id, rede_id, data_encontro, realizado, observacao, created_by, created_at, updated_at')
        .order('data_encontro', { ascending: false });
      if (error) throw error;
      return data as DiscipuladoEncontro[];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const globalStats = calcDiscipuladoStats(allEncontros || []);
  const totalCelulas = (celulas || []).length;
  const celulasComEncontro = new Set((allEncontros || []).map(e => e.celula_id)).size;

  // Group by rede
  const redeStats = (redes || []).map(rede => {
    const redeEncontros = (allEncontros || []).filter(e => e.rede_id === rede.id);
    const stats = calcDiscipuladoStats(redeEncontros);
    const redeCelulas = (celulas || []).filter(c => c.rede_id === rede.id);
    const ativas = new Set(redeEncontros.map(e => e.celula_id)).size;
    return { id: rede.id, name: rede.name, ...stats, totalCelulas: redeCelulas.length, celulasAtivas: ativas };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Discipulado — Panorama Pastoral</h2>
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
        <StatCard icon={Globe} label="Cobertura" value={`${celulasComEncontro}/${totalCelulas}`} />
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground">Por Rede</h3>

      {redeStats.length === 0 ? (
        <EmptyState icon={Globe} title="Nenhuma rede" description="Nenhuma rede cadastrada" />
      ) : (
        <div className="space-y-2">
          {redeStats.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{r.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {r.celulasAtivas}/{r.totalCelulas} células
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={r.constancia} className="flex-1 h-2" />
                  <span className="text-xs font-medium w-10 text-right">{r.constancia}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{r.totalEncontros} encontros</p>
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
