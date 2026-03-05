import { GLOSSARY } from '@/lib/appMap';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface Props {
  term: string;
  children?: React.ReactNode;
}

export function GlossaryTooltip({ term, children }: Props) {
  const entry = GLOSSARY.find(g => g.term.toLowerCase() === term.toLowerCase());
  if (!entry) return <>{children || term}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/40">
          {children || term}
          <Info className="h-3 w-3 text-muted-foreground/60" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px]">
        <p className="font-semibold text-xs">{entry.term}</p>
        <p className="text-xs text-muted-foreground mt-1">{entry.shortDescription}</p>
      </TooltipContent>
    </Tooltip>
  );
}
