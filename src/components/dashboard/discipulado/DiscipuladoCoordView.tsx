import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Users, Calendar, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { useDiscipuladoByCoordenacao, useDiscipuladoEncontrosCoord, useDiscipuladoPresencas, calcDiscipuladoStats } from '@/hooks/useDiscipulado';
import { useCelulas } from '@/hooks/useCelulas';
import { useMembers } from '@/hooks/useMembers';
import { DiscipuladoEncontroForm } from './DiscipuladoEncontroForm';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  coordId: string;
  redeId?: string | null;
}

export function DiscipuladoCoordView({ coordId, redeId }: Props) {
  const [activeTab, setActiveTab] = useState('meu-discipulado');

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="meu-discipulado" className="flex-1 text-xs">Meu Discipulado</TabsTrigger>
          <TabsTrigger value="celulas" className="flex-1 text-xs">Células</TabsTrigger>
        </TabsList>

        <TabsContent value="meu-discipulado">
          <CoordOwnDiscipulado coordId={coordId} redeId={redeId} />
        </TabsContent>

        <TabsContent value="celulas">
          <CoordCelulasOverview coordId={coordId} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground italic pt-2">Discipulado é presença, constância e cuidado.</p>
    </div>
  );
}

// ── Tab 1: Coordenador discipulando líderes de célula ──
function CoordOwnDiscipulado({ coordId, redeId }: { coordId: string; redeId?: string | null }) {
  const { data: encontros, isLoading } = useDiscipuladoEncontrosCoord(coordId);
  const { data: celulas } = useCelulas();
  const [showForm, setShowForm] = useState(false);

  const coordCelulas = (celulas || []).filter(c => c.coordenacao_id === coordId);

  // Build participant list from cell leaders
  type ProfileParticipant = { id: string; name: string; avatar_url: string | null; type: 'profile' };
  const participants: ProfileParticipant[] = [];
  for (const c of coordCelulas) {
    if (!c.leadership_couple) continue;
    const couple = c.leadership_couple;
    if (couple.spouse1 && !participants.some(p => p.id === couple.spouse1!.id)) {
      participants.push({ id: couple.spouse1.id, name: couple.spouse1.name || 'Líder', avatar_url: couple.spouse1.avatar_url, type: 'profile' });
    }
    if (couple.spouse2 && !participants.some(p => p.id === couple.spouse2!.id)) {
      participants.push({ id: couple.spouse2.id, name: couple.spouse2.name || 'Líder', avatar_url: couple.spouse2.avatar_url, type: 'profile' });
    }
  }

  if (showForm) {
    return (
      <DiscipuladoEncontroForm
        nivel="coordenacao"
        coordenacaoId={coordId}
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
        Registrar Encontro com Líderes
      </Button>

      {/* Participants overview */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm text-muted-foreground">Líderes de Célula ({participants.length})</CardTitle>
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

      {/* History */}
      <h3 className="text-sm font-semibold text-muted-foreground">Histórico</h3>
      {!encontros?.length ? (
        <EmptyState icon={BookOpen} title="Nenhum encontro" description="Registre o primeiro encontro com seus líderes" />
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

// ── Tab 2: Visão das células (readonly, como antes) ──
function CoordCelulasOverview({ coordId }: { coordId: string }) {
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

  const celulasMap = new Map<string, typeof encontros>();
  for (const e of encontros || []) {
    if (!e.celula_id) continue;
    const arr = celulasMap.get(e.celula_id) || [];
    arr.push(e);
    celulasMap.set(e.celula_id, arr);
  }

  const globalStats = calcDiscipuladoStats(encontros || []);
  const celulasSemEncontro = coordCelulas.length - celulasMap.size;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="Encontros" value={globalStats.totalEncontros} />
        <StatCard icon={Users} label="Constância" value={`${globalStats.constancia}%`} />
        <StatCard icon={BookOpen} label="Sem registro" value={celulasSemEncontro} className={celulasSemEncontro > 0 ? 'border-amber-500/30' : ''} />
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground">Células</h3>
      {coordCelulas.length === 0 ? (
        <EmptyState icon={Users} title="Nenhuma célula" description="Nenhuma célula nesta coordenação" />
      ) : (
        <div className="space-y-2">
          {coordCelulas.map(cel => {
            const celEncontros = celulasMap.get(cel.id) || [];
            const celStats = calcDiscipuladoStats(celEncontros);
            return (
              <Card key={cel.id} className="cursor-pointer active:scale-[0.98] transition-all" onClick={() => setSelectedCelula(cel.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{cel.name}</p>
                    <p className="text-xs text-muted-foreground">{celStats.totalEncontros} encontros · {celStats.constancia}% constância</p>
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
    </div>
  );
}

function CelulaDiscipuladoDetail({ celulaId, celulaName, encontros, onBack }: {
  celulaId: string; celulaName: string; encontros: any[]; onBack: () => void;
}) {
  const { data: members } = useMembers(celulaId);
  const activeMembers = (members || []).filter(m => m.is_active);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 h-11 touch-manipulation">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>
      <h2 className="text-lg font-semibold">{celulaName} — Discipulado</h2>

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
                  {m.profile?.birth_date ? format(parseISO(m.profile.birth_date), "dd/MM/yyyy") : 'Sem data nasc.'}
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

      <h3 className="text-sm font-semibold text-muted-foreground">Encontros ({encontros.length})</h3>
      {encontros.length === 0 ? (
        <EmptyState icon={BookOpen} title="Sem encontros" description="Nenhum encontro registrado" />
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
