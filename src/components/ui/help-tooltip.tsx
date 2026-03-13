/**
 * HelpTooltip — ícone ℹ com tooltip explicativo
 * Torna o Atalaia autoexplicativo em todos os escopos.
 * Uso: <HelpTooltip text="O que esse dado significa..." />
 */
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  /** Texto explicativo exibido no tooltip */
  text: string;
  /** Lado do tooltip (padrão: top) */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Tamanho do ícone em px (padrão: 14) */
  size?: number;
  className?: string;
}

export function HelpTooltip({ text, side = 'top', size = 14, className }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shrink-0',
              className,
            )}
            aria-label="Mais informações"
          >
            <Info style={{ width: size, height: size }} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[260px] text-xs leading-snug font-normal text-center"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * DataOriginBadge — etiqueta discreta "Fonte: relatórios semanais"
 * Uso: <DataOriginBadge label="Dados dos relatórios semanais" />
 */
interface DataOriginBadgeProps {
  label: string;
  className?: string;
}

export function DataOriginBadge({ label, className }: DataOriginBadgeProps) {
  return (
    <p className={cn('label-mono text-[9px] text-muted-foreground/40 mt-0.5', className)}>
      {label}
    </p>
  );
}
