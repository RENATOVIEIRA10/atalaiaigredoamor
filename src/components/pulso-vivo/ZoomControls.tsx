/**
 * ZoomControls – Elegant zoom level selector for the constellation view.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  zoomLevel: number;
  onZoomChange: (level: number) => void;
}

const LEVELS = [
  { level: 1, label: 'Campus', description: 'Visão macro' },
  { level: 2, label: 'Redes', description: 'Constelações' },
  { level: 3, label: 'Coordenações', description: 'Agrupamentos' },
  { level: 4, label: 'Supervisões', description: 'Conexões' },
  { level: 5, label: 'Células', description: 'Pontos de vida' },
];

export function ZoomControls({ zoomLevel, onZoomChange }: Props) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1 bg-card/90 backdrop-blur-xl border border-border/30 rounded-2xl p-2 shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.5)]">
      {LEVELS.map(l => {
        const isActive = zoomLevel >= l.level;
        return (
          <button
            key={l.level}
            onClick={() => onZoomChange(l.level)}
            className={cn(
              'relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200',
              zoomLevel === l.level
                ? 'bg-primary/15 text-primary'
                : isActive
                ? 'text-foreground/80 hover:bg-accent/50'
                : 'text-muted-foreground/50 hover:bg-accent/30 hover:text-muted-foreground'
            )}
          >
            {zoomLevel === l.level && (
              <motion.div
                layoutId="zoom-indicator"
                className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <div className={cn(
              'relative z-10 w-2 h-2 rounded-full transition-colors duration-200',
              zoomLevel === l.level ? 'bg-primary' : isActive ? 'bg-foreground/40' : 'bg-muted-foreground/20'
            )} />
            <div className="relative z-10">
              <p className="text-xs font-semibold leading-tight">{l.label}</p>
              <p className="text-[10px] opacity-60">{l.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
