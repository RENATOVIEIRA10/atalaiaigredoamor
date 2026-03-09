/**
 * NodeDetailSheet – Elegant sliding panel with details about a selected node.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { PulsoVivoNode } from '@/hooks/usePulsoVivo';
import { Users, Activity, MapPin, TrendingUp, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';

interface Props {
  node: PulsoVivoNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HEALTH_CONFIG = {
  saudavel: { label: 'Saudável', icon: CheckCircle2, className: 'bg-success/15 text-success border-success/30' },
  acompanhamento: { label: 'Atenção', icon: Eye, className: 'bg-warning/15 text-warning border-warning/30' },
  critica: { label: 'Risco', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
  sem_avaliacao: { label: 'Sem avaliação', icon: Activity, className: 'bg-muted text-muted-foreground border-border' },
};

const TYPE_LABELS: Record<string, string> = {
  pastor: 'Pastores Sêniores',
  rede: 'Rede',
  coordenacao: 'Coordenação',
  supervisor: 'Supervisão',
  celula: 'Célula',
};

export function NodeDetailSheet({ node, open, onOpenChange }: Props) {
  if (!node) return null;

  const healthCfg = HEALTH_CONFIG[node.health];
  const HealthIcon = healthCfg.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] font-medium">
              {TYPE_LABELS[node.type] || node.type}
            </Badge>
            <Badge variant="outline" className={healthCfg.className}>
              <HealthIcon className="h-3 w-3 mr-1" />
              {healthCfg.label}
            </Badge>
          </div>
          <SheetTitle className="font-display text-xl">{node.name}</SheetTitle>
          {node.coupleName && (
            <SheetDescription className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {node.coupleName}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-4 mt-2">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {node.childrenCount > 0 && (
              <div className="rounded-xl bg-secondary/50 border border-border/30 p-3 text-center">
                <MapPin className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{node.childrenCount}</p>
                <p className="text-[10px] text-muted-foreground">
                  {node.type === 'pastor' ? 'Redes' : node.type === 'rede' ? 'Coordenações' : node.type === 'coordenacao' ? 'Supervisões' : 'Células'}
                </p>
              </div>
            )}
            {node.type === 'celula' && (
              <div className="rounded-xl bg-secondary/50 border border-border/30 p-3 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{node.memberCount}</p>
                <p className="text-[10px] text-muted-foreground">Membros ativos</p>
              </div>
            )}
          </div>

          {/* Health indicator bar */}
          <div className="rounded-xl bg-card border border-border/30 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Indicador de Vitalidade
            </h4>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                node.health === 'saudavel' ? 'bg-success/15' : 
                node.health === 'acompanhamento' ? 'bg-warning/15' : 
                node.health === 'critica' ? 'bg-destructive/15' : 'bg-muted'
              }`}>
                <HealthIcon className={`h-5 w-5 ${
                  node.health === 'saudavel' ? 'text-success' : 
                  node.health === 'acompanhamento' ? 'text-warning' : 
                  node.health === 'critica' ? 'text-destructive' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{healthCfg.label}</p>
                <p className="text-xs text-muted-foreground">
                  {node.health === 'saudavel' && 'Relatórios e supervisões em dia'}
                  {node.health === 'acompanhamento' && 'Atrasos pontuais detectados'}
                  {node.health === 'critica' && 'Ausência prolongada de registros'}
                  {node.health === 'sem_avaliacao' && 'Sem supervisões registradas'}
                </p>
              </div>
            </div>
          </div>

          {/* Leadership */}
          {node.coupleName && (
            <div className="rounded-xl bg-card border border-border/30 p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Liderança
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[node.spouse1, node.spouse2].filter(Boolean).map((s, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-card overflow-hidden">
                      {s?.avatar_url ? (
                        <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {s?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground">{node.coupleName}</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
