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
        { id: 'preparar-reuniao', label: 'Reunião', icon: CalendarDays, path: '/dashboard' },
        { id: 'ver-novas-vidas', label: 'Novas Vidas', icon: Eye, path: '/recomeco' },
      ];
    case 'pastor_senior_global':
    case 'pastor':
    case 'admin':
      return [
        { id: 'ver-campus', label: 'Campus', icon: Building2, path: '/dados' },
        { id: 'ver-redes', label: 'Redes', icon: Network, path: '/redes' },
        { id: 'preparar-reuniao', label: 'Reunião', icon: CalendarDays, path: '/dashboard' },
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
