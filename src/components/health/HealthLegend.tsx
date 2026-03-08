/**
 * HealthLegend – Reusable legend + explainability for health statuses.
 * Shows a fixed legend bar and optional "why" tooltips/drawers.
 */

import { useState } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ── Standard health presets ──

export type HealthPreset = 'pastoral' | 'supervisor' | 'radar' | 'concierge';

interface LegendItem {
  emoji: string;
  label: string;
  description: string;
  cls: string;
}

const LEGEND_PRESETS: Record<HealthPreset, LegendItem[]> = {
  pastoral: [
    { emoji: '🟢', label: 'Saudável', description: 'Supervisões em dia, células ativas e discipulado fluindo', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    { emoji: '🟡', label: 'Atenção', description: 'Oscilação em supervisões, queda de engajamento ou poucos avanços recentes', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { emoji: '🔴', label: 'Crítico', description: 'Ausência prolongada de supervisão, células inativas ou perda de membros', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
  ],
  supervisor: [
    { emoji: '🟢', label: 'Estável', description: 'Nota média ≥ 4.0 nas últimas supervisões', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    { emoji: '🟡', label: 'Atenção', description: 'Nota média entre 3.0 e 3.9 — pontos a acompanhar', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { emoji: '🔴', label: 'Prioridade de cuidado', description: 'Nota média abaixo de 3.0 — necessidade de ação pastoral', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
    { emoji: '⚪', label: 'Sem avaliação', description: 'Nenhuma supervisão registrada ainda', cls: 'bg-muted/50 text-muted-foreground border-muted' },
  ],
  radar: [
    { emoji: '🟢', label: 'Saudável', description: 'Relatório em dia e membros ativos suficientes', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    { emoji: '🟡', label: 'Atenção', description: 'Sem relatório esta semana ou poucos membros ativos', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { emoji: '🔴', label: 'Risco', description: 'Sem reunião há várias semanas ou pouca atividade', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
  ],
  concierge: [
    { emoji: '🟢', label: 'Crescendo', description: 'Novas vidas chegando, membros crescendo e multiplicações recentes', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    { emoji: '🟡', label: 'Estável', description: 'Crescimento neutro, poucas conversões recentes', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    { emoji: '🔴', label: 'Atenção', description: 'Queda de engajamento, redução de membros ou liderança sem acompanhamento', cls: 'bg-destructive/10 text-destructive border-destructive/30' },
  ],
};

// ── Calculation factors ──

const FACTORS_MAP: Record<HealthPreset, string[]> = {
  pastoral: [
    'Supervisões recentes realizadas',
    'Atividade das células (relatórios semanais)',
    'Movimento de discipulado',
    'Novas vidas integradas',
    'Constância ministerial',
  ],
  supervisor: [
    'Checklist da supervisão (oração, louvor, lição, etc.)',
    'Qualidade observada (comunhão, pontualidade, dinâmica)',
    'Média das 3 últimas supervisões',
    'Tendência de evolução (subindo, estável ou descendo)',
  ],
  radar: [
    'Relatórios semanais enviados',
    'Frequência de reuniões nas últimas 3 semanas',
    'Quantidade de membros ativos na célula',
  ],
  concierge: [
    'Quantidade de novas vidas no mês',
    'Membros ativos por unidade',
    'Número de células ativas',
    'Conversões e integração de novas vidas',
  ],
};

// ── Legend Bar Component ──

interface HealthLegendProps {
  preset: HealthPreset;
  compact?: boolean;
  className?: string;
}

export function HealthLegend({ preset, compact = false, className }: HealthLegendProps) {
  const items = LEGEND_PRESETS[preset];
  const factors = FACTORS_MAP[preset];
  const [showFactors, setShowFactors] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {items.map(item => (
          <TooltipProvider key={item.label} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    'cursor-help text-[10px] px-2 py-1 gap-1 font-medium',
                    compact ? 'text-[9px] px-1.5 py-0.5' : '',
                    item.cls,
                  )}
                >
                  {item.emoji} {item.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-56 text-xs">
                <p className="font-semibold mb-1">{item.emoji} {item.label}</p>
                <p>{item.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowFactors(prev => !prev)}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {!compact && <span>Como é calculado?</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-64 text-xs">
              Clique para ver os fatores que compõem esta avaliação
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showFactors && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs space-y-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              Este status foi calculado com base em:
            </span>
            <button onClick={() => setShowFactors(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1 pl-5">
            {factors.map(f => (
              <li key={f} className="text-muted-foreground list-disc">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Inline "Why" reason tag (for per-item use) ──

interface HealthReasonProps {
  reason: string;
  className?: string;
}

export function HealthReason({ reason, className }: HealthReasonProps) {
  return (
    <p className={cn('text-[10px] text-muted-foreground italic leading-snug', className)}>
      {reason}
    </p>
  );
}
