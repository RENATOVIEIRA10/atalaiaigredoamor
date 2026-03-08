import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, FileText, Users, Menu, ClipboardCheck, Zap, History, Calendar, UserPlus, ArrowRight, Droplets, ListChecks, Eye } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/contexts/RoleContext';
import { MobileMenuSheet } from './MobileMenuSheet';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

export function MobileBottomNav() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isSupervisor, isCoordenador, isRedeLeader, isCelulaLeader, isAdmin, isPastor,
    isDemoInstitucional, isPastorSeniorGlobal, isPastorDeCampo,
    isRecomecoCadastro, isCentralCelulas, isLiderRecomecoCentral,
    isLiderBatismoAclamacao, isCentralBatismoAclamacao,
  } = useRole();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isPWA || !isMobile) return null;

  let navItems: NavItem[];
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  // ── Ministry scopes ──
  if (isRecomecoCadastro) {
    navItems = [
      { label: 'Cadastrar', icon: UserPlus, path: '/dashboard' },
      { label: 'Minhas', icon: ListChecks, path: '/dashboard?tab=minhas' },
      { label: 'Tracking', icon: Eye, path: '/dashboard?tab=acompanhamento' },
    ];
  } else if (isLiderRecomecoCentral) {
    navItems = [
      { label: 'Recomeço', icon: Heart, path: '/dashboard' },
      { label: 'Central', icon: ArrowRight, path: '/dashboard?tab=central' },
      { label: 'Funil', icon: Eye, path: '/dashboard?tab=acompanhamento' },
    ];
  } else if (isCentralCelulas) {
    navItems = [
      { label: 'Fila', icon: ArrowRight, path: '/dashboard' },
      { label: 'Acompanhar', icon: Eye, path: '/dashboard?tab=acompanhamento' },
    ];
  } else if (isCentralBatismoAclamacao) {
    navItems = [{ label: 'Inscritos', icon: Droplets, path: '/dashboard' }];
  } else if (isLiderBatismoAclamacao) {
    navItems = [{ label: 'Eventos', icon: Droplets, path: '/dashboard' }];
  } else if (isDemoInstitucional) {
    navItems = [{ label: 'Início', icon: LayoutDashboard, path: '/home' }];
  } else if (isPastorSeniorGlobal || isPastorDeCampo || isPastor) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/home' },
      { label: 'Visão', icon: Heart, path: '/dashboard' },
      { label: 'Radar', icon: ClipboardCheck, path: '/radar' },
    ];
  } else if (isCellLeaderOnly) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/home' },
      { label: 'Ações', icon: Zap, path: '/dashboard?tab=acoes' },
      { label: 'Histórico', icon: History, path: '/dashboard?tab=historico' },
    ];
  } else if (isSupervisor) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/home' },
      { label: 'Plano', icon: Calendar, path: '/dashboard?tab=plano' },
      { label: 'Ações', icon: Zap, path: '/dashboard?tab=acoes' },
    ];
  } else if (isCoordenador || isRedeLeader) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/home' },
      { label: 'Visão', icon: Heart, path: '/dashboard' },
      { label: 'Radar', icon: ClipboardCheck, path: '/radar' },
    ];
  } else {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/home' },
      { label: 'Visão', icon: Heart, path: '/dashboard' },
      { label: 'Pessoas', icon: Users, path: '/membros' },
    ];
  }

  const isActive = (path: string) => {
    const [pathPart, queryPart] = path.split('?');
    if (queryPart) {
      return location.pathname === pathPart && location.search === `?${queryPart}`;
    }
    return location.pathname === pathPart && !location.search;
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/20"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'linear-gradient(to top, hsl(222 47% 6% / 0.98), hsl(222 47% 8% / 0.92))',
          backdropFilter: 'blur(20px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          boxShadow: '0 -1px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 min-h-[56px] transition-colors',
                  'active:bg-accent/30 touch-manipulation',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] leading-tight', active ? 'font-bold' : 'font-medium')}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute bottom-1 h-0.5 w-5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 min-h-[56px] transition-colors',
              'active:bg-accent/30 touch-manipulation',
              'text-muted-foreground'
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] leading-tight font-medium">Menu</span>
          </button>
        </div>
      </nav>

      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
