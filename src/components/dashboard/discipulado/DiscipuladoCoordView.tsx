import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, BookOpen, Users, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { useDiscipuladoByCoordenacao, useDiscipuladoPresencas, calcDiscipuladoStats } from '@/hooks/useDiscipulado';
import { useCelulas } from '@/hooks/useCelulas';
import { useMembers } from '@/hooks/useMembers';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  coordId: string;
}

export function DiscipuladoCoordView({ coordId }: Props) {
  const { data: encontros, isLoading } = useDiscipuladoByCoordenacao(coordId);
  const { data: celulas } = useCelulas();
  const [selectedCelula, setSelectedCelula] = useState<string | null>(null);

  const coordCelulas = (celulas || []).filter(c => c.coordenacao_id === coordId);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (selectedCelula) {
    const cel = coordCelulas.find(c => c.id === selectedCelula);
    return (
      <CelulaDiscipuladoDetail
        celulaId={selectedCelula}
        celulaName={cel?.name || 'Célula'}
        encontros={(encontros || []).filter(e => e.celula_id === selectedCelula)}
        onBack={() => setSelectedCelula(null)}
      />
    );
  }

  // Group by celula
  const celulasMap = new Map<string, typeof encontros>();
  for (const e of encontros || []) {
    const arr = celulasMap.get(e.celula_id) || [];
    arr.push(e);
    celulasMap.set(e.celula_id, arr);
  }

  const globalStats = calcDiscipuladoStats(encontros || []);
  const celulasComEncontro = celulasMap.size;
  const celulasSemEncontro = coordCelulas.length - celulasComEncontro;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Discipulado — Coordenação</h2>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <p className="font-semibold text-sm">📖 Impacto da Santidade</p>
          <p className="text-xs text-muted-foreground mt-0.5">Discipulado Anual · Fev–Dez {new Date().getFullYear()}</p>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="Encontros" value={globalStats.totalEncontros} />
        <StatCard icon={Users} label="Constância" value={`${globalStats.constancia}%`} />
        <StatCard
          icon={BookOpen}
          label="Sem registro"
          value={celulasSemEncontro}
          className={celulasSemEncontro > 0 ? 'border-amber-500/30' : ''}
        />
      </div>

      {/* Cells list */}
      <h3 className="text-sm font-semibold text-muted-foreground">Células</h3>
      {coordCelulas.length === 0 ? (
        <EmptyState icon={Users} title="Nenhuma célula" description="Nenhuma célula nesta coordenação" />
      ) : (
        <div className="space-y-2">
          {coordCelulas.map(cel => {
            const celEncontros = celulasMap.get(cel.id) || [];
            const celStats = calcDiscipuladoStats(celEncontros);
            return (
              <Card
                key={cel.id}
                className="cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setSelectedCelula(cel.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{cel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {celStats.totalEncontros} encontros · {celStats.constancia}% constância
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Progress value={celStats.constancia} className="w-16 h-2" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground italic pt-2">
        Discipulado é presença, constância e cuidado.
      </p>
    </div>
  );
}

// ── Detail: encontros + membros de uma célula ──
function CelulaDiscipuladoDetail({ celulaId, celulaName, encontros, onBack }: {
  celulaId: string;
  celulaName: string;
  encontros: any[];
  onBack: () => void;
}) {
  const { data: members } = useMembers(celulaId);
  const activeMembers = (members || []).filter(m => m.is_active);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 h-11 touch-manipulation">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <h2 className="text-lg font-semibold">{celulaName} — Discipulado</h2>

      {/* Members with personal data */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Membros ({activeMembers.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {activeMembers.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={m.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{m.profile?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.profile?.birth_date
                    ? format(parseISO(m.profile.birth_date), "dd/MM/yyyy")
                    : 'Sem data nasc.'}
                  {m.profile?.joined_church_at && ` · Igreja desde ${format(parseISO(m.profile.joined_church_at), 'MMM/yyyy', { locale: ptBR })}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {m.batismo && <Badge variant="outline" className="text-[10px] px-1">Bat</Badge>}
                {m.encontro_com_deus && <Badge variant="outline" className="text-[10px] px-1">EcD</Badge>}
                {m.is_discipulado && <Badge variant="outline" className="text-[10px] px-1">Disc</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Encounter history */}
      <h3 className="text-sm font-semibold text-muted-foreground">Encontros ({encontros.length})</h3>
      {encontros.length === 0 ? (
        <EmptyState icon={BookOpen} title="Sem encontros" description="Nenhum encontro registrado" />
      ) : (
        <div className="space-y-2">
          {encontros.map(e => (
            <Card key={e.id} className={`border-l-4 ${e.realizado ? 'border-l-green-500' : 'border-l-amber-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {format(parseISO(e.data_encontro), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <Badge variant={e.realizado ? 'default' : 'outline'} className="text-xs">
                    {e.realizado ? 'Realizado' : 'Não realizado'}
                  </Badge>
                </div>
                {e.observacao && <p className="text-xs text-muted-foreground mt-1">{e.observacao}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
