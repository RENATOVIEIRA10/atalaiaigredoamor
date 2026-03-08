import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useCelulas, Celula } from '@/hooks/useCelulas';
import { CelulaCard } from '@/components/celulas/CelulaCard';
import { CelulaFormDialog } from '@/components/celulas/CelulaFormDialog';
import { DeleteCelulaDialog } from '@/components/celulas/DeleteCelulaDialog';
import { useRole } from '@/contexts/RoleContext';
import { useSupervisores } from '@/hooks/useSupervisoes';

export default function Celulas() {
  const { data: celulas, isLoading } = useCelulas();
  const { scopeType, scopeId } = useRole();
  const { data: supervisores } = useSupervisores();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCelula, setEditingCelula] = useState<Celula | null>(null);
  const [deletingCelula, setDeletingCelula] = useState<Celula | null>(null);
  
  const filteredCelulas = useMemo(() => {
    let list = celulas || [];
    
    // Apply scope filtering
    if (scopeType === 'celula' && scopeId) {
      list = list.filter(c => c.id === scopeId);
    } else if (scopeType === 'supervisor' && scopeId) {
      list = list.filter(c => (c as any).supervisor_id === scopeId);
    } else if (scopeType === 'coordenacao' && scopeId) {
      list = list.filter(c => c.coordenacao_id === scopeId);
    } else if (scopeType === 'rede' && scopeId) {
      list = list.filter(c => c.rede_id === scopeId);
    }
    // admin sees everything
    
    // Apply search filter
    return list.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.coordenacao?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.leader?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [celulas, scopeType, scopeId, search]);
  
  function handleEdit(celula: Celula) {
    setEditingCelula(celula);
    setFormOpen(true);
  }
  
  function handleCloseForm(open: boolean) {
    if (!open) {
      setEditingCelula(null);
    }
    setFormOpen(open);
  }
  
  return (
    <AppLayout title="Células">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar células..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Célula
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCelulas.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">
                {search 
                  ? 'Nenhuma célula encontrada com esse termo.' 
                  : 'Nenhuma célula cadastrada ainda. Clique em "Nova Célula" para começar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCelulas.map((celula) => (
              <CelulaCard
                key={celula.id}
                celula={celula}
                onEdit={handleEdit}
                onDelete={setDeletingCelula}
              />
            ))}
          </div>
        )}
      </div>
      
      <CelulaFormDialog 
        open={formOpen} 
        onOpenChange={handleCloseForm}
        celula={editingCelula}
      />
      
      <DeleteCelulaDialog
        open={!!deletingCelula}
        onOpenChange={(open) => !open && setDeletingCelula(null)}
        celulaId={deletingCelula?.id || null}
        celulaName={deletingCelula?.name || ''}
      />
    </AppLayout>
  );
}
