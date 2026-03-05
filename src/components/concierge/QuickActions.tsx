import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Heart, ClipboardCheck, Users, Droplets, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  glowColor: string;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { scopeType } = useRole();

  const allActions: QuickAction[] = [
    { label: 'Nova Vida', icon: Heart, path: '/recomeco', color: 'bg-rose-500/10 text-rose-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(0_84%_60%/0.1)]' },
    { label: 'Reunião', icon: ClipboardCheck, path: '/dashboard?tab=acoes', color: 'bg-blue-500/10 text-blue-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(217_91%_60%/0.1)]' },
    { label: 'Membro', icon: Users, path: '/membros', color: 'bg-violet-500/10 text-violet-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(263_70%_50%/0.1)]' },
    { label: 'Batismo', icon: Droplets, path: '/dashboard', color: 'bg-cyan-500/10 text-cyan-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(187_85%_53%/0.1)]' },
    { label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes', color: 'bg-emerald-500/10 text-emerald-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(160_84%_39%/0.1)]' },
  ];

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
            'group flex flex-col items-center gap-2.5 p-4 rounded-xl',
            'border border-border/30 bg-card/40 hover:bg-card/70',
            'transition-all duration-200 active:scale-95 touch-manipulation',
            action.glowColor
          )}
        >
          <div className={cn('p-2.5 rounded-xl', action.color)}>
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
