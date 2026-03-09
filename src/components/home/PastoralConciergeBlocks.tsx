import { TrendingUp, Heart, Droplets, BookOpen, Users, AlertTriangle, Sprout, ChevronRight, ArrowUpRight, Minus, ArrowDownRight } from 'lucide-react';
import { HealthLegend, HealthReason } from '@/components/health/HealthLegend';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PastoralConciergeData, RedeHealth, CampoHealth } from '@/hooks/usePastoralConcierge';

interface Props {
  data: PastoralConciergeData | undefined;
  isLoading: boolean;
  level: 'campo' | 'global';
}

function StatusBadge({ status }: { status: 'growing' | 'stable' | 'attention' }) {
  const cfg = {
    growing: { label: 'Crescendo', icon: ArrowUpRight, cls: 'bg-vida/12 text-vida border-vida/25' },
    stable: { label: 'Estável', icon: Minus, cls: 'bg-warning/12 text-warning border-warning/25' },
    attention: { label: 'Atenção', icon: ArrowDownRight, cls: 'bg-ruby/12 text-ruby border-ruby/25' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', cfg.cls)}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card variant="glass" className="flex items-center gap-4 p-5">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function UnitRow({ unit, level }: { unit: RedeHealth | CampoHealth; level: 'campo' | 'global' }) {
  const name = level === 'campo' ? (unit as RedeHealth).name : (unit as CampoHealth).nome;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/25 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
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
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const growing = data.units.filter(u => u.status === 'growing');
  const stable = data.units.filter(u => u.status === 'stable');
  const attention = data.units.filter(u => u.status === 'attention');

  const unitLabel = level === 'campo' ? 'Redes' : 'Campos';

  return (
    <div className="space-y-7">
      {/* ═══ SINAIS DE GOVERNO ═══ */}
      <section className="space-y-4">
        <SectionLabel label={level === 'campo' ? 'Sinais de governo do campus' : 'Panorama do Reino'} />
        <HealthLegend preset="concierge" compact />

        {attention.length > 0 && (
          <Card variant="risk" className="p-5 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-ruby" />
              <span className="text-xs font-semibold text-ruby uppercase tracking-wider">
                {unitLabel} que precisam de atenção
              </span>
            </div>
            {attention.map(u => <UnitRow key={u.id} unit={u} level={level} />)}
          </Card>
        )}

        {growing.length > 0 && (
          <Card variant="vida" className="p-5 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-vida" />
              <span className="text-xs font-semibold text-vida uppercase tracking-wider">
                {unitLabel} em crescimento
              </span>
            </div>
            {growing.map(u => <UnitRow key={u.id} unit={u} level={level} />)}
          </Card>
        )}

        {stable.length > 0 && (
          <Card variant="alert" className="p-5 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <Minus className="h-4 w-4 text-warning" />
              <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                {unitLabel} em estabilidade
              </span>
            </div>
            {stable.map(u => <UnitRow key={u.id} unit={u} level={level} />)}
          </Card>
        )}
      </section>

      {/* ═══ MOVIMENTO ESPIRITUAL ═══ */}
      <section className="space-y-4">
        <SectionLabel label={level === 'campo' ? 'Movimento espiritual do campus' : 'Movimento espiritual global'} />
        <div className="grid grid-cols-2 gap-4">
          <MetricCard icon={Heart} label="Novas vidas no mês" value={data.novasVidasMes} color="bg-ruby/12 text-ruby" />
          <MetricCard icon={Sprout} label="Conversões em membros" value={data.conversoesMes} color="bg-vida/12 text-vida" />
          <MetricCard icon={Droplets} label="Batismos realizados" value={data.batismosMes} color="bg-primary/12 text-primary" />
          <MetricCard icon={BookOpen} label="Em discipulado" value={data.discipuladosAtivos} color="bg-primary/12 text-primary" />
        </div>
      </section>

      {/* ═══ LIDERANÇA ═══ */}
      <section className="space-y-4">
        <SectionLabel label="Liderança" />
        <Card variant="glass" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {level === 'campo' ? 'Líderes de rede ativos' : 'Pastores de campo ativos'}
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">{data.lideresAtivos}</span>
          </div>
          {data.coordSemSupervisao > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-warning flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Coordenações sem supervisão recente
              </span>
              <span className="text-xl font-bold text-warning tabular-nums">{data.coordSemSupervisao}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Novos líderes em formação</span>
            <span className="text-xl font-bold text-foreground tabular-nums">{data.lideresEmFormacao}</span>
          </div>
        </Card>
      </section>

      {/* ═══ AÇÕES PRINCIPAIS ═══ */}
      <section className="space-y-4">
        <SectionLabel label="Ações essenciais" />
        <div className="flex flex-wrap gap-2.5">
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
        'group inline-flex items-center gap-2.5 rounded-xl border border-border/40 bg-background/30 px-4 py-3',
        'text-sm font-medium text-foreground/85 transition-all duration-250',
        'hover:border-primary/40 hover:bg-primary/8 hover:text-foreground',
        'hover:shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.25)]',
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
      <span className="text-[13px] leading-tight">{label}</span>
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <h2 className="section-label">{label}</h2>;
}
