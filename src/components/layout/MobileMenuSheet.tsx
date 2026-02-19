import { useNavigate } from 'react-router-dom';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { GitBranch, Settings, Network, FolderTree, LogOut, Moon, Heart, Eye, Home, FlaskConical } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const navigate = useNavigate();
  const { clearAccess, isAdmin, isRedeLeader, isCoordenador } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();

  const showAdminItems = isAdmin || isRedeLeader || isDemoActive;

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] pb-safe">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-1 py-2">
          <MenuButton icon={GitBranch} label="Organograma" onClick={() => goTo('/organograma')} />
          <MenuButton icon={Home} label="Células" onClick={() => goTo('/celulas')} />

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

          <div className="border-t border-border/30 my-2" />

          {(isAdmin || isDemoActive) && (
            <MenuButton
              icon={Eye}
              label={isDemoActive ? 'Trocar Visão' : 'Modo Demonstração'}
              onClick={() => {
                onOpenChange(false);
                // Re-open demo dialog would need state lifting; for now navigate
              }}
              className="text-amber-600 dark:text-amber-400"
            />
          )}

          <MenuButton
            icon={theme === 'padrao' ? Heart : Moon}
            label={theme === 'padrao' ? 'Tema Amor' : 'Tema Padrão'}
            onClick={() => { toggleTheme(); onOpenChange(false); }}
          />

          <div className="border-t border-border/30 my-2" />

          <MenuButton
            icon={LogOut}
            label="Sair"
            onClick={handleLogout}
            className="text-destructive"
          />
        </div>
      </SheetContent>
    </Sheet>
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
