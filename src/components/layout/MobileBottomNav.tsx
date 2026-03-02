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

  // Only render in PWA + mobile
  if (!isPWA || !isMobile) return null;

  let navItems: NavItem[];
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  // ── Ministry scopes ──
  if (isRecomecoCadastro) {
    // Recomeço Operador: Cadastrar, Minhas, Tracking
    navItems = [
      { label: 'Cadastrar', icon: UserPlus, path: '/dashboard' },
      { label: 'Minhas', icon: ListChecks, path: '/dashboard?tab=minhas' },
      { label: 'Tracking', icon: Eye, path: '/dashboard?tab=acompanhamento' },
    ];
  } else if (isLiderRecomecoCentral) {
    // Líder Recomeço + Central: Recomeço, Central, Funil, Auditoria
    navItems = [
      { label: 'Recomeço', icon: Heart, path: '/dashboard' },
      { label: 'Central', icon: ArrowRight, path: '/dashboard?tab=central' },
      { label: 'Funil', icon: Eye, path: '/dashboard?tab=acompanhamento' },
    ];
  } else if (isCentralCelulas) {
    // Central de Células Operador: Fila, Acompanhamento
    navItems = [
      { label: 'Fila', icon: ArrowRight, path: '/dashboard' },
      { label: 'Acompanhar', icon: Eye, path: '/dashboard?tab=acompanhamento' },
    ];
  } else if (isCentralBatismoAclamacao) {
    // Central Batismo: Inscritos, Inscrever
    navItems = [
      { label: 'Inscritos', icon: Droplets, path: '/dashboard' },
    ];
  } else if (isLiderBatismoAclamacao) {
    // Líder Batismo: Eventos, Inscritos
    navItems = [
      { label: 'Eventos', icon: Droplets, path: '/dashboard' },
    ];
  } else if (isDemoInstitucional) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
    ];
  } else if (isPastorSeniorGlobal || isPastorDeCampo || isPastor) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Pulso', icon: Heart, path: '/dashboard?tab=pulso' },
      { label: 'Ações', icon: Zap, path: '/dashboard?tab=acoes' },
    ];
  } else if (isCellLeaderOnly) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Ações', icon: Zap, path: '/dashboard?tab=acoes' },
      { label: 'Histórico', icon: History, path: '/dashboard?tab=historico' },
    ];
  } else if (isSupervisor) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Plano', icon: Calendar, path: '/dashboard?tab=plano' },
      { label: 'Ações', icon: Zap, path: '/dashboard?tab=acoes' },
      { label: 'Histórico', icon: History, path: '/dashboard?tab=historico' },
    ];
  } else if (isCoordenador || isRedeLeader) {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Pulso', icon: Heart, path: '/dashboard?tab=pulso' },
      { label: 'Ações', icon: Zap, path: '/dashboard?tab=acoes' },
    ];
  } else {
    navItems = [
      { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Pulso', icon: Heart, path: '/dashboard?tab=pulso' },
      { label: 'Relatórios', icon: FileText, path: '/presenca' },
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 safe-area-bottom"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -1px 8px rgba(0,0,0,0.15)',
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
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-colors',
                  'active:bg-accent/50 touch-manipulation',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                <span className={cn(
                  'text-[10px] leading-tight',
                  active ? 'font-semibold' : 'font-medium'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] transition-colors',
              'active:bg-accent/50 touch-manipulation',
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
