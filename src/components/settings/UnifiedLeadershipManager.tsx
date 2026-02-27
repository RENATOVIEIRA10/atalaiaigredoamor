import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Users, Search, Filter, MoreVertical, Pencil, Trash2, Plus, Copy, KeyRound, Network, FolderTree, ClipboardCheck, Home, Church, Shield, Crown, Heart, BookOpen, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadershipFunctions, UnifiedLeader, UnifiedFunction } from '@/hooks/useLeadershipFunctions';
import { CreateLeadershipDialog } from './CreateLeadershipDialog';
import { EditLeadershipFunctionDialog } from './EditLeadershipFunctionDialog';
import { RemoveLeadershipFunctionDialog } from './RemoveLeadershipFunctionDialog';
import { toast } from '@/hooks/use-toast';

const roleIcons: Record<string, any> = {
  rede_leader: Network,
  coordenador: FolderTree,
  supervisor: ClipboardCheck,
  celula_leader: Home,
  pastor_de_campo: Church,
  pastor_senior_global: Crown,
  admin: Shield,
  lider_recomeco_central: Heart,
  lider_batismo_aclamacao: BookOpen,
  central_batismo_aclamacao: BookOpen,
  central_celulas: Users,
  recomeco_cadastro: Heart,
  recomeco_operador: Heart,
  recomeco_leitura: BookOpen,
};

const roleColors: Record<string, string> = {
  pastor_senior_global: 'bg-amber-500/10 text-amber-600',
  pastor_de_campo: 'bg-amber-500/10 text-amber-600',
  admin: 'bg-red-500/10 text-red-600',
  rede_leader: 'bg-primary/10 text-primary',
  coordenador: 'bg-blue-500/10 text-blue-600',
  supervisor: 'bg-green-500/10 text-green-600',
  celula_leader: 'bg-orange-500/10 text-orange-600',
  lider_recomeco_central: 'bg-purple-500/10 text-purple-600',
  lider_batismo_aclamacao: 'bg-indigo-500/10 text-indigo-600',
  central_batismo_aclamacao: 'bg-indigo-500/10 text-indigo-600',
  central_celulas: 'bg-teal-500/10 text-teal-600',
  recomeco_cadastro: 'bg-purple-500/10 text-purple-600',
};

type FilterType = 'all' | 'couples' | 'individuals' | 'rede_leader' | 'coordenador' | 'supervisor' | 'celula_leader' | 'pastor_de_campo' | 'pastor_senior_global' | 'admin' | 'ministry' | 'multi' | 'no_code';

const MINISTRY_TYPES = ['lider_recomeco_central', 'lider_batismo_aclamacao', 'central_batismo_aclamacao', 'central_celulas', 'recomeco_cadastro', 'recomeco_operador', 'recomeco_leitura'];

export function UnifiedLeadershipManager() {
  const { leaders, isLoading } = useLeadershipFunctions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFn, setEditingFn] = useState<{ leader: UnifiedLeader; fn: UnifiedFunction } | null>(null);
  const [removingFn, setRemovingFn] = useState<{ leader: UnifiedLeader; fn: UnifiedFunction } | null>(null);
  const [addingFnLeader, setAddingFnLeader] = useState<UnifiedLeader | null>(null);

  const filtered = useMemo(() => {
    let result = leaders;

    if (filter === 'couples') result = result.filter(l => l.isCouple);
    else if (filter === 'individuals') result = result.filter(l => !l.isCouple);
    else if (filter === 'multi') result = result.filter(l => l.functions.length > 1);
    else if (filter === 'no_code') result = result.filter(l => l.functions.some(f => !f.accessCode));
    else if (filter === 'ministry') result = result.filter(l => l.functions.some(f => MINISTRY_TYPES.includes(f.functionType)));
    else if (filter !== 'all') result = result.filter(l => l.functions.some(f => f.functionType === filter));

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(l => {
        const names = [l.person1?.name, l.person2?.name].filter(Boolean).join(' ').toLowerCase();
        const fns = l.functions.map(f => `${f.functionLabel} ${f.scopeEntityName}`).join(' ').toLowerCase();
        const codes = l.functions.map(f => f.accessCode || '').join(' ').toLowerCase();
        return names.includes(s) || fns.includes(s) || codes.includes(s);
      });
    }

    return result;
  }, [leaders, search, filter]);

  const stats = useMemo(() => {
    const total = leaders.length;
    const couples = leaders.filter(l => l.isCouple).length;
    const individuals = leaders.filter(l => !l.isCouple).length;
    const withoutCode = leaders.filter(l => l.functions.some(f => !f.accessCode)).length;
    return { total, couples, individuals, withoutCode };
  }, [leaders]);

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
                <Shield className="h-5 w-5" />
                Gestão Unificada de Lideranças
              </CardTitle>
              <CardDescription>
                {stats.total} liderança(s) • {stats.couples} casal(is) • {stats.individuals} individual(is)
                {stats.withoutCode > 0 && (
                  <span className="text-amber-600 ml-2">• {stats.withoutCode} sem código</span>
                )}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar liderança
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, função, código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="couples">Casais</SelectItem>
                <SelectItem value="individuals">Individuais</SelectItem>
                <SelectItem value="pastor_senior_global">Pastor Global</SelectItem>
                <SelectItem value="pastor_de_campo">Pastor de Campo</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="rede_leader">Líderes de Rede</SelectItem>
                <SelectItem value="coordenador">Coordenadores</SelectItem>
                <SelectItem value="supervisor">Supervisores</SelectItem>
                <SelectItem value="celula_leader">Líderes de Célula</SelectItem>
                <SelectItem value="ministry">Ministérios</SelectItem>
                <SelectItem value="multi">Com 2+ funções</SelectItem>
                <SelectItem value="no_code">Sem código de acesso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || filter !== 'all' ? 'Nenhum resultado encontrado' : 'Nenhuma liderança cadastrada'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(leader => (
                <LeaderCard
                  key={leader.key}
                  leader={leader}
                  onAddFunction={() => setAddingFnLeader(leader)}
                  onEditFunction={(fn) => setEditingFn({ leader, fn })}
                  onRemoveFunction={(fn) => setRemovingFn({ leader, fn })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateLeadershipDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {addingFnLeader && (
        <EditLeadershipFunctionDialog
          open={!!addingFnLeader}
          onOpenChange={(open) => !open && setAddingFnLeader(null)}
          leader={addingFnLeader}
          existingFunction={null}
          mode="add"
        />
      )}

      {editingFn && (
        <EditLeadershipFunctionDialog
          open={!!editingFn}
          onOpenChange={(open) => !open && setEditingFn(null)}
          leader={editingFn.leader}
          existingFunction={editingFn.fn}
          mode="edit"
        />
      )}

      {removingFn && (
        <RemoveLeadershipFunctionDialog
          open={!!removingFn}
          onOpenChange={(open) => !open && setRemovingFn(null)}
          leader={removingFn.leader}
          fn={removingFn.fn}
        />
      )}
    </div>
  );
}

function LeaderCard({
  leader,
  onAddFunction,
  onEditFunction,
  onRemoveFunction,
}: {
  leader: UnifiedLeader;
  onAddFunction: () => void;
  onEditFunction: (fn: UnifiedFunction) => void;
  onRemoveFunction: (fn: UnifiedFunction) => void;
}) {
  const displayName = leader.isCouple
    ? [leader.person1?.name, leader.person2?.name].filter(Boolean).join(' & ')
    : leader.person1?.name || 'Sem nome';

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Código copiado!' });
  };

  return (
    <div className="rounded-xl border border-border/50 p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatars */}
        <div className={`flex ${leader.isCouple ? '-space-x-2' : ''} shrink-0`}>
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={leader.person1?.avatar_url || undefined} crossOrigin="anonymous" />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {leader.person1?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          {leader.isCouple && leader.person2 && (
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={leader.person2?.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {leader.person2?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            {!leader.isCouple && (
              <Badge variant="outline" className="text-[10px]">
                <User className="h-2.5 w-2.5 mr-1" />
                Individual
              </Badge>
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            {leader.functions.map((fn) => {
              const Icon = roleIcons[fn.functionType] || Users;
              return (
                <div key={fn.id} className="flex items-center gap-2 text-xs group flex-wrap">
                  <Badge variant="secondary" className={`gap-1 text-xs font-medium ${roleColors[fn.functionType] || ''}`}>
                    <Icon className="h-3 w-3" />
                    {fn.functionLabel}
                  </Badge>
                  {fn.scopeEntityName && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{fn.scopeEntityName}</span>
                    </>
                  )}
                  {fn.parentName && (
                    <span className="text-muted-foreground">({fn.parentName})</span>
                  )}
                  {/* Access code badge */}
                  {fn.accessCode ? (
                    <Badge
                      variant="outline"
                      className={`gap-1 text-[10px] font-mono cursor-pointer ${fn.accessKeyActive ? 'border-green-500/30 text-green-600' : 'border-destructive/30 text-destructive line-through'}`}
                      onClick={() => copyCode(fn.accessCode!)}
                      title="Clique para copiar"
                    >
                      <KeyRound className="h-2.5 w-2.5" />
                      {fn.accessCode}
                      <Copy className="h-2 w-2 ml-0.5" />
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-[10px] text-amber-600 border-amber-500/30 border-dashed">
                      <KeyRound className="h-2.5 w-2.5" />
                      sem código
                    </Badge>
                  )}
                  {/* Per-function actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditFunction(fn)}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Editar função
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

        <div className="flex items-center gap-1 shrink-0">
          {leader.functions.length > 1 && (
            <Badge variant="outline" className="text-xs mr-1">
              {leader.functions.length} funções
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
