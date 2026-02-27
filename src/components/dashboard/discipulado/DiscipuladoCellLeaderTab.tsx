import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Plus, Calendar, Users, ChevronRight } from 'lucide-react';
import { useDiscipuladoEncontros, useDiscipuladoPresencas, calcDiscipuladoStats } from '@/hooks/useDiscipulado';
import { DiscipuladoEncontroForm } from './DiscipuladoEncontroForm';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  celulaId: string;
  celulaName?: string;
  redeId?: string | null;
}

export function DiscipuladoCellLeaderTab({ celulaId, celulaName, redeId }: Props) {
  const { data: encontros, isLoading } = useDiscipuladoEncontros(celulaId);
  const [showForm, setShowForm] = useState(false);
  const [selectedEncontro, setSelectedEncontro] = useState<string | null>(null);

  if (showForm) {
    return (
      <DiscipuladoEncontroForm
        nivel="celula"
        celulaId={celulaId}
        redeId={redeId}
        onBack={() => setShowForm(false)}
      />
    );
  }

  if (selectedEncontro) {
    return <EncontroDetail encontroId={selectedEncontro} onBack={() => setSelectedEncontro(null)} />;
  }

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const stats = calcDiscipuladoStats(encontros || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Discipulado</h2>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <p className="font-semibold text-sm">📖 Impacto da Santidade</p>
          <p className="text-xs text-muted-foreground mt-0.5">Discipulado Anual · Fev–Dez {new Date().getFullYear()}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Calendar} label="Encontros" value={stats.totalEncontros} />
        <StatCard icon={Users} label="Constância" value={`${stats.constancia}%`} />
      </div>

      <Button className="w-full h-14 text-base font-semibold" onClick={() => setShowForm(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Registrar Encontro
      </Button>

      <h3 className="text-sm font-semibold text-muted-foreground">Histórico</h3>
      {!encontros?.length ? (
        <EmptyState icon={BookOpen} title="Nenhum encontro" description="Registre o primeiro encontro de discipulado" />
      ) : (
        <div className="space-y-2">
          {encontros.map(e => (
            <Card
              key={e.id}
              className={`cursor-pointer active:scale-[0.98] transition-all border-l-4 ${e.realizado ? 'border-l-green-500' : 'border-l-amber-500'}`}
              onClick={() => setSelectedEncontro(e.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{format(parseISO(e.data_encontro), "dd 'de' MMMM", { locale: ptBR })}</p>
                  {e.observacao && <p className="text-xs text-muted-foreground truncate mt-0.5">{e.observacao}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={e.realizado ? 'default' : 'outline'} className="text-xs">
                    {e.realizado ? 'Realizado' : 'Não realizado'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground italic pt-2">Discipulado é presença, constância e cuidado.</p>
    </div>
  );
}

function EncontroDetail({ encontroId, onBack }: { encontroId: string; onBack: () => void }) {
  const { data: presencas, isLoading } = useDiscipuladoPresencas(encontroId);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 h-11 touch-manipulation">← Voltar</Button>
      <h3 className="text-sm font-semibold text-muted-foreground">Presenças do Encontro</h3>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !presencas?.length ? (
        <EmptyState icon={Users} title="Sem registros" description="Nenhuma presença registrada" />
      ) : (
        <div className="space-y-1">
          {presencas.map(p => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm">{(p.member_id || p.profile_id || '').slice(0, 8)}...</span>
                <Badge variant={p.presente ? 'default' : 'secondary'} className="text-xs">
                  {p.presente ? '✓ Presente' : 'Ausente'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
