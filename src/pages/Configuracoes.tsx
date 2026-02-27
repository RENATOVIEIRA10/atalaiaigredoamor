import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedLeadershipManager } from '@/components/settings/UnifiedLeadershipManager';
import { WeeklyReportsHistory } from '@/components/reports/WeeklyReportsHistory';
import { PolicyAcceptancesManager } from '@/components/settings/PolicyAcceptancesManager';
import { CamposManager } from '@/components/settings/CamposManager';
import { SeedRunSimulationPanel } from '@/components/settings/SeedRunSimulationPanel';
import { User, Shield, History, Lock, Church, FlaskConical } from 'lucide-react';
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="leadership" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Lideranças
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Privacidade
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="campos" className="flex items-center gap-2">
              <Church className="h-4 w-4" />
              Campos
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="seedrun" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Seed Run / Simulações
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Perfil do Usuário</CardTitle>
                <CardDescription>Informações do papel selecionado</CardDescription>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="leadership">
            <UnifiedLeadershipManager />
          </TabsContent>
        )}

        <TabsContent value="history">
          <WeeklyReportsHistory />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="privacy">
            <PolicyAcceptancesManager />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="campos">
            <CamposManager />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="seedrun">
            <SeedRunSimulationPanel />
          </TabsContent>
        )}
      </Tabs>
    </AppLayout>
  );
}
