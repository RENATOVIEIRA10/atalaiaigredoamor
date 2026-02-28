import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, FlaskConical } from 'lucide-react';

export default function FerramentasTeste() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Ferramentas de Teste">
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Card className="border-warning/40">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-warning" />
            </div>
            <CardTitle className="text-lg">Módulo Substituído</CardTitle>
            <CardDescription>
              Esta ferramenta foi descontinuada e substituída pelo módulo oficial de Seed Run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-primary/30 bg-primary/5">
              <FlaskConical className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Todas as simulações agora são gerenciadas em{' '}
                <strong>Configurações → Seed Run / Simulações</strong>, com isolamento por campus,
                rastreabilidade completa e configuração avançada.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => navigate('/configuracoes?tab=seedrun')}
            >
              <ArrowRight className="h-4 w-4" />
              Ir para Seed Run Oficial
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
