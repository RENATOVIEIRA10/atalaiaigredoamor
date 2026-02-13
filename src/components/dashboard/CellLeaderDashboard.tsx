import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search, MapPin, Calendar } from 'lucide-react';
import { useCelulas } from '@/hooks/useCelulas';
import { CelulaDetailsDialog } from './CelulaDetailsDialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useRole } from '@/contexts/RoleContext';

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
    // If scopeId is set, only show that specific cell
    if (scopeId && c.id !== scopeId) return false;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Células"
        subtitle="Gerencie suas células e relatórios semanais"
        icon={Users}
      />

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
              className="cursor-pointer card-hover group border-l-4 border-l-primary/30 hover:border-l-primary"
              onClick={() => setSelectedCelula({ id: celula.id, name: celula.name })}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {celula.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  {celula.meeting_day && (
                    <>
                      <Calendar className="h-3 w-3" />
                      {celula.meeting_day}
                      {celula.meeting_time && ` às ${celula.meeting_time}`}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {celula.leadership_couple && (
                  <p className="text-sm font-medium text-foreground">
                    👫 {celula.leadership_couple.spouse1?.name} & {celula.leadership_couple.spouse2?.name}
                  </p>
                )}
                {celula.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {celula.address}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
