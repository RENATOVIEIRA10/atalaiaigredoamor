import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Search, MapPin, Calendar, FileText } from 'lucide-react';
import { useCelulas } from '@/hooks/useCelulas';
import { CelulaDetailsDialog } from './CelulaDetailsDialog';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from './MissionVerse';
import { EmptyState } from '@/components/ui/empty-state';
import { useRole } from '@/contexts/RoleContext';
import { CellLeaderMembrosTab } from './cellleader/CellLeaderMembrosTab';

export function CellLeaderDashboard() {
  const { data: celulas, isLoading } = useCelulas();
  const { scopeId } = useRole();
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

  // If leader has exactly one cell (scoped), show tabs with Membros
  const singleCell = scopeId ? userCelulas[0] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Células"
        subtitle="Gerencie suas células e relatórios semanais"
        icon={Users}
      />

      <MissionVerse role="celula_leader" />

      {singleCell ? (
        // Scoped leader: show tabs (Célula + Membros)
        <Tabs defaultValue="celula" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="celula" className="gap-2 py-2.5">
              <FileText className="h-4 w-4" />
              Célula
            </TabsTrigger>
            <TabsTrigger value="membros" className="gap-2 py-2.5">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      ) : (
        // Multiple cells or no scope: original layout
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
