import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Users, Search, Network, FolderTree, ClipboardCheck, Home, MoreVertical, Pencil, Trash2, Plus, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCoupleFunctions, CoupleWithFunctions, CoupleFunction } from '@/hooks/useCoupleFunctions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateCoupleDialog } from './CreateCoupleDialog';
import { EditFunctionDialog } from './EditFunctionDialog';
import { RemoveFunctionDialog } from './RemoveFunctionDialog';

const roleIcons: Record<string, any> = {
  rede_leader: Network,
  coordenador: FolderTree,
  supervisor: ClipboardCheck,
  celula_leader: Home,
};

const roleColors: Record<string, string> = {
  rede_leader: 'bg-primary/10 text-primary',
  coordenador: 'bg-blue-500/10 text-blue-600',
  supervisor: 'bg-green-500/10 text-green-600',
  celula_leader: 'bg-orange-500/10 text-orange-600',
};

type FilterType = 'all' | 'rede_leader' | 'coordenador' | 'supervisor' | 'celula_leader' | 'multi' | 'no_function';

export function UserRolesManager() {
  const { couples, isLoading } = useCoupleFunctions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFunction, setEditingFunction] = useState<{ couple: CoupleWithFunctions; fn: CoupleFunction; index: number } | null>(null);
  const [removingFunction, setRemovingFunction] = useState<{ couple: CoupleWithFunctions; fn: CoupleFunction } | null>(null);
  const [addingFunctionCouple, setAddingFunctionCouple] = useState<CoupleWithFunctions | null>(null);

  const filtered = useMemo(() => {
    let result = couples;

    // Filter by role
    if (filter === 'multi') {
      result = result.filter(c => c.functions.length > 1);
    } else if (filter === 'no_function') {
      result = result.filter(c => c.functions.length === 0);
    } else if (filter !== 'all') {
      result = result.filter(c => c.functions.some(f => f.role === filter));
    }

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(c => {
        const names = [c.spouse1?.name, c.spouse2?.name].filter(Boolean).join(' ').toLowerCase();
        const funcs = c.functions.map(f => `${f.roleLabel} ${f.entityName}`).join(' ').toLowerCase();
        return names.includes(s) || funcs.includes(s);
      });
    }

    return result;
  }, [couples, search, filter]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Funções por Casal
              </CardTitle>
              <CardDescription>
                {couples.length} casal(is) com funções ativas na estrutura
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar casal na estrutura
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar casal, célula, coordenação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rede_leader">Líderes de Rede</SelectItem>
                <SelectItem value="coordenador">Coordenadores</SelectItem>
                <SelectItem value="supervisor">Supervisores</SelectItem>
                <SelectItem value="celula_leader">Líderes de Célula</SelectItem>
                <SelectItem value="multi">Com 2+ funções</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || filter !== 'all' ? 'Nenhum resultado encontrado' : 'Nenhum casal com funções ativas'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(couple => (
                <CoupleCard
                  key={couple.coupleId}
                  couple={couple}
                  onAddFunction={() => setAddingFunctionCouple(couple)}
                  onEditFunction={(fn, i) => setEditingFunction({ couple, fn, index: i })}
                  onRemoveFunction={(fn) => setRemovingFunction({ couple, fn })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Couple Dialog */}
      <CreateCoupleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Add Function to existing couple */}
      {addingFunctionCouple && (
        <EditFunctionDialog
          open={!!addingFunctionCouple}
          onOpenChange={(open) => !open && setAddingFunctionCouple(null)}
          couple={addingFunctionCouple}
          existingFunction={null}
          mode="add"
        />
      )}

      {/* Edit Function Dialog */}
      {editingFunction && (
        <EditFunctionDialog
          open={!!editingFunction}
          onOpenChange={(open) => !open && setEditingFunction(null)}
          couple={editingFunction.couple}
          existingFunction={editingFunction.fn}
          mode="edit"
        />
      )}

      {/* Remove Function Dialog */}
      {removingFunction && (
        <RemoveFunctionDialog
          open={!!removingFunction}
          onOpenChange={(open) => !open && setRemovingFunction(null)}
          couple={removingFunction.couple}
          fn={removingFunction.fn}
        />
      )}
    </div>
  );
}

function CoupleCard({
  couple,
  onAddFunction,
  onEditFunction,
  onRemoveFunction,
}: {
  couple: CoupleWithFunctions;
  onAddFunction: () => void;
  onEditFunction: (fn: CoupleFunction, index: number) => void;
  onRemoveFunction: (fn: CoupleFunction) => void;
}) {
  const coupleName = [couple.spouse1?.name, couple.spouse2?.name].filter(Boolean).join(' & ');

  return (
    <div className="rounded-xl border border-border/50 p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        {/* Couple Avatars */}
        <div className="flex -space-x-2 shrink-0">
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={couple.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {couple.spouse1?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={couple.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {couple.spouse2?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{coupleName}</p>
          <div className="mt-2 space-y-1.5">
            {couple.functions.map((fn, i) => {
              const Icon = roleIcons[fn.role] || Users;
              return (
                <div key={i} className="flex items-center gap-2 text-xs group">
                  <Badge variant="secondary" className={`gap-1 text-xs font-medium ${roleColors[fn.role] || ''}`}>
                    <Icon className="h-3 w-3" />
                    {fn.roleLabel}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{fn.entityName}</span>
                  {fn.parentName && (
                    <span className="text-muted-foreground">({fn.parentName})</span>
                  )}
                  {/* Per-function actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditFunction(fn, i)}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Editar vínculo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onRemoveFunction(fn)} className="text-destructive">
                        <Trash2 className="h-3 w-3 mr-2" />
                        Remover função
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {couple.functions.length > 1 && (
            <Badge variant="outline" className="text-xs mr-1">
              {couple.functions.length} funções
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddFunction} title="Adicionar função">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
