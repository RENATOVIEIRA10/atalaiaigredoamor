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
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';

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
        { id: 'nova-vida', label: 'Nova Vida', icon: Heart, path: '/recomeco' },
        { id: 'reuniao', label: 'Reunião', icon: ClipboardCheck, path: '/dashboard?tab=acoes' },
        { id: 'membro', label: 'Membro', icon: Users, path: '/membros' },
        { id: 'batismo', label: 'Batismo', icon: Droplets, path: '/dashboard' },
        { id: 'discipulado', label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes' },
      ];

    case 'supervisor':
    case 'coordenacao':
    case 'rede':
      return [
        { id: 'reuniao', label: 'Reunião', icon: ClipboardCheck, path: '/dashboard?tab=acoes' },
        { id: 'membro', label: 'Membros', icon: Users, path: '/membros' },
        { id: 'discipulado', label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes' },
        { id: 'listas', label: 'Listas', icon: ListChecks, path: '/dashboard' },
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
        { id: 'ver-redes', label: 'Ver Redes', icon: Network, path: '/redes' },
        { id: 'preparar-reuniao', label: 'Preparar Reunião', icon: CalendarDays, path: '/dashboard' },
        { id: 'ver-novas-vidas', label: 'Ver Novas Vidas', icon: Eye, path: '/recomeco' },
      ];

    case 'pastor_senior_global':
    case 'pastor':
    case 'admin':
      return [
        { id: 'ver-campus', label: 'Ver Campus', icon: Building2, path: '/dados' },
        { id: 'ver-redes', label: 'Ver Redes', icon: Network, path: '/redes' },
        { id: 'preparar-reuniao', label: 'Preparar Reunião', icon: CalendarDays, path: '/dashboard' },
        { id: 'ver-novas-vidas', label: 'Ver Novas Vidas', icon: Eye, path: '/recomeco' },
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
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => navigate(action.path)}
          className="flex items-center justify-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-4 min-h-14 text-left hover:bg-accent/30 transition-colors touch-manipulation"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <action.icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-foreground leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
