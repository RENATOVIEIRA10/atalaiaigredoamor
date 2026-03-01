import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Home, Users, Heart, Eye, BookOpen, Shield, ChevronRight, Sparkles, Church
} from 'lucide-react';
import { CampusKPI } from '@/hooks/useGlobalKingdomData';

interface Props {
  campus: CampusKPI;
  onSelect: (campoId: string, campoNome: string) => void;
}

export function KingdomCampusCard({ campus, onSelect }: Props) {
  const hasData = campus.celulas_ativas > 0 || campus.membros_total > 0;
  const conversionRate = campus.novas_vidas_total > 0
    ? Math.round((campus.novas_vidas_convertidas / campus.novas_vidas_total) * 100)
    : 0;
  const supProgress = campus.supervisoes_total_celulas > 0
    ? Math.round((campus.supervisoes_bimestre / campus.supervisoes_total_celulas) * 100)
    : 0;

  return (
    <Card
      className="card-hover glass-card cursor-pointer group transition-all hover:shadow-lg hover:border-primary/30"
      onClick={() => onSelect(campus.campo_id, campus.campo_nome)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Church className="h-4 w-4 text-primary" />
            {campus.campo_nome}
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        {!hasData && (
          <Badge variant="secondary" className="text-xs w-fit">Sem dados operacionais</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 1. Saúde das Células */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Saúde Células</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{campus.engajamento_pct}%</span>
            <Badge
              variant="secondary"
              className={`text-xs ${
                campus.engajamento_pct >= 80 ? 'bg-green-500/10 text-green-600' :
                campus.engajamento_pct >= 50 ? 'bg-amber-500/10 text-amber-600' :
                'bg-destructive/10 text-destructive'
              }`}
            >
              {campus.celulas_com_relatorio}/{campus.celulas_ativas}
            </Badge>
          </div>
        </div>
        <Progress value={campus.engajamento_pct} className="h-1.5" />

        {/* 2. Novas Vidas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Novas Vidas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{campus.novas_vidas_total}</span>
            {campus.novas_vidas_total > 0 && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                {conversionRate}% conv.
              </Badge>
            )}
          </div>
        </div>

        {/* 3. Discipulado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Discipulado</span>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {campus.disc_encontros} enc. · {campus.disc_presencas} pres.
          </span>
        </div>

        {/* 4. Supervisões */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Supervisões</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{campus.supervisoes_bimestre}</span>
            {campus.supervisoes_total_celulas > 0 && (
              <Badge variant="secondary" className="text-xs">
                {supProgress}%
              </Badge>
            )}
          </div>
        </div>

        {/* 5. Marcos Espirituais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Marcos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" title="Encontro c/ Deus">🔥{campus.marcos_encontro}</span>
            <span className="text-xs" title="Batismo">💧{campus.marcos_batismo}</span>
            <span className="text-xs" title="Curso Lidere">🎓{campus.marcos_curso_lidere}</span>
            <span className="text-xs" title="Renovo">🌿{campus.marcos_renovo}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            <Users className="h-3 w-3 inline mr-1" />{campus.membros_total} membros
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary">
            Detalhar →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
