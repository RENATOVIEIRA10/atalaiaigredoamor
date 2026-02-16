import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, UserPlus, Users, Search, Network, FolderTree, ClipboardCheck, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCoupleFunctions, CoupleWithFunctions } from '@/hooks/useCoupleFunctions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function UserRolesManager() {
  const queryClient = useQueryClient();
  const { couples, isLoading } = useCoupleFunctions();
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');

  const createProfile = useMutation({
    mutationFn: async (data: { name: string; email?: string }) => {
      const fakeUserId = crypto.randomUUID();
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({ name: data.name, email: data.email || null, user_id: fakeUserId })
        .select()
        .single();
      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setIsCreateDialogOpen(false);
      setNewProfileName('');
      setNewProfileEmail('');
      toast({ title: 'Perfil criado', description: 'Perfil criado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro ao criar perfil', description: error.message });
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return couples;
    const s = search.toLowerCase();
    return couples.filter(c => {
      const names = [c.spouse1?.name, c.spouse2?.name].filter(Boolean).join(' ').toLowerCase();
      const funcs = c.functions.map(f => `${f.roleLabel} ${f.entityName}`).join(' ').toLowerCase();
      return names.includes(s) || funcs.includes(s);
    });
  }, [couples, search]);

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
          <div className="flex items-center justify-between">
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
              Novo Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {couples.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar casal ou função..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Nenhum resultado encontrado' : 'Nenhum casal com funções ativas'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(couple => (
                <CoupleCard key={couple.coupleId} couple={couple} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
            <DialogDescription>Adicione um novo membro ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome completo"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Opcional)</Label>
              <Input
                placeholder="email@exemplo.com"
                type="email"
                value={newProfileEmail}
                onChange={(e) => setNewProfileEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (!newProfileName.trim()) return;
                createProfile.mutate({ name: newProfileName, email: newProfileEmail });
              }}
              className="w-full"
              disabled={createProfile.isPending}
            >
              {createProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CoupleCard({ couple }: { couple: CoupleWithFunctions }) {
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
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className={`gap-1 text-xs font-medium ${roleColors[fn.role] || ''}`}>
                    <Icon className="h-3 w-3" />
                    {fn.roleLabel}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{fn.entityName}</span>
                  {fn.parentName && (
                    <span className="text-muted-foreground">({fn.parentName})</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Count badge */}
        {couple.functions.length > 1 && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {couple.functions.length} funções
          </Badge>
        )}
      </div>
    </div>
  );
}
