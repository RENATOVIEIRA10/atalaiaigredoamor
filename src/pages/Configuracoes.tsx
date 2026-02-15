import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRolesManager } from '@/components/settings/UserRolesManager';
import { AccessKeysManager } from '@/components/settings/AccessKeysManager';
import { WeeklyReportsHistory } from '@/components/reports/WeeklyReportsHistory';
import { User, Shield, History, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Administrador', variant: 'default' },
  rede_leader: { label: 'Líder de Rede', variant: 'secondary' },
  coordenador: { label: 'Coordenador', variant: 'secondary' },
  supervisor: { label: 'Supervisor', variant: 'secondary' },
  celula_leader: { label: 'Líder de Célula', variant: 'outline' },
};

export default function Configuracoes() {
  const { selectedRole, isAdmin } = useRole();

  return (
    <AppLayout title="Configurações">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Gestão de Perfis
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="access-keys" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Códigos de Acesso
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Perfil do Usuário</CardTitle>
                <CardDescription>
                  Informações do papel selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Papel Atual</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole && (
                      <Badge variant={roleLabels[selectedRole]?.variant || 'default'}>
                        {roleLabels[selectedRole]?.label || selectedRole}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Ambiente</label>
                  <p className="text-sm">Ambiente controlado - sem autenticação</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="roles">
            <UserRolesManager />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="access-keys">
            <AccessKeysManager />
          </TabsContent>
        )}

        <TabsContent value="history">
          <WeeklyReportsHistory />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
