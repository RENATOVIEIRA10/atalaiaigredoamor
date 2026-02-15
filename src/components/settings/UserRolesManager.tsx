import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Shield, Network, FolderTree, Home, ClipboardCheck, UserPlus, Users, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useSupervisores, useCreateSupervisor, useDeleteSupervisor } from '@/hooks/useSupervisoes';
import { SupervisorFormDialog } from '@/components/settings/SupervisorFormDialog';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: 'Admin', icon: <Shield className="h-3 w-3" />, color: 'bg-destructive text-destructive-foreground' },
  rede_leader: { label: 'Líder de Rede', icon: <Network className="h-3 w-3" />, color: 'bg-primary text-primary-foreground' },
  coordenador: { label: 'Coordenador', icon: <FolderTree className="h-3 w-3" />, color: 'bg-accent text-accent-foreground' },
  supervisor: { label: 'Supervisor', icon: <ClipboardCheck className="h-3 w-3" />, color: 'bg-secondary text-secondary-foreground' },
  celula_leader: { label: 'Líder de Célula', icon: <Home className="h-3 w-3" />, color: 'bg-muted text-muted-foreground' },
};

const allRoles: AppRole[] = ['admin', 'rede_leader', 'coordenador', 'supervisor', 'celula_leader'];

interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  user_id: string;
}

interface ProfileWithRoles extends Profile {
  roles: AppRole[];
}

export function UserRolesManager() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSupervisorFormOpen, setIsSupervisorFormOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, AppRole[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profiles with roles using a more optimized approach
  const { data: profilesWithRoles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      console.log('Iniciando busca de perfis...');
      
      // Busca perfis
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profilesErr) {
        console.error('Erro ao buscar perfis:', profilesErr);
        throw profilesErr;
      }

      // Busca roles apenas se houver perfis
      let rolesByUserId: Record<string, AppRole[]> = {};
      
      if (profiles && profiles.length > 0) {
        const { data: userRoles, error: rolesErr } = await supabase
          .from('user_roles')
          .select('*');
          
        if (rolesErr) {
          console.error('Erro ao buscar roles:', rolesErr);
          // Não vamos travar a tela se falhar as roles, mas logar o erro
        } else {
          userRoles?.forEach(ur => {
            if (!rolesByUserId[ur.user_id]) {
              rolesByUserId[ur.user_id] = [];
            }
            rolesByUserId[ur.user_id].push(ur.role as AppRole);
          });
        }
      }

      return (profiles || []).map(profile => ({
        ...profile,
        roles: rolesByUserId[profile.user_id] || [],
      })) as ProfileWithRoles[];
    },
    // Adiciona retry falso para falhar rápido se for erro de permissão
    retry: 1,
  });

  if (profilesError) {
    console.error('Erro fatal na query:', profilesError);
  }

  const { data: coordenacoes } = useCoordenacoes();
  const { data: supervisores, isLoading: supervisoresLoading } = useSupervisores();
  const createSupervisor = useCreateSupervisor();
  const deleteSupervisor = useDeleteSupervisor();

  // Create profile mutation
  const createProfile = useMutation({
    mutationFn: async (data: { name: string; email?: string }) => {
      console.log('Tentando criar perfil:', data);
      
      // Tenta criar com um ID gerado, mas sabendo que pode falhar se não houver usuário Auth correspondente
      const fakeUserId = crypto.randomUUID();
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          name: data.name,
          email: data.email || null,
          user_id: fakeUserId,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil:', error);
        throw error;
      }
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setIsCreateDialogOpen(false);
      setNewProfileName('');
      setNewProfileEmail('');
      toast({
        title: 'Perfil criado',
        description: 'O perfil foi criado com sucesso. Note que este usuário não tem login (apenas registro interno).',
      });
    },
    onError: (error: any) => {
      console.error('Erro detalhado na criação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar perfil',
        description: error.message || 'Verifique se você tem permissão de administrador.',
      });
    },
  });

  // Delete profile mutation
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      toast({ title: 'Sucesso!', description: 'Perfil removido com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    createProfile.mutate({ name: newProfileName, email: newProfileEmail });
  };

  // Get current roles for a profile (considering pending changes)
  const getCurrentRoles = (profile: ProfileWithRoles): AppRole[] => {
    return pendingRoleChanges[profile.user_id] ?? profile.roles;
  };

  // Toggle a role for a profile
  const toggleRole = (profile: ProfileWithRoles, role: AppRole) => {
    const currentRoles = getCurrentRoles(profile);
    let newRoles: AppRole[];
    
    if (currentRoles.includes(role)) {
      newRoles = currentRoles.filter(r => r !== role);
    } else {
      newRoles = [...currentRoles, role];
    }
    
    setPendingRoleChanges(prev => ({
      ...prev,
      [profile.user_id]: newRoles,
    }));
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(pendingRoleChanges).length > 0;

  // Save all role changes
  const saveRoleChanges = async () => {
    setIsSaving(true);
    try {
      for (const [userId, newRoles] of Object.entries(pendingRoleChanges)) {
        const profile = profilesWithRoles?.find(p => p.user_id === userId);
        if (!profile) continue;

        const oldRoles = profile.roles;
        
        // Roles to add
        const rolesToAdd = newRoles.filter(r => !oldRoles.includes(r));
        // Roles to remove
        const rolesToRemove = oldRoles.filter(r => !newRoles.includes(r));

        // Add new roles
        for (const role of rolesToAdd) {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role });
          if (error) throw error;
        }

        // Remove old roles
        for (const role of rolesToRemove) {
          const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role', role);
          if (error) throw error;
        }
      }

      setPendingRoleChanges({});
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast({ title: 'Sucesso!', description: 'Papéis atualizados com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel pending changes
  const cancelChanges = () => {
    setPendingRoleChanges({});
  };

  // handleAddSupervisor removed - now using SupervisorFormDialog

  if (profilesLoading) {
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
      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Perfis e Papéis
          </TabsTrigger>
          <TabsTrigger value="supervisores" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Supervisores
          </TabsTrigger>
        </TabsList>

        {/* Profiles & Roles Tab */}
        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestão de Perfis e Papéis
                  </CardTitle>
                  <CardDescription>
                    Cadastre perfis e atribua papéis (Admin, Líder de Rede, Coordenador, Supervisor, Líder de Célula)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges && (
                    <>
                      <Button variant="outline" onClick={cancelChanges}>
                        Cancelar
                      </Button>
                      <Button onClick={saveRoleChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </>
                  )}
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Perfil
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasUnsavedChanges && (
                <div className="mb-4 p-3 bg-secondary border border-border rounded-lg text-secondary-foreground text-sm">
                  ⚠️ Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicar.
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perfil</TableHead>
                    {allRoles.map(role => (
                      <TableHead key={role} className="text-center w-28">
                        <div className="flex flex-col items-center gap-1">
                          {roleLabels[role].icon}
                          <span className="text-xs">{roleLabels[role].label}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profilesWithRoles?.map((profile) => {
                    const currentRoles = getCurrentRoles(profile);
                    const hasChanges = pendingRoleChanges[profile.user_id] !== undefined;
                    
                    return (
                      <TableRow key={profile.id} className={hasChanges ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {profile.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{profile.name}</span>
                              {profile.email && (
                                <p className="text-xs text-muted-foreground">{profile.email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {allRoles.map(role => (
                          <TableCell key={role} className="text-center">
                            <Checkbox
                              checked={currentRoles.includes(role)}
                              onCheckedChange={() => toggleRole(profile, role)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remover perfil "${profile.name}"?`)) {
                                deleteProfile.mutate(profile.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!profilesWithRoles || profilesWithRoles.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={allRoles.length + 2} className="text-center text-muted-foreground py-8">
                        Nenhum perfil cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supervisores Tab */}
        <TabsContent value="supervisores">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Gestão de Supervisores
                  </CardTitle>
                  <CardDescription>
                    Vincule casais como supervisores de coordenações específicas
                  </CardDescription>
                </div>
                <Button onClick={() => setIsSupervisorFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Supervisor (Casal)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supervisors List */}
              {supervisoresLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Casal Supervisor</TableHead>
                      <TableHead>Coordenação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supervisores?.map((supervisor) => {
                      const coupleName = supervisor.leadership_couple
                        ? `${supervisor.leadership_couple.spouse1?.name || ''} & ${supervisor.leadership_couple.spouse2?.name || ''}`
                        : supervisor.profile?.name || 'N/A';
                      
                      return (
                        <TableRow key={supervisor.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {supervisor.leadership_couple ? (
                                <div className="flex -space-x-2">
                                  <Avatar className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={supervisor.leadership_couple.spouse1?.avatar_url || undefined} crossOrigin="anonymous" />
                                    <AvatarFallback className="text-xs">
                                      {supervisor.leadership_couple.spouse1?.name?.charAt(0) || 'S'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Avatar className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={supervisor.leadership_couple.spouse2?.avatar_url || undefined} crossOrigin="anonymous" />
                                    <AvatarFallback className="text-xs">
                                      {supervisor.leadership_couple.spouse2?.name?.charAt(0) || 'S'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              ) : (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {supervisor.profile?.name?.charAt(0)?.toUpperCase() || 'S'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="font-medium">{coupleName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex w-fit items-center gap-1">
                              <FolderTree className="h-3 w-3" />
                              {supervisor.coordenacao?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Remover supervisor "${coupleName}"?`)) {
                                  deleteSupervisor.mutate(supervisor.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!supervisores || supervisores.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Nenhum supervisor cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
            <DialogDescription>
              Adicione um novo membro ao sistema.
            </DialogDescription>
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
            <Button onClick={handleCreateProfile} className="w-full" disabled={createProfile.isPending}>
              {createProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SupervisorFormDialog
        open={isSupervisorFormOpen}
        onOpenChange={setIsSupervisorFormOpen}
      />
    </div>
  );
}
