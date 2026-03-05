import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Heart, ClipboardCheck, Users, Droplets, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const actions = [
  { label: 'Nova Vida', icon: Heart, path: '/recomeco', color: 'bg-rose-500' },
  { label: 'Reunião', icon: ClipboardCheck, path: '/dashboard?tab=acoes', color: 'bg-blue-500' },
  { label: 'Membro', icon: Users, path: '/membros', color: 'bg-violet-500' },
  { label: 'Batismo', icon: Droplets, path: '/dashboard', color: 'bg-cyan-500' },
  { label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes', color: 'bg-emerald-500' },
];

export function FAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action items */}
      <AnimatePresence>
        {open && (
          <div className="fixed bottom-24 right-5 z-50 flex flex-col-reverse gap-3 items-end">
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.04, duration: 0.15 }}
                onClick={() => { setOpen(false); navigate(action.path); }}
                className="flex items-center gap-3 touch-manipulation"
              >
                <span className="text-xs font-medium text-foreground bg-card/90 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-border/40 shadow-lg">
                  {action.label}
                </span>
                <div className={cn('p-3 rounded-full shadow-lg shadow-black/30', action.color)}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-20 right-5 z-50 p-4 rounded-full',
          'bg-primary text-primary-foreground',
          'active:scale-95 transition-all duration-200 touch-manipulation',
          'shadow-[0_4px_24px_hsl(var(--primary)/0.35)]',
          'hover:shadow-[0_4px_32px_hsl(var(--primary)/0.45)]'
        )}
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </>
  );
}
