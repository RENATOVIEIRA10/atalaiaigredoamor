import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, HeartPulse, Compass, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PastoralTourDialogProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: AlertTriangle,
    title: 'O que precisa da sua atenção',
    description:
      'Aqui você encontra o que é urgente: relatórios pendentes, alertas de aniversários e ações que precisam de resposta rápida. Cuide primeiro do que não pode esperar.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Movimento do Reino',
    description:
      'Veja como o Reino está avançando: novas vidas, multiplicações, batismos e o crescimento das células. Celebre cada vida alcançada.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: HeartPulse,
    title: 'Saúde e Cuidado',
    description:
      'Acompanhe a saúde da sua rede, supervisão ou célula: engajamento, discipulado e frequência. Cuide das pessoas com intencionalidade.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Compass,
    title: 'Como navegar',
    description:
      'Use o menu lateral (desktop) ou a barra inferior (celular) para acessar outros módulos. No topo da tela, o botão "Ver tudo" revela informações detalhadas quando precisar.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

export function PastoralTourDialog({ open, onClose }: PastoralTourDialogProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLast) {
      setStep(0);
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setStep(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-border/50">
        {/* Progress */}
        <div className="px-6 pt-5">
          <Progress value={progress} className="h-1.5 bg-muted" />
          <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
            Passo {step + 1} de {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-2 flex flex-col items-center text-center min-h-[220px] justify-center">
          <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center mb-4', current.bg)}>
            <current.icon className={cn('h-7 w-7', current.color)} />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2 leading-tight">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-1 text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1 min-w-[100px]"
          >
            {isLast ? (
              <>
                <Check className="h-4 w-4" />
                Entendi
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
