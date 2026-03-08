import { useTorreControle, TorreRole } from '@/contexts/TorreControleContext';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useCampo } from '@/contexts/CampoContext';
import { useRede } from '@/contexts/RedeContext';
import { useCampos } from '@/hooks/useCampos';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  X, Radar, Map, Network, Layers, Home, Eye, Users, User,
  ChevronRight, RotateCcw, Radio, Building2,
  Heart, ClipboardCheck, Shield, Droplets, Church, BookOpen,
} from 'lucide-react';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional';

const STRUCTURAL_ROLES: { value: TorreRole; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'pastor_senior_global', label: 'Pastor Global', icon: Eye, color: 'text-gold' },
  { value: 'pastor_de_campo', label: 'Pastor de Campo', icon: Church, color: 'text-primary' },
  { value: 'rede', label: 'Líder de Rede', icon: Network, color: 'text-primary' },
  { value: 'coordenacao', label: 'Coordenador', icon: Layers, color: 'text-success' },
  { value: 'supervisor', label: 'Supervisor', icon: Shield, color: 'text-warning' },
  { value: 'celula', label: 'Líder de Célula', icon: Home, color: 'text-primary' },
];

const MINISTRY_ROLES: { value: TorreRole; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'lider_recomeco_central', label: 'Líder Recomeço', icon: Heart, color: 'text-destructive' },
  { value: 'recomeco_operador', label: 'Operador Recomeço', icon: Heart, color: 'text-destructive' },
  { value: 'recomeco_cadastro', label: 'Cadastro NV', icon: BookOpen, color: 'text-success' },
  { value: 'central_celulas', label: 'Central Células', icon: Users, color: 'text-primary' },
  { value: 'lider_batismo_aclamacao', label: 'Líder Batismo', icon: Droplets, color: 'text-primary' },
  { value: 'central_batismo_aclamacao', label: 'Central Batismo', icon: Droplets, color: 'text-primary' },
];

/**
 * Map TorreRole to the actual DemoScopeType used by DemoModeContext.
 * Ministry roles need their own scope types, NOT generic 'pastor'.
 */
function torreRoleToDemoScope(role: TorreRole): string {
  // Most roles map directly
  const directMap: Record<string, string> = {
    pastor_senior_global: 'pastor_senior_global',
    pastor_de_campo: 'pastor_de_campo',
    rede: 'rede',
    coordenacao: 'coordenacao',
    supervisor: 'supervisor',
    celula: 'celula',
    recomeco_operador: 'recomeco_operador',
    recomeco_cadastro: 'recomeco_cadastro',
    lider_recomeco_central: 'lider_recomeco_central',
    central_celulas: 'central_celulas',
    lider_batismo_aclamacao: 'lider_batismo_aclamacao',
    central_batismo_aclamacao: 'central_batismo_aclamacao',
  };
  return directMap[role] || 'pastor';
}

/**
 * Get the correct navigation target for each role.
 */
function getRouteForRole(role: TorreRole): string {
  switch (role) {
    case 'recomeco_operador':
    case 'recomeco_cadastro':
      return '/recomeco-cadastro';
    case 'lider_recomeco_central':
      return '/dashboard';
    case 'central_celulas':
      return '/central-celulas';
    case 'lider_batismo_aclamacao':
    case 'central_batismo_aclamacao':
      return '/dashboard';
    default:
      return '/home';
  }
}

function torreRoleLabel(role: TorreRole): string {
  return [...STRUCTURAL_ROLES, ...MINISTRY_ROLES].find(r => r.value === role)?.label || role;
}

export function TorreControlePanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();
  const { isOpen, setIsOpen, selection, setSelection, clearSelection, isActive } = useTorreControle();
  const { activateDemo, deactivateDemo, isDemoActive } = useDemoMode();
  const { setActiveCampo, clearCampo, setIsGlobalView } = useCampo();
  const { setActiveRede, clearRede } = useRede();
  const { data: campos } = useCampos();

  // Fetch redes filtered by selected campus
  const { data: redes } = useQuery({
    queryKey: ['torre-redes', selection.campoId],
    queryFn: async () => {
      let q = supabase.from('redes').select('id, name, slug, ativa, campo_id').eq('ativa', true).order('name');
      if (selection.campoId) q = q.eq('campo_id', selection.campoId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!selection.campoId,
  });

  // Fetch coordenações filtered by selected rede
  const { data: coordenacoes } = useQuery({
    queryKey: ['torre-coords', selection.redeId],
    queryFn: async () => {
      let q = supabase.from('coordenacoes').select('id, name, rede_id').order('ordem');
      if (selection.redeId) q = q.eq('rede_id', selection.redeId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!selection.redeId,
  });

  // Fetch células filtered by selected coordenação
  const { data: celulas } = useQuery({
    queryKey: ['torre-celulas', selection.coordenacaoId],
    queryFn: async () => {
      let q = supabase.from('celulas').select('id, name, coordenacao_id').order('name');
      if (selection.coordenacaoId) q = q.eq('coordenacao_id', selection.coordenacaoId);
      const { data } = await q;
      return data || [];
    },
    enabled: !!selection.coordenacaoId,
  });

  if (!isAdmin) return null;

  /**
   * APPLY: Updates REAL CampoContext + RedeContext + activates demo scope,
   * then invalidates all queries so dashboards reload with new data.
   */
  const handleApply = () => {
    if (!selection.role) return;

    // 1. Update REAL CampoContext
    if (selection.role === 'pastor_senior_global') {
      clearCampo();
      setIsGlobalView(true);
    } else if (selection.campoId && selection.campoNome) {
      setActiveCampo({ id: selection.campoId, nome: selection.campoNome });
      setIsGlobalView(false);
    }

    // 2. Update REAL RedeContext if rede selected
    if (selection.redeId && selection.redeNome) {
      const redeData = redes?.find(r => r.id === selection.redeId);
      if (redeData) {
        setActiveRede({ id: redeData.id, name: redeData.name, slug: redeData.slug, ativa: redeData.ativa });
      }
    } else {
      clearRede();
    }

    // 3. Activate demo/simulation scope 
    const demoScope = torreRoleToDemoScope(selection.role) as DemoScopeType;
    let scopeId: string | null = null;
    if (selection.role === 'celula') scopeId = selection.celulaId;
    else if (selection.role === 'supervisor') scopeId = selection.coordenacaoId;
    else if (selection.role === 'coordenacao') scopeId = selection.coordenacaoId;
    else if (selection.role === 'rede') scopeId = selection.redeId;

    const label = `Torre: ${torreRoleLabel(selection.role)}`;
    activateDemo(demoScope, scopeId, label, null, selection.campoId);

    // 4. Invalidate ALL queries so dashboards reload with new campus/scope
    queryClient.invalidateQueries();

    // 5. Navigate to correct route
    const route = getRouteForRole(selection.role);
    navigate(route);

    // 6. Close panel
    setIsOpen(false);
  };

  const handleDeactivate = () => {
    deactivateDemo();
    clearSelection();
    // Invalidate to reload with real admin data
    queryClient.invalidateQueries();
    navigate('/home');
  };

  // Floating toggle button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-300',
          'border border-border/30 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]',
          isDemoActive
            ? 'bg-gold/90 text-gold-foreground hover:bg-gold'
            : 'bg-card/90 backdrop-blur-lg text-foreground hover:bg-card border-gold/20',
          'hover:scale-105'
        )}
      >
        <Radar className={cn('h-5 w-5', isDemoActive ? 'text-gold-foreground' : 'text-gold')} />
        <span className="text-sm font-semibold hidden md:inline">Torre de Controle</span>
        {isDemoActive && <Radio className="h-3 w-3 animate-pulse" />}
      </button>
    );
  }

  const activeCampos = (campos || []).filter(c => c.ativo);

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-50 w-[360px] flex flex-col border-l border-border/20 animate-in slide-in-from-right-full duration-300"
      style={{
        background: 'linear-gradient(180deg, hsl(222 47% 9%) 0%, hsl(222 47% 6%) 100%)',
        boxShadow: '-20px 0 60px -20px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gold/12 flex items-center justify-center">
            <Radar className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-foreground">Torre de Controle</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Centro de comando</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Active indicator */}
      {isDemoActive && (
        <div className="px-5 py-2.5 bg-gold/8 border-b border-gold/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-gold animate-pulse" />
            <span className="text-[11px] font-semibold text-gold">Simulação ativa</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[11px] text-gold hover:text-foreground" onClick={handleDeactivate}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Desativar
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* ═══ HIERARCHY SELECTORS ═══ */}
          <SelectorBlock
            icon={Building2} label="Campus" color="text-gold"
            value={selection.campoId}
            options={activeCampos.map(c => ({ id: c.id, label: c.nome }))}
            onChange={(id, label) => {
              setSelection({
                campoId: id, campoNome: label,
                redeId: null, redeNome: null,
                coordenacaoId: null, coordenacaoNome: null,
                celulaId: null, celulaNome: null,
              });
            }}
          />

          {selection.campoId && (
            <SelectorBlock
              icon={Network} label="Rede" color="text-primary"
              value={selection.redeId}
              options={(redes || []).map(r => ({ id: r.id, label: r.name }))}
              onChange={(id, label) => {
                setSelection({
                  redeId: id, redeNome: label,
                  coordenacaoId: null, coordenacaoNome: null,
                  celulaId: null, celulaNome: null,
                });
              }}
            />
          )}

          {selection.redeId && (
            <SelectorBlock
              icon={Layers} label="Coordenação" color="text-success"
              value={selection.coordenacaoId}
              options={(coordenacoes || []).map(c => ({ id: c.id, label: c.name }))}
              onChange={(id, label) => {
                setSelection({
                  coordenacaoId: id, coordenacaoNome: label,
                  celulaId: null, celulaNome: null,
                });
              }}
            />
          )}

          {selection.coordenacaoId && (
            <SelectorBlock
              icon={User} label="Célula" color="text-warning"
              value={selection.celulaId}
              options={(celulas || []).map(c => ({ id: c.id, label: c.name }))}
              onChange={(id, label) => {
                setSelection({ celulaId: id, celulaNome: label });
              }}
            />
          )}

          {/* Breadcrumb */}
          {selection.campoId && (
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {selection.campoNome && (
                <>
                  <Badge variant="outline" className="text-[10px] h-5 border-gold/20 text-gold">{selection.campoNome}</Badge>
                  {selection.redeNome && <ChevronRight className="h-3 w-3" />}
                </>
              )}
              {selection.redeNome && (
                <>
                  <Badge variant="outline" className="text-[10px] h-5">{selection.redeNome}</Badge>
                  {selection.coordenacaoNome && <ChevronRight className="h-3 w-3" />}
                </>
              )}
              {selection.coordenacaoNome && (
                <>
                  <Badge variant="outline" className="text-[10px] h-5">{selection.coordenacaoNome}</Badge>
                  {selection.celulaNome && <ChevronRight className="h-3 w-3" />}
                </>
              )}
              {selection.celulaNome && (
                <Badge variant="outline" className="text-[10px] h-5">{selection.celulaNome}</Badge>
              )}
            </div>
          )}

          <Separator className="bg-border/15" />

          {/* ═══ STRUCTURAL ROLES ═══ */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold flex items-center gap-2">
              <span className="h-px w-5 bg-gold/25" />
              Visualizar como
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {STRUCTURAL_ROLES.map((opt) => (
                <RoleButton
                  key={opt.value}
                  selected={selection.role === opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  color={opt.color}
                  onClick={() => setSelection({ role: opt.value })}
                />
              ))}
            </div>
          </div>

          {/* ═══ MINISTRY ROLES ═══ */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold flex items-center gap-2">
              <span className="h-px w-5 bg-destructive/25" />
              Ministérios
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {MINISTRY_ROLES.map((opt) => (
                <RoleButton
                  key={opt.value}
                  selected={selection.role === opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  color={opt.color}
                  onClick={() => setSelection({ role: opt.value })}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/20 px-5 py-4 space-y-2">
        <Button
          onClick={handleApply}
          disabled={!selection.role}
          className="w-full h-10 rounded-xl bg-gold/90 text-gold-foreground hover:bg-gold font-semibold text-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ativar Visão
        </Button>
        {!selection.role && (
          <p className="text-[10px] text-muted-foreground text-center">
            Selecione um papel para ativar
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function SelectorBlock({
  icon: Icon, label, color, value, options, onChange,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  value: string | null;
  options: { id: string; label: string }[];
  onChange: (id: string, label: string) => void;
}) {
  return (
    <div className="space-y-1.5 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5', color)} />
        <span className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <Select value={value || ''} onValueChange={(v) => {
        const opt = options.find(o => o.id === v);
        if (opt) onChange(opt.id, opt.label);
      }}>
        <SelectTrigger className="h-9 rounded-xl border-border/25 bg-background/20 text-sm">
          <SelectValue placeholder={`Selecionar ${label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RoleButton({
  selected, icon: Icon, label, color, onClick,
}: {
  selected: boolean;
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
        selected
          ? 'border-gold/40 bg-gold/10 text-foreground shadow-[0_0_16px_-6px_hsl(var(--gold)/0.3)]'
          : 'border-border/20 text-muted-foreground hover:border-border/35 hover:bg-accent/20 hover:text-foreground'
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', selected ? 'text-gold' : color)} />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </button>
  );
}
