import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, FileText, Users, Menu } from 'lucide-react';
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
  const { isPastor, isCelulaLeader, isSupervisor, isCoordenador, isRedeLeader, isAdmin } = useRole();
  const [menuOpen, setMenuOpen] = useState(false);

  // Only render in PWA + mobile
  if (!isPWA || !isMobile) return null;

  // Build nav items based on role
  const navItems: NavItem[] = [
    { label: 'Início', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Dados', icon: Activity, path: '/dados' },
    { label: 'Relatórios', icon: FileText, path: '/presenca' },
    { label: 'Pessoas', icon: Users, path: '/membros' },
  ];

  // Simpler nav for cell leaders
  if ((isCelulaLeader || isSupervisor) && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor) {
    navItems.splice(1, 2,
      { label: 'Relatórios', icon: FileText, path: '/presenca' },
    );
    // Result: Início, Relatórios, Pessoas, Menu
  }

  const isActive = (path: string) => location.pathname === path;

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
