import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Search, MapPin, Calendar, FileText, Heart, DoorOpen, ClipboardList, BookOpen } from 'lucide-react';
import { useCelulas } from '@/hooks/useCelulas';
import { useEncaminhamentos } from '@/hooks/useEncaminhamentos';
import { CelulaDetailsDialog } from './CelulaDetailsDialog';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from './MissionVerse';
import { EmptyState } from '@/components/ui/empty-state';
import { useRole } from '@/contexts/RoleContext';
import { CellLeaderMembrosTab } from './cellleader/CellLeaderMembrosTab';
import { CellLeaderPulsoTab } from './cellleader/CellLeaderPulsoTab';
import { CellLeaderNovasVidasTab } from './cellleader/CellLeaderNovasVidasTab';
import { CellLeaderRoteiroTab } from './cellleader/CellLeaderRoteiroTab';
import { CellProfileSection } from './cellleader/CellProfileSection';
import { DiscipuladoCellLeaderTab } from './discipulado/DiscipuladoCellLeaderTab';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { RevelaShortcut } from './RevelaShortcut';
import { DashboardScopeBanner } from './DashboardScopeBanner';

export function CellLeaderDashboard() {
  const { data: celulas, isLoading } = useCelulas();
  const { scopeId } = useRole();
  const { data: allEnc } = useEncaminhamentos();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [selectedCelula, setSelectedCelula] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userCelulas = (celulas || []).filter(c => {
    if (scopeId && c.id !== scopeId) return false;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  const singleCell = scopeId ? userCelulas[0] : null;

  const cellEncaminhamentos = singleCell
    ? (allEnc || []).filter(e => e.celula_id === singleCell.id && e.status !== 'devolvido')
    : [];
  const pendingNovasVidas = cellEncaminhamentos.filter(e => e.status === 'pendente').length;

  const coupleNames = singleCell
    ? (celulas || []).find(c => c.id === singleCell.id)?.leadership_couple
      ? `${(celulas || []).find(c => c.id === singleCell.id)?.leadership_couple?.spouse1?.name} e ${(celulas || []).find(c => c.id === singleCell.id)?.leadership_couple?.spouse2?.name}`
      : undefined
    : undefined;

  return (
    <div className="space-y-6">
      <DashboardScopeBanner />
      <PageHeader
        title="Minhas Células"
        subtitle="Gerencie suas células e relatórios semanais"
        icon={Users}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MissionVerse role="celula_leader" />
        <RevelaShortcut />
      </div>

      {singleCell ? (
        <>
          {cellEncaminhamentos.length > 0 && (
            <StatCard
              icon={DoorOpen}
              label="Novas Vidas Encaminhadas"
              value={cellEncaminhamentos.length}
              subtitle={pendingNovasVidas > 0 ? `${pendingNovasVidas} aguardando contato` : 'Todas contatadas'}
            />
          )}

          <Tabs defaultValue={urlTab === 'novas-vidas' ? 'novas-vidas' : urlTab === 'roteiro' ? 'roteiro' : urlTab === 'pulso' ? 'pulso' : 'celula'} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6 h-auto p-1">
              <TabsTrigger value="pulso" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Pulso</span>
              </TabsTrigger>
              <TabsTrigger value="celula" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Célula</span>
              </TabsTrigger>
              <TabsTrigger value="membros" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Membros</span>
              </TabsTrigger>
              <TabsTrigger value="discipulado" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Discipulado</span>
              </TabsTrigger>
              <TabsTrigger value="roteiro" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Roteiro</span>
              </TabsTrigger>
              <TabsTrigger value="novas-vidas" className="gap-1.5 py-2.5 text-xs sm:text-sm relative">
                <DoorOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Vidas</span>
                {pendingNovasVidas > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                    {pendingNovasVidas}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

          <TabsContent value="pulso">
            <div className="space-y-4">
              <CellProfileSection celulaId={singleCell.id} />
              <CellLeaderPulsoTab celulaId={singleCell.id} />
            </div>
          </TabsContent>

          <TabsContent value="celula">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userCelulas.map(celula => (
                <Card
                  key={celula.id}
                  className="cursor-pointer card-hover group border-l-4 border-l-primary/30 hover:border-l-primary active:scale-[0.98] transition-all"
                  onClick={() => setSelectedCelula({ id: celula.id, name: celula.name })}
                >
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {celula.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-sm">
                      {celula.meeting_day && (
                        <>
                          <Calendar className="h-3.5 w-3.5" />
                          {celula.meeting_day}
                          {celula.meeting_time && ` às ${celula.meeting_time}`}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0">
                    {celula.leadership_couple && (
                      <p className="text-sm font-medium text-foreground">
                        👫 {celula.leadership_couple.spouse1?.name} & {celula.leadership_couple.spouse2?.name}
                      </p>
                    )}
                    {celula.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {celula.address}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="membros">
            <CellLeaderMembrosTab celulaId={singleCell.id} celulaName={singleCell.name} />
          </TabsContent>

          <TabsContent value="discipulado">
            <DiscipuladoCellLeaderTab celulaId={singleCell.id} celulaName={singleCell.name} redeId={singleCell.rede_id} />
          </TabsContent>

          <TabsContent value="roteiro">
            <CellLeaderRoteiroTab
              celulaId={singleCell.id}
              celulaName={singleCell.name}
              meetingDay={singleCell.meeting_day}
              redeId={singleCell.rede_id}
              coupleNames={coupleNames}
            />
          </TabsContent>

          <TabsContent value="novas-vidas">
            <CellLeaderNovasVidasTab celulaId={singleCell.id} celulaName={singleCell.name} coupleNames={coupleNames} />
          </TabsContent>
        </Tabs>
        </>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar célula pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>

          {userCelulas.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? 'Nenhuma célula encontrada' : 'Nenhuma célula vinculada'}
              description={search ? 'Tente outro termo de busca.' : 'Você ainda não está vinculado a nenhuma célula.'}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userCelulas.map(celula => (
                <Card
                  key={celula.id}
                  className="cursor-pointer card-hover group border-l-4 border-l-primary/30 hover:border-l-primary active:scale-[0.98] transition-all"
                  onClick={() => setSelectedCelula({ id: celula.id, name: celula.name })}
                >
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {celula.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-sm">
                      {celula.meeting_day && (
                        <>
                          <Calendar className="h-3.5 w-3.5" />
                          {celula.meeting_day}
                          {celula.meeting_time && ` às ${celula.meeting_time}`}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0">
                    {celula.leadership_couple && (
                      <p className="text-sm font-medium text-foreground">
                        👫 {celula.leadership_couple.spouse1?.name} & {celula.leadership_couple.spouse2?.name}
                      </p>
                    )}
                    {celula.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {celula.address}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {selectedCelula && (
        <CelulaDetailsDialog
          open={!!selectedCelula}
          onOpenChange={(open) => { if (!open) setSelectedCelula(null); }}
          celulaId={selectedCelula.id}
          celulaName={selectedCelula.name}
        />
      )}
    </div>
  );
}
