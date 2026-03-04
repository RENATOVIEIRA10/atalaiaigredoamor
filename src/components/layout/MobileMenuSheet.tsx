import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { GitBranch, Settings, Network, FolderTree, LogOut, Moon, Heart, Eye, Home, FlaskConical, RefreshCw, PlayCircle, Repeat, HelpCircle } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AdminPWAPanel } from '@/components/dashboard/pwa/AdminPWAPanel';
import { CampoSelector } from '@/components/campo/CampoSelector';
import { usePastoralTour } from '@/hooks/usePastoralTour';
import { cn } from '@/lib/utils';

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const navigate = useNavigate();
  const { clearAccess, isAdmin, isRedeLeader, isCoordenador, isCelulaLeader, isSupervisor, isPastor, isPastorSeniorGlobal, isPastorDeCampo } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const { checkForUpdate, applyUpdate } = useServiceWorkerUpdate();
  const [checking, setChecking] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { openTour } = usePastoralTour();

  const handleCheckUpdate = async () => {
    setChecking(true);
    const found = await checkForUpdate();
    if (found) {
      applyUpdate();
    } else {
      setTimeout(() => setChecking(false), 1500);
    }
  };

  // showAdminItems removed — menu items are now role-gated explicitly
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  const goTo = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleLogout = () => {
    if (isDemoActive) deactivateDemo();
    clearAccess();
    onOpenChange(false);
    navigate('/');
  };

  const handleSwitchRole = () => {
    clearAccess();
    onOpenChange(false);
    navigate('/trocar-funcao');
  };

  const handleOpenAdminPanel = () => {
    onOpenChange(false);
    // Small delay to let sheet close before opening fullscreen panel
    setTimeout(() => setShowAdminPanel(true), 150);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] pb-safe">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base">Menu</SheetTitle>
          </SheetHeader>

          <div className="space-y-1 py-2">
            {/* Campo Selector for global/admin/pastor_de_campo */}
            {(isPastorSeniorGlobal || isAdmin || isPastorDeCampo) && (
              <div className="px-3 py-2">
                <CampoSelector />
              </div>
            )}

            {/* Admin PWA: prominent admin button */}
            {isAdmin && (
              <>
                <MenuButton
                  icon={Settings}
                  label="Administração"
                  onClick={handleOpenAdminPanel}
                  className="text-amber-600 dark:text-amber-400"
                />
                <div className="border-t border-border/30 my-2" />
              </>
            )}

            {/* PWA menu items: only show routes that are NOT blocked for each role */}
            {isSupervisor ? (
              // Supervisor PWA: organograma is blocked, so no nav items needed
              <></>
            ) : isCellLeaderOnly ? (
              // Cell leader PWA: organograma is allowed
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
              </>
            ) : (isCoordenador || isRedeLeader) ? (
              // Coord / Rede leader PWA: organograma + células allowed
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
                <MenuButton icon={Home} label="Células" onClick={() => goTo('/celulas')} />
              </>
            ) : (isPastor || isPastorSeniorGlobal || isPastorDeCampo) ? (
              // Pastor PWA: organograma + células (no admin tools)
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
                <MenuButton icon={Home} label="Células" onClick={() => goTo('/celulas')} />
              </>
            ) : isAdmin ? (
              // Admin: full access
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
                <MenuButton icon={Home} label="Células" onClick={() => goTo('/celulas')} />
                <div className="border-t border-border/30 my-2" />
                <MenuButton icon={Network} label="Redes" onClick={() => goTo('/redes')} />
                <MenuButton icon={FolderTree} label="Coordenações" onClick={() => goTo('/coordenacoes')} />
                <MenuButton icon={Settings} label="Configurações" onClick={() => goTo('/configuracoes')} />
                <MenuButton icon={FlaskConical} label="Ferramentas" onClick={() => goTo('/ferramentas-teste')} />
              </>
            ) : (
              // Default fallback: basic items only
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
              </>
            )}

            <div className="border-t border-border/30 my-2" />
            <MenuButton icon={PlayCircle} label="Manual do Usuário" onClick={() => goTo('/manual-usuario')} />
            <MenuButton icon={HelpCircle} label="Tour de Ajuda" onClick={() => { onOpenChange(false); setTimeout(openTour, 200); }} />
            <div className="border-t border-border/30 my-2" />

            {/* Demo mode: open admin panel to switch vision */}
            {isDemoActive && !isAdmin && (
              <MenuButton
                icon={Eye}
                label="Trocar Visão"
                onClick={handleOpenAdminPanel}
                className="text-amber-600 dark:text-amber-400"
              />
            )}

            <MenuButton
              icon={theme === 'padrao' ? Heart : Moon}
              label={theme === 'padrao' ? 'Tema Amor' : 'Tema Padrão'}
              onClick={() => { toggleTheme(); onOpenChange(false); }}
            />

            <MenuButton
              icon={RefreshCw}
              label={checking ? 'Verificando…' : 'Atualizar app'}
              onClick={handleCheckUpdate}
            />

            <div className="border-t border-border/30 my-2" />

            <MenuButton
              icon={Repeat}
              label="Trocar Função"
              onClick={handleSwitchRole}
              className="text-amber-600 dark:text-amber-400"
            />

            <MenuButton
              icon={LogOut}
              label="Sair"
              onClick={handleLogout}
              className="text-destructive"
            />
          </div>
        </SheetContent>
      </Sheet>

      {showAdminPanel && (
        <AdminPWAPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium',
        'active:bg-accent/60 touch-manipulation transition-colors',
        'text-foreground',
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
