import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Heart, ClipboardCheck, Users, Droplets, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { scopeType } = useRole();

  const allActions: QuickAction[] = [
    { label: 'Nova Vida', icon: Heart, path: '/recomeco', color: 'bg-rose-500/15 text-rose-500' },
    { label: 'Reunião', icon: ClipboardCheck, path: '/dashboard?tab=acoes', color: 'bg-blue-500/15 text-blue-500' },
    { label: 'Membro', icon: Users, path: '/membros', color: 'bg-violet-500/15 text-violet-500' },
    { label: 'Batismo', icon: Droplets, path: '/dashboard', color: 'bg-cyan-500/15 text-cyan-500' },
    { label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes', color: 'bg-emerald-500/15 text-emerald-500' },
  ];

  // Filter actions based on scope
  const actions = scopeType === 'celula'
    ? allActions.filter(a => ['Nova Vida', 'Reunião', 'Membro', 'Discipulado'].includes(a.label))
    : allActions;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border border-border/40',
            'bg-card/60 hover:bg-card transition-all duration-200',
            'active:scale-95 touch-manipulation card-hover'
          )}
        >
          <div className={cn('p-2.5 rounded-xl', action.color)}>
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-foreground">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
