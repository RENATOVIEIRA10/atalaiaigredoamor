import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface InitialViewGateProps {
  children: React.ReactNode;
}

/**
 * Wraps secondary/detailed content that should be hidden in the
 * simplified "Visão Inicial". Only the 3 MissionBlocks are shown
 * by default; everything inside this gate is revealed on demand.
 */
export function InitialViewGate({ children }: InitialViewGateProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="space-y-4">
      {showAll && children}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setShowAll(prev => !prev)}
      >
        {showAll ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Simplificar
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Ver tudo
          </>
        )}
      </Button>
    </div>
  );
}
