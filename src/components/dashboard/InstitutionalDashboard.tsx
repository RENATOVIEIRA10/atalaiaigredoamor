import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Heart, ClipboardCheck, Network, Shield, BookOpen, Eye } from 'lucide-react';

const systemCards = [
  {
    icon: LayoutDashboard,
    title: 'Dashboards por Função',
    description: 'Cada líder (Célula, Supervisor, Coordenador, Rede) possui um painel exclusivo com as informações e métricas relevantes ao seu escopo de atuação.',
  },
  {
    icon: ClipboardCheck,
    title: 'Relatórios Semanais',
    description: 'Líderes de célula registram semanalmente os dados de presença, visitantes, discipulados e crianças, alimentando o sistema de métricas em tempo real.',
  },
  {
    icon: Heart,
    title: 'Pulso Pastoral',
    description: 'Indicadores agregados de saúde espiritual e organizacional das células, supervisões e coordenações — visíveis para cada nível da hierarquia.',
  },
  {
    icon: Users,
    title: 'Gestão de Membros',
    description: 'Cadastro completo de membros com marcos espirituais (batismo, Encontro com Deus, Curso Lidere, etc.), fotos de casais e perfis individuais.',
  },
  {
    icon: Network,
    title: 'Organograma',
    description: 'Visualização hierárquica completa: Rede → Coordenações → Supervisores → Células, com fotos dos casais líderes em cada nível.',
  },
  {
    icon: Shield,
    title: 'Supervisões',
    description: 'Supervisores registram visitas às células com checklist detalhado (oração, louvor, quebra-gelo, lição, etc.), gerando métricas de qualidade pastoral.',
  },
  {
    icon: BookOpen,
    title: 'Material Institucional',
    description: 'Acesso a documentos, manuais do líder e do usuário, perguntas frequentes e recursos de apoio para toda a rede.',
  },
  {
    icon: Eye,
    title: 'Modo Demonstração (Admin)',
    description: 'Administradores podem visualizar dashboards de qualquer nível hierárquico sem alterar dados, para auditoria e treinamento.',
  },
];

export function InstitutionalDashboard() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Bem-vinda, Milka.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este é o <strong>Painel Institucional do Atalaia</strong>, criado para apresentar a proposta, 
                organização e funcionamento do sistema.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2 italic">
                Este acesso é apenas para visualização. Nenhuma ação de edição, criação ou exclusão está disponível.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div>
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-widest mb-4">
          Visão Geral do Sistema
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {systemCards.map((card) => (
            <Card key={card.title} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <card.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground/50 text-center italic pt-4">
        Perfil Institucional — Demonstração · Somente leitura
      </p>
    </div>
  );
}
