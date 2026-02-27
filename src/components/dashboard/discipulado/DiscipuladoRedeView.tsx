import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Calendar, Users, TrendingUp, Plus } from 'lucide-react';
import { useDiscipuladoByRede, useDiscipuladoEncontrosRede, calcDiscipuladoStats } from '@/hooks/useDiscipulado';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { DiscipuladoEncontroForm } from './DiscipuladoEncontroForm';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  redeId: string;
}

export function DiscipuladoRedeView({ redeId }: Props) {
  const [activeTab, setActiveTab] = useState('meu-discipulado');

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="meu-discipulado" className="flex-1 text-xs">Meu Discipulado</TabsTrigger>
          <TabsTrigger value="visao-geral" className="flex-1 text-xs">Visão Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="meu-discipulado">
          <RedeOwnDiscipulado redeId={redeId} />
        </TabsContent>

        <TabsContent value="visao-geral">
          <RedeOverview redeId={redeId} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground italic pt-2">Discipulado é presença, constância e cuidado.</p>
    </div>
  );
}

// ── Tab 1: Líder de rede discipulando coordenadores ──
function RedeOwnDiscipulado({ redeId }: { redeId: string }) {
  const { data: encontros, isLoading } = useDiscipuladoEncontrosRede(redeId);
  const { data: coordenacoes } = useCoordenacoes();
  const [showForm, setShowForm] = useState(false);

  const redeCoords = (coordenacoes || []).filter(c => c.rede_id === redeId);

  // Build participant list from coordinators
  type ProfileParticipant = { id: string; name: string; avatar_url: string | null; type: 'profile' };
  const participants: ProfileParticipant[] = [];
  for (const c of redeCoords) {
    if (!c.leadership_couple) continue;
    const couple = c.leadership_couple;
    if (couple.spouse1 && !participants.some(p => p.id === couple.spouse1!.id)) {
      participants.push({ id: couple.spouse1.id, name: couple.spouse1.name || 'Coord.', avatar_url: couple.spouse1.avatar_url, type: 'profile' });
    }
    if (couple.spouse2 && !participants.some(p => p.id === couple.spouse2!.id)) {
      participants.push({ id: couple.spouse2.id, name: couple.spouse2.name || 'Coord.', avatar_url: couple.spouse2.avatar_url, type: 'profile' });
    }
  }

  if (showForm) {
    return (
      <DiscipuladoEncontroForm
        nivel="rede"
        redeId={redeId}
        participants={participants}
        onBack={() => setShowForm(false)}
      />
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const stats = calcDiscipuladoStats(encontros || []);

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Calendar} label="Encontros" value={stats.totalEncontros} />
        <StatCard icon={Users} label="Constância" value={`${stats.constancia}%`} />
      </div>

      <Button className="w-full h-14 text-base font-semibold" onClick={() => setShowForm(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Registrar Encontro com Coordenadores
      </Button>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Coordenadores ({participants.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          {participants.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{p.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{p.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <h3 className="text-sm font-semibold text-muted-foreground">Histórico</h3>
      {!encontros?.length ? (
        <EmptyState icon={BookOpen} title="Nenhum encontro" description="Registre o primeiro encontro com seus coordenadores" />
      ) : (
        <div className="space-y-2">
          {encontros.map(e => (
            <Card key={e.id} className={`border-l-4 ${e.realizado ? 'border-l-green-500' : 'border-l-amber-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{format(parseISO(e.data_encontro), "dd 'de' MMMM", { locale: ptBR })}</p>
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

// ── Tab 2: Visão consolidada das células por coordenação ──
function RedeOverview({ redeId }: { redeId: string }) {
  const { data: encontros, isLoading } = useDiscipuladoByRede(redeId);
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const redeCoords = (coordenacoes || []).filter(c => c.rede_id === redeId);
  const redeCelulas = (celulas || []).filter(c => c.rede_id === redeId);
  const globalStats = calcDiscipuladoStats(encontros || []);

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
    <div className="space-y-4 mt-4">
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
                  <span className="text-xs text-muted-foreground">{data.celulasAtivas}/{data.totalCelulas} células</span>
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
    </div>
  );
}
