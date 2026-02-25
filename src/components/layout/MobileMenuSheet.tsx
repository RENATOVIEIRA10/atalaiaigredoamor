import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { GitBranch, Settings, Network, FolderTree, LogOut, Moon, Heart, Eye, Home, FlaskConical, FileText, Activity, RefreshCw, PlayCircle, Repeat } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AdminPWAPanel } from '@/components/dashboard/pwa/AdminPWAPanel';
import { cn } from '@/lib/utils';

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const navigate = useNavigate();
  const { clearAccess, isAdmin, isRedeLeader, isCoordenador, isCelulaLeader, isSupervisor, isPastor } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const { checkForUpdate, applyUpdate } = useServiceWorkerUpdate();
  const [checking, setChecking] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleCheckUpdate = async () => {
    setChecking(true);
    const found = await checkForUpdate();
    if (found) {
      applyUpdate();
    } else {
      setTimeout(() => setChecking(false), 1500);
    }
  };

  const showAdminItems = isAdmin || isRedeLeader || isDemoActive;
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

            {/* Supervisor PWA: minimal menu items */}
            {isSupervisor ? (
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
              </>
            ) : (isCoordenador || isRedeLeader) ? (
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
                <MenuButton icon={Home} label="Células" onClick={() => goTo('/celulas')} />
              </>
            ) : isCellLeaderOnly ? (
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
              </>
            ) : (
              <>
                <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
                <MenuButton icon={Home} label="Células" onClick={() => goTo('/celulas')} />

                {isCellLeaderOnly && (
                  <MenuButton icon={Activity} label="Dados" onClick={() => goTo('/dados')} />
                )}

                {(showAdminItems || isCoordenador) && (
                  <>
                    <div className="border-t border-border/30 my-2" />
                    {showAdminItems && (
                      <>
                        <MenuButton icon={Network} label="Redes" onClick={() => goTo('/redes')} />
                        <MenuButton icon={FolderTree} label="Coordenações" onClick={() => goTo('/coordenacoes')} />
                        <MenuButton icon={Settings} label="Configurações" onClick={() => goTo('/configuracoes')} />
                        <MenuButton icon={FlaskConical} label="Ferramentas" onClick={() => goTo('/ferramentas-teste')} />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <div className="border-t border-border/30 my-2" />
            <MenuButton icon={PlayCircle} label="Manual do Usuário" onClick={() => goTo('/manual-usuario')} />
            <div className="border-t border-border/30 my-2" />

            {/* Demo mode shortcut for non-admin path (when already in demo) */}
            {isDemoActive && !isAdmin && (
              <MenuButton
                icon={Eye}
                label="Trocar Visão"
                onClick={() => {
                  onOpenChange(false);
                }}
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
