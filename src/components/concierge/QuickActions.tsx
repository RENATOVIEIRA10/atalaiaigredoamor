import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Heart, ClipboardCheck, Users, Droplets, BookOpen, Eye, BarChart3 } from 'lucide-react';
import { getScopeLevel } from '@/hooks/useSummaryMetrics';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  glowColor: string;
  scopes: string[]; // allowed scope levels
}

const ALL_ACTIONS: QuickAction[] = [
  { id: 'nova-vida', label: 'Nova Vida', icon: Heart, path: '/recomeco', color: 'bg-rose-500/10 text-rose-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(0_84%_60%/0.1)]', scopes: ['celula', 'supervisor', 'coordenacao', 'rede', 'pastor', 'global', 'ministerio'] },
  { id: 'reuniao', label: 'Reunião', icon: ClipboardCheck, path: '/dashboard?tab=acoes', color: 'bg-blue-500/10 text-blue-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(217_91%_60%/0.1)]', scopes: ['celula'] },
  { id: 'membro', label: 'Membro', icon: Users, path: '/membros', color: 'bg-violet-500/10 text-violet-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(263_70%_50%/0.1)]', scopes: ['celula', 'supervisor', 'coordenacao', 'rede', 'pastor', 'global'] },
  { id: 'batismo', label: 'Batismo', icon: Droplets, path: '/dashboard', color: 'bg-cyan-500/10 text-cyan-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(187_85%_53%/0.1)]', scopes: ['coordenacao', 'rede', 'pastor', 'global'] },
  { id: 'discipulado', label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes', color: 'bg-emerald-500/10 text-emerald-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(160_84%_39%/0.1)]', scopes: ['celula', 'coordenacao', 'rede'] },
  { id: 'radar', label: 'Radar', icon: Eye, path: '/radar', color: 'bg-amber-500/10 text-amber-400', glowColor: 'group-hover:shadow-[0_0_20px_hsl(38_92%_50%/0.1)]', scopes: ['supervisor', 'coordenacao', 'rede', 'pastor', 'global'] },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard', color: 'bg-primary/10 text-primary', glowColor: 'group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]', scopes: ['supervisor', 'coordenacao', 'rede', 'pastor', 'global'] },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { scopeType } = useRole();
  const level = getScopeLevel(scopeType);

  const actions = ALL_ACTIONS.filter(a => a.scopes.includes(level));

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {actions.slice(0, 5).map((action) => (
        <button
          key={action.id}
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
