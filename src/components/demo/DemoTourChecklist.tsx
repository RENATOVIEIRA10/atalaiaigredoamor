import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, MapPin, ChevronRight } from 'lucide-react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useNavigate } from 'react-router-dom';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional';

interface TourStep {
  id: string;
  label: string;
  description: string;
  role: DemoScopeType;
  route: string;
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  { id: 'pastor', label: 'Pastor Global', description: 'Visão geral de todos os campus, KPIs e Visão Pastoral', role: 'pastor', route: '/dashboard', icon: '👨‍💼' },
  { id: 'rede', label: 'Líder de Rede', description: 'Dashboard da rede com coordenações, supervisões e relatórios', role: 'rede', route: '/dashboard', icon: '🌐' },
  { id: 'coordenacao', label: 'Coordenador', description: 'Visão de coordenação com células e supervisores', role: 'coordenacao', route: '/dashboard', icon: '📋' },
  { id: 'supervisor', label: 'Supervisor', description: 'Supervisões bimestrais e planejamento', role: 'supervisor', route: '/dashboard', icon: '🔍' },
  { id: 'celula', label: 'Líder de Célula', description: 'Célula, membros, relatórios semanais e roteiro', role: 'celula', route: '/dashboard', icon: '🏠' },
  { id: 'recomeco', label: 'Recomeço + Central', description: 'Funil de novas vidas e encaminhamentos', role: 'pastor', route: '/recomeco', icon: '🕊️' },
  { id: 'batismo', label: 'Batismo / Aclamação', description: 'Eventos espirituais e inscrições', role: 'pastor', route: '/dados', icon: '💧' },
  { id: 'discipulado', label: 'Discipulado', description: 'Cadeia de discipulado por nível', role: 'pastor', route: '/dashboard', icon: '📖' },
];

const scopeLabels: Record<string, string> = {
  pastor: 'Pastor Sênior',
  admin: 'Administrador',
  rede: 'Líder de Rede',
  coordenacao: 'Coordenador',
  supervisor: 'Supervisor',
  celula: 'Líder de Célula',
  demo_institucional: 'Demo Institucional',
};

export function DemoTourChecklist() {
  const { isDemoActive, demoRunId, demoCampusId, activateDemo } = useDemoMode();
  const navigate = useNavigate();
  const [visited, setVisited] = useState<Set<string>>(new Set());

  if (!isDemoActive) return null;

  const handleStepClick = (step: TourStep) => {
    // Switch role
    activateDemo(step.role, null, scopeLabels[step.role], demoRunId, demoCampusId);
    // Navigate
    navigate(step.route);
    // Mark visited
    setVisited(prev => new Set(prev).add(step.id));
  };

  const visitedCount = visited.size;
  const totalSteps = TOUR_STEPS.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Tour Guiado
            </CardTitle>
            <CardDescription>
              Navegue pelo ecossistema alternando papéis automaticamente
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {visitedCount}/{totalSteps}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {TOUR_STEPS.map(step => {
            const isVisited = visited.has(step.id);
            return (
              <Button
                key={step.id}
                variant="ghost"
                className="w-full justify-start h-auto py-2.5 px-3 text-left"
                onClick={() => handleStepClick(step)}
              >
                <div className="flex items-center gap-3 w-full">
                  {isVisited ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="text-lg shrink-0">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
