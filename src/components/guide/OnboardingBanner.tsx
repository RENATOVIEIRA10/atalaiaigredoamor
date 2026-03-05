import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingBanner() {
  const {
    shouldShow, steps, completedSteps, progress,
    totalSteps, completeStep, dismiss, currentStepIndex,
  } = useOnboarding();
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();

  if (!shouldShow) return null;

  const allDone = completedSteps.length >= totalSteps;

  return (
    <>
      {/* Banner */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {allDone ? '🎉 Treinamento concluído!' : `Guia rápido do Atalaia (Passo ${Math.min(currentStepIndex + 1, totalSteps)} de ${totalSteps})`}
            </p>
            <Progress value={progress} className="h-1.5 mt-2 bg-primary/10" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!allDone && (
              <Button size="sm" variant="default" className="h-8 text-xs rounded-lg" onClick={() => setSheetOpen(true)}>
                Começar
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={dismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet with steps */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Guia de Primeiros Passos</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {steps.map((step, i) => {
              const done = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all',
                    done
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border/50 bg-card/50 hover:border-primary/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-0.5 shrink-0 p-1.5 rounded-lg',
                      done ? 'text-emerald-500' : 'text-muted-foreground'
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    {!done && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-7 text-xs gap-1"
                        onClick={() => {
                          completeStep(step.id);
                          navigate(step.actionPath);
                          setSheetOpen(false);
                        }}
                      >
                        {step.actionLabel}
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { dismiss(); setSheetOpen(false); }}>
              Concluí meu treinamento
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
