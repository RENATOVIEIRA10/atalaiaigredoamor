import { TrendingUp, Heart, Droplets, BookOpen, Users, AlertTriangle, Sprout, ChevronRight, ArrowUpRight, Minus, ArrowDownRight } from 'lucide-react';
import { HealthLegend, HealthReason } from '@/components/health/HealthLegend';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PastoralConciergeData, RedeHealth, CampoHealth } from '@/hooks/usePastoralConcierge';

interface Props {
  data: PastoralConciergeData | undefined;
  isLoading: boolean;
  level: 'campo' | 'global';
}

function StatusBadge({ status }: { status: 'growing' | 'stable' | 'attention' }) {
  const cfg = {
    growing: { label: 'Crescendo', icon: ArrowUpRight, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    stable: { label: 'Estável', icon: Minus, cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    attention: { label: 'Atenção', icon: ArrowDownRight, cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', cfg.cls)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-4">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function UnitRow({ unit, level }: { unit: RedeHealth | CampoHealth; level: 'campo' | 'global' }) {
  const name = level === 'campo' ? (unit as RedeHealth).name : (unit as CampoHealth).nome;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground">
          {unit.membros} membros · {unit.celulas} células · {unit.novasVidas} novas vidas
        </p>
        <HealthReason reason={
          unit.status === 'growing' ? 'Novas vidas chegando e membros crescendo'
          : unit.status === 'attention' ? 'Queda de engajamento ou redução de membros'
          : 'Crescimento neutro, poucas conversões recentes'
        } />
      </div>
      <StatusBadge status={unit.status} />
    </div>
  );
}

export function PastoralConciergeBlocks({ data, isLoading, level }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const growing = data.units.filter(u => u.status === 'growing');
  const stable = data.units.filter(u => u.status === 'stable');
  const attention = data.units.filter(u => u.status === 'attention');

  const unitLabel = level === 'campo' ? 'Redes' : 'Campos';

  return (
    <div className="space-y-6">
      {/* ═══ SINAIS DE GOVERNO ═══ */}
      <section className="space-y-3">
        <SectionLabel label={level === 'campo' ? 'Sinais de governo do campus' : 'Panorama do Reino'} />
        <HealthLegend preset="concierge" compact />

        {attention.length > 0 && (
          <div className="glass-card rounded-2xl border-destructive/20 p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                {unitLabel} que precisam de atenção
              </span>
            </div>
            {attention.map(u => <UnitRow key={u.id} unit={u} level={level} />)}
          </div>
        )}

        {growing.length > 0 && (
          <div className="glass-card rounded-2xl border-emerald-500/20 p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                {unitLabel} em crescimento
              </span>
            </div>
            {growing.map(u => <UnitRow key={u.id} unit={u} level={level} />)}
          </div>
        )}

        {stable.length > 0 && (
          <div className="glass-card rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Minus className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                {unitLabel} em estabilidade
              </span>
            </div>
            {stable.map(u => <UnitRow key={u.id} unit={u} level={level} />)}
          </div>
        )}
      </section>

      {/* ═══ MOVIMENTO ESPIRITUAL ═══ */}
      <section className="space-y-3">
        <SectionLabel label={level === 'campo' ? 'Movimento espiritual do campus' : 'Movimento espiritual global'} />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Heart} label="Novas vidas no mês" value={data.novasVidasMes} color="bg-destructive/10 text-destructive" />
          <MetricCard icon={Sprout} label="Conversões em membros" value={data.conversoesMes} color="bg-emerald-500/10 text-emerald-600" />
          <MetricCard icon={Droplets} label="Batismos realizados" value={data.batismosMes} color="bg-blue-500/10 text-blue-600" />
          <MetricCard icon={BookOpen} label="Em discipulado" value={data.discipuladosAtivos} color="bg-primary/10 text-primary" />
        </div>
      </section>

      {/* ═══ LIDERANÇA ═══ */}
      <section className="space-y-3">
        <SectionLabel label="Liderança" />
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {level === 'campo' ? 'Líderes de rede ativos' : 'Pastores de campo ativos'}
            </span>
            <span className="text-lg font-bold text-foreground">{data.lideresAtivos}</span>
          </div>
          {data.coordSemSupervisao > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Coordenações sem supervisão recente
              </span>
              <span className="text-lg font-bold text-amber-600">{data.coordSemSupervisao}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Novos líderes em formação</span>
            <span className="text-lg font-bold text-foreground">{data.lideresEmFormacao}</span>
          </div>
        </div>
      </section>

      {/* ═══ AÇÕES PRINCIPAIS ═══ */}
      <section className="space-y-3">
        <SectionLabel label="Ações essenciais" />
        <div className="flex flex-wrap gap-2">
          {level === 'campo' ? (
            <>
              <ActionBtn label="Ver redes do campus" onClick={() => navigate('/dashboard?tab=visao-geral')} />
              <ActionBtn label="Crescimento espiritual" onClick={() => navigate('/dashboard?tab=movimento')} />
              <ActionBtn label="Reunião com líderes" onClick={() => navigate('/dashboard?tab=pastoral')} />
            </>
          ) : (
            <>
              <ActionBtn label="Ver todos os campos" onClick={() => navigate('/dashboard?tab=visao-geral')} />
              <ActionBtn label="Crescimento por campo" onClick={() => navigate('/dashboard?tab=movimento')} />
              <ActionBtn label="Reunião com pastores" onClick={() => navigate('/dashboard?tab=pastoral')} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-border/30 bg-background/20 px-3.5 py-2.5',
        'text-sm font-medium text-foreground/80 transition-all duration-200',
        'hover:border-primary/30 hover:bg-primary/8 hover:text-foreground',
        'hover:shadow-[0_8px_20px_-12px_hsl(var(--primary)/0.3)]',
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <ChevronRight className="h-3 w-3" />
      </span>
      <span className="text-[13px] leading-tight">{label}</span>
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-semibold flex items-center gap-3">
      <span className="h-px w-8 bg-gradient-to-r from-primary/50 to-transparent" />
      {label}
    </h2>
  );
}
