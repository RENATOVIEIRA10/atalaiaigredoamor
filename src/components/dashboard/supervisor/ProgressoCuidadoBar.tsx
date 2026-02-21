import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Heart } from 'lucide-react';

interface ProgressoCuidadoBarProps {
  totalCells: number;
  completedCells: number;
  bimestreLabel: string;
}

function getPastoralCopy(pct: number): string {
  if (pct >= 100) return 'Bimestre acompanhado com fidelidade';
  if (pct >= 81) return 'Quase concluído';
  if (pct >= 51) return 'Boa cobertura pastoral';
  if (pct >= 21) return 'Cuidado em andamento';
  return 'Início do cuidado';
}

export function ProgressoCuidadoBar({ totalCells, completedCells, bimestreLabel }: ProgressoCuidadoBarProps) {
  const [badgeShown, setBadgeShown] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const pct = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;
  const isComplete = pct >= 100;

  useEffect(() => {
    if (isComplete && !badgeShown) {
      const key = `badge_shown_${bimestreLabel}`;
      const already = sessionStorage.getItem(key);
      if (!already) {
        sessionStorage.setItem(key, 'true');
        const timer = setTimeout(() => setAnimateIn(true), 100);
        return () => clearTimeout(timer);
      } else {
        setAnimateIn(true);
      }
      setBadgeShown(true);
    }
  }, [isComplete, badgeShown, bimestreLabel]);

  if (totalCells === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">Sem células atribuídas neste bimestre</p>
        </CardContent>
      </Card>
    );
  }

  const copy = getPastoralCopy(pct);

  return (
    <Card className={isComplete ? 'border-green-500/30' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Progresso do Cuidado</h3>
          </div>
          {isComplete && (
            <div className={`flex items-center gap-1.5 transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-600">Cobertura concluída</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{copy}</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>

        <p className="text-xs text-muted-foreground">
          {completedCells}/{totalCells} células acompanhadas · {bimestreLabel}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Mini version for coordinator dashboard ──

interface MiniProgressBarProps {
  label: string;
  total: number;
  completed: number;
}

export function MiniProgressBar({ label, total, completed }: MiniProgressBarProps) {
  if (total === 0) return null;
  const pct = Math.round((completed / total) * 100);
  const isComplete = pct >= 100;
  const copy = getPastoralCopy(pct);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
          <span className="text-xs font-semibold">{pct}%</span>
        </div>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{copy}</span>
        <span>{completed}/{total}</span>
      </div>
    </div>
  );
}
