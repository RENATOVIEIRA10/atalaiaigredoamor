import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, FileText, Users, Heart, ClipboardCheck, Droplets, BookOpen } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FABAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

function getContextualActions(scopeType: string | null): FABAction[] {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun

  switch (scopeType) {
    case 'celula': {
      const actions: FABAction[] = [
        { id: 'relatorio', label: 'Relatório', icon: FileText, path: '/dashboard?tab=acoes&view=relatorio', color: 'bg-primary' },
        { id: 'membros', label: 'Membros', icon: Users, path: '/dashboard?tab=acoes&view=membros', color: 'bg-primary' },
        { id: 'novas-vidas', label: 'Nova Vida', icon: Heart, path: '/dashboard?tab=acoes&view=novas-vidas', color: 'bg-vida' },
      ];
      // If it's evening or typical cell meeting day, prioritize report
      if (hour >= 19 || day === 3 || day === 5) {
        return [actions[0], actions[2], actions[1]];
      }
      return actions;
    }
    case 'supervisor':
      return [
        { id: 'supervisao', label: 'Supervisão', icon: ClipboardCheck, path: '/dashboard?tab=cuidado', color: 'bg-primary' },
        { id: 'celulas', label: 'Células', icon: Users, path: '/dashboard?tab=visao-geral', color: 'bg-primary' },
        { id: 'novas-vidas', label: 'Nova Vida', icon: Heart, path: '/dashboard?tab=acoes&view=novas-vidas', color: 'bg-vida' },
      ];
    case 'coordenacao':
      return [
        { id: 'celulas', label: 'Células', icon: Users, path: '/dashboard', color: 'bg-primary' },
        { id: 'encaminhar', label: 'Encaminhar', icon: Heart, path: '/dashboard?tab=novas-vidas', color: 'bg-vida' },
        { id: 'supervisores', label: 'Supervisores', icon: ClipboardCheck, path: '/dashboard?tab=supervisoes', color: 'bg-primary' },
      ];
    case 'rede':
      return [
        { id: 'coordenacoes', label: 'Coordenações', icon: Users, path: '/dashboard', color: 'bg-primary' },
        { id: 'multiplicacao', label: 'Multiplicação', icon: BookOpen, path: '/dashboard?tab=multiplicacoes', color: 'bg-vida' },
        { id: 'novas-vidas', label: 'Novas Vidas', icon: Heart, path: '/dashboard?tab=novas-vidas', color: 'bg-vida' },
      ];
    case 'pastor_de_campo':
    case 'pastor_senior_global':
    case 'pastor':
      return [
        { id: 'redes', label: 'Redes', icon: Users, path: '/dashboard', color: 'bg-gold' },
        { id: 'conversoes', label: 'Conversões', icon: Heart, path: '/dashboard?tab=conversoes', color: 'bg-vida' },
        { id: 'batismos', label: 'Batismos', icon: Droplets, path: '/dashboard?tab=batismos', color: 'bg-primary' },
      ];
    default:
      return [
        { id: 'dashboard', label: 'Dashboard', icon: FileText, path: '/dashboard', color: 'bg-primary' },
        { id: 'membros', label: 'Membros', icon: Users, path: '/membros', color: 'bg-primary' },
      ];
  }
}

export function MagicFAB() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const { scopeType, isAdmin } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = useMemo(() => getContextualActions(scopeType), [scopeType]);

  if (!isPWA || !isMobile || isAdmin) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action items */}
      <AnimatePresence>
        {open && (
          <div className="fixed z-[61] right-5 flex flex-col-reverse items-end gap-3"
            style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            {actions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.05, duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={() => {
                  setOpen(false);
                  navigate(action.path);
                }}
                className="flex items-center gap-3 touch-manipulation"
              >
                <span className="text-sm font-medium text-foreground bg-card/90 backdrop-blur-lg px-3 py-1.5 rounded-lg border border-border/30 shadow-lg">
                  {action.label}
                </span>
                <div className={cn(
                  'h-11 w-11 rounded-full flex items-center justify-center shadow-lg',
                  action.color, 'text-primary-foreground'
                )}>
                  <action.icon className="h-5 w-5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed z-[61] right-5 h-14 w-14 rounded-full flex items-center justify-center',
          'shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] touch-manipulation',
          'bg-primary text-primary-foreground',
          'active:scale-95 transition-transform'
        )}
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 8px)' }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </>
  );
}
