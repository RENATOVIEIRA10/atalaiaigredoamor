import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  Droplets,
  Heart,
  Network,
  Users,
  Building2,
  ArrowRightLeft,
  Eye,
  CalendarDays,
  ListChecks,
  FileText,
  Activity,
  Layers,
  TrendingUp,
  BarChart3,
  Map,
  MessageSquare,
  Home,
  UserCheck,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

function buildQuickActions(scopeType: string | null): QuickActionItem[] {
  switch (scopeType) {
    case 'celula':
      return [
        { id: 'relatorio', label: 'Relatório', icon: FileText, path: '/dashboard?tab=acoes&view=relatorio' },
        { id: 'membros', label: 'Membros', icon: Users, path: '/dashboard?tab=acoes&view=membros' },
        { id: 'discipulado', label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes&view=discipulado' },
        { id: 'novas-vidas', label: 'Novas Vidas', icon: Heart, path: '/dashboard?tab=acoes&view=novas-vidas' },
      ];
    case 'supervisor':
      return [
        { id: 'visao-geral', label: 'Células', icon: Home, path: '/dashboard?tab=visao-geral' },
        { id: 'cuidado', label: 'Supervisões', icon: ClipboardCheck, path: '/dashboard?tab=cuidado' },
      ];
    case 'coordenacao':
      return [
        { id: 'celulas', label: 'Células', icon: Home, path: '/dashboard?tab=acoes&view=celulas' },
        { id: 'acompanhamento', label: 'Acompanhamento', icon: ClipboardCheck, path: '/dashboard?tab=acoes&view=supervisoes' },
        { id: 'novas-vidas', label: 'Novas Vidas', icon: Heart, path: '/dashboard?tab=acoes&view=novas-vidas' },
        { id: 'lideres', label: 'Líderes', icon: UserCheck, path: '/dashboard?tab=acoes&view=lideres' },
      ];
    case 'rede':
      return [
        { id: 'visao-geral', label: 'Coordenações', icon: Layers, path: '/dashboard?tab=visao-geral' },
        { id: 'lideres', label: 'Líderes', icon: UserCheck, path: '/organograma' },
        { id: 'acompanhamento', label: 'Acompanhamento', icon: ClipboardCheck, path: '/dashboard?tab=acompanhamento' },
        { id: 'analises', label: 'Movimento & Saúde', icon: Activity, path: '/dashboard?tab=analises' },
        { id: 'radar', label: 'Radar', icon: BarChart3, path: '/radar' },
      ];
    case 'recomeco_cadastro':
      return [{ id: 'nova-vida', label: 'Nova Vida', icon: Heart, path: '/recomeco' }];
    case 'central_celulas':
      return [
        { id: 'encaminhamentos', label: 'Encaminhamentos', icon: ArrowRightLeft, path: '/central-celulas' },
        { id: 'triagem', label: 'Triagem', icon: Eye, path: '/dashboard' },
      ];
    case 'central_batismo_aclamacao':
    case 'lider_batismo_aclamacao':
      return [
        { id: 'inscricoes-batismo', label: 'Inscrições', icon: Droplets, path: '/dashboard' },
        { id: 'listas-batismo', label: 'Listas', icon: ListChecks, path: '/dashboard' },
      ];
    case 'lider_recomeco_central':
      return [
        { id: 'nova-vida', label: 'Nova Vida', icon: Heart, path: '/dashboard' },
        { id: 'encaminhamentos', label: 'Central', icon: ArrowRightLeft, path: '/dashboard?tab=central' },
      ];
    case 'pastor_de_campo':
      return [
        { id: 'visao-geral', label: 'Visão do Campus', icon: Eye, path: '/dashboard?tab=visao-geral' },
        { id: 'redes', label: 'Redes', icon: Network, path: '/dashboard?tab=visao-geral' },
        { id: 'movimento', label: 'Crescimento', icon: TrendingUp, path: '/dashboard?tab=movimento' },
        { id: 'pastoral', label: 'Radar Pastoral', icon: Activity, path: '/dashboard?tab=pastoral' },
        { id: 'reuniao', label: 'Reunião com Líderes', icon: MessageSquare, path: '/dashboard?tab=pastoral' },
      ];
    case 'pastor_senior_global':
    case 'pastor':
      return [
        { id: 'visao-geral', label: 'Visão Global', icon: Eye, path: '/dashboard?tab=visao-geral' },
        { id: 'campos', label: 'Campos', icon: Map, path: '/dashboard?tab=visao-geral' },
        { id: 'movimento', label: 'Expansão', icon: TrendingUp, path: '/dashboard?tab=movimento' },
        { id: 'pastoral', label: 'Radar Estratégico', icon: BarChart3, path: '/dashboard?tab=pastoral' },
      ];
    case 'admin':
      return [
        { id: 'ver-campus', label: 'Campus', icon: Building2, path: '/configuracoes?tab=campos' },
        { id: 'ver-redes', label: 'Redes', icon: Network, path: '/redes' },
        { id: 'ver-novas-vidas', label: 'Novas Vidas', icon: Eye, path: '/recomeco' },
      ];
    default:
      return [];
  }
}

export function QuickActionsBar() {
  const navigate = useNavigate();
  const { scopeType } = useRole();
  const actions = useMemo(() => buildQuickActions(scopeType), [scopeType]);

  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => navigate(action.path)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border border-border/30 bg-background/20 px-3.5 py-2.5',
            'text-sm font-medium text-foreground/80 transition-all duration-200',
            'hover:border-primary/30 hover:bg-primary/8 hover:text-foreground',
            'hover:shadow-[0_8px_20px_-12px_hsl(var(--primary)/0.3)]',
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <action.icon className="h-3 w-3" />
          </span>
          <span className="text-[13px] leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );
}