/**
 * GuardioesPanel — Painel de Cultos para o Pastor de Campo
 * Mostra estatísticas de presença, frutos espirituais e histórico recente.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { SectionLabel } from './SectionLabel';
import { useCultoContagensRelatorio } from '@/hooks/useCultoContagensRelatorio';
import {
  UserCheck, Users, TrendingUp, TrendingDown, Minus,
  Heart, BookOpen, Calendar, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

function formatDate(iso: string) {
  return format(new Date(iso + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
}

function formatTime(t: string | null) {
  if (!t) return '—';
  return t.slice(0, 5);
}

function TendenciaIcon({ tendencia }: { tendencia: 'crescendo' | 'estavel' | 'caindo' }) {
  if (tendencia === 'crescendo') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (tendencia === 'caindo') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function TendenciaBadge({ tendencia }: { tendencia: 'crescendo' | 'estavel' | 'caindo' }) {
  const map = {
    crescendo: { label: 'Crescendo', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    estavel: { label: 'Estável', className: 'bg-muted text-muted-foreground' },
    caindo: { label: 'Em queda', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };
  const cfg = map[tendencia];
  return (
    <Badge variant="outline" className={cn('gap-1', cfg.className)}>
      <TendenciaIcon tendencia={tendencia} />
      {cfg.label}
    </Badge>
  );
}

export function GuardioesPanel() {
  const { data: stats, isLoading } = useCultoContagensRelatorio(90);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!stats || stats.totalCultos === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-muted p-4">
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">Nenhum culto registrado nos últimos 90 dias</p>
          <p className="text-sm text-muted-foreground/70">Os Guardiões ainda não enviaram contagens para este campo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionLabel
        title="Cultos & Presença"
        subtitle="Dados registrados pelos Guardiões de Culto — últimos 90 dias"
      />

      <StaggerContainer className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            icon={UserCheck}
            label="Cultos Registrados"
            value={stats.totalCultos}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={Users}
            label="Média de Presentes"
            value={stats.mediaPresentes}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={TrendingUp}
            label="Pico de Presença"
            value={stats.picoPresentesCulto}
            subtitle={stats.picoData ? formatDate(stats.picoData) : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={Heart}
            label="Novas Vidas"
            value={stats.totalNovasVidas}
            subtitle="em cultos"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Spiritual fruit summary — foco em Novas Vidas e Tendência */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 p-2.5">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Novas Vidas (total)</p>
              <p className="text-2xl font-bold tabular-nums">{stats.totalNovasVidas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tendência (90 dias)</p>
              <div className="mt-1">
                <TendenciaBadge tendencia={stats.tendencia} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent services history */}
      {stats.ultimas4Semanas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Cultos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.ultimas4Semanas.map((culto) => (
                <div key={culto.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatDate(culto.data)}</p>
                      {culto.horario && (
                        <p className="text-xs text-muted-foreground">{formatTime(culto.horario)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="font-bold tabular-nums text-lg">{culto.total_presentes}</p>
                      <p className="text-xs text-muted-foreground">presentes</p>
                    </div>
                    {culto.novas_vidas_count > 0 && (
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 text-xs bg-rose-500/10 text-rose-600">
                          <Heart className="h-3 w-3" />
                          {culto.novas_vidas_count} vidas
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
