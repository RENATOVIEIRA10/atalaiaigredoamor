import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTorreControle, TorreRole } from '@/contexts/TorreControleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useCampo } from '@/contexts/CampoContext';
import { useRede } from '@/contexts/RedeContext';
import { useCampos } from '@/hooks/useCampos';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Radar, Map, Network, Layers, Home, Eye, Users, User,
  ChevronRight, RotateCcw, Radio, Building2,
  Heart, Shield, Droplets, BookOpen, Church,
  Settings, GitBranch, FolderTree, Zap,
} from 'lucide-react';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_cadastro' | 'lider_recomeco_central' | 'central_celulas' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo';

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

function torreRoleToDemoScope(role: TorreRole): string {
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

function getRouteForRole(role: TorreRole): string {
  switch (role) {
    case 'recomeco_operador':
    case 'recomeco_cadastro':
      return '/recomeco-cadastro';
    case 'central_celulas':
      return '/central-celulas';
    default:
      return '/home';
  }
}

function torreRoleLabel(role: TorreRole): string {
  return [...STRUCTURAL_ROLES, ...MINISTRY_ROLES].find(r => r.value === role)?.label || role;
}

/**
 * Full-screen PWA Torre de Controle for Admin.
 * Replaces the side-panel with a mobile-first layout.
 */
export function AdminPWADashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selection, setSelection, isOperating, setActiveState, clearActiveState, activeState } = useTorreControle();
  const { activateDemo, deactivateDemo } = useDemoMode();
  const { setActiveCampo, clearCampo, setIsGlobalView } = useCampo();
  const { setActiveRede, clearRede } = useRede();
  const { data: campos } = useCampos();

  const [expandedSection, setExpandedSection] = useState<'hierarchy' | 'roles' | null>('hierarchy');

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

  const activeCampos = (campos || []).filter(c => c.ativo);

  const handleApply = () => {
    if (!selection.role) return;

    if (selection.role === 'pastor_senior_global') {
      clearCampo();
      setIsGlobalView(true);
    } else if (selection.campoId && selection.campoNome) {
      setActiveCampo({ id: selection.campoId, nome: selection.campoNome });
      setIsGlobalView(false);
    }

    if (selection.redeId && selection.redeNome) {
      const redeData = redes?.find(r => r.id === selection.redeId);
      if (redeData) {
        setActiveRede({ id: redeData.id, name: redeData.name, slug: redeData.slug, ativa: redeData.ativa });
      }
    } else {
      clearRede();
    }

    const demoScope = torreRoleToDemoScope(selection.role) as DemoScopeType;
    let scopeId: string | null = null;
    if (selection.role === 'celula') scopeId = selection.celulaId;
    else if (selection.role === 'supervisor') scopeId = selection.coordenacaoId;
    else if (selection.role === 'coordenacao') scopeId = selection.coordenacaoId;
    else if (selection.role === 'rede') scopeId = selection.redeId;

    const label = `Torre: ${torreRoleLabel(selection.role)}`;

    activateDemo(demoScope, scopeId, label, null, selection.campoId, selection.redeId, selection.coordenacaoId, selection.celulaId);

    setActiveState({
      campoId: selection.campoId,
      redeId: selection.redeId,
      coordenacaoId: selection.coordenacaoId,
      celulaId: selection.celulaId,
      role: selection.role,
      label,
    });

    queryClient.invalidateQueries();
    navigate(getRouteForRole(selection.role));
  };

  const handleDeactivate = () => {
    deactivateDemo();
    clearActiveState();
    clearRede();
    setIsGlobalView(false);
    queryClient.invalidateQueries();
  };

  return (
    <div className="space-y-4">
      {/* ═══ ACTIVE SCOPE INDICATOR ═══ */}
      {isOperating && (
        <div className="rounded-2xl border border-gold/25 bg-gold/8 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span className="text-sm font-bold text-gold">Operação ativa</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gold hover:text-foreground"
              onClick={handleDeactivate}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Desativar
            </Button>
          </div>
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeState.label && (
              <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">{activeState.label}</Badge>
            )}
          </div>
        </div>
      )}

      {/* ═══ HIERARCHY SELECTORS ═══ */}
      <div className="rounded-2xl border border-border/30 bg-card/50 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'hierarchy' ? null : 'hierarchy')}
          className="w-full flex items-center justify-between p-4 active:bg-accent/30 touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gold/12 flex items-center justify-center">
              <Map className="h-5 w-5 text-gold" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Navegação de Escopo</p>
              <p className="text-[10px] text-muted-foreground">Campus → Rede → Coordenação → Célula</p>
            </div>
          </div>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedSection === 'hierarchy' && 'rotate-90')} />
        </button>

        {expandedSection === 'hierarchy' && (
          <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
            {/* Campus */}
            <ScopeSelector
              icon={Building2}
              label="Campus"
              color="text-gold"
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

            {/* Rede */}
            {selection.campoId && (
              <ScopeSelector
                icon={Network}
                label="Rede"
                color="text-primary"
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

            {/* Coordenação */}
            {selection.redeId && (
              <ScopeSelector
                icon={Layers}
                label="Coordenação"
                color="text-success"
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

            {/* Célula */}
            {selection.coordenacaoId && (
              <ScopeSelector
                icon={User}
                label="Célula"
                color="text-warning"
                value={selection.celulaId}
                options={(celulas || []).map(c => ({ id: c.id, label: c.name }))}
                onChange={(id, label) => {
                  setSelection({ celulaId: id, celulaNome: label });
                }}
              />
            )}

            {/* Scope breadcrumb */}
            {selection.campoId && (
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {selection.campoNome && (
                  <>
                    <Badge variant="outline" className="text-[10px] h-5 border-gold/20 text-gold">{selection.campoNome}</Badge>
                    {selection.redeNome && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  </>
                )}
                {selection.redeNome && (
                  <>
                    <Badge variant="outline" className="text-[10px] h-5">{selection.redeNome}</Badge>
                    {selection.coordenacaoNome && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  </>
                )}
                {selection.coordenacaoNome && (
                  <>
                    <Badge variant="outline" className="text-[10px] h-5">{selection.coordenacaoNome}</Badge>
                    {selection.celulaNome && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  </>
                )}
                {selection.celulaNome && (
                  <Badge variant="outline" className="text-[10px] h-5">{selection.celulaNome}</Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ ROLE SELECTOR ═══ */}
      <div className="rounded-2xl border border-border/30 bg-card/50 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'roles' ? null : 'roles')}
          className="w-full flex items-center justify-between p-4 active:bg-accent/30 touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Simular Papel</p>
              <p className="text-[10px] text-muted-foreground">
                {selection.role ? torreRoleLabel(selection.role) : 'Escolha o papel a operar'}
              </p>
            </div>
          </div>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedSection === 'roles' && 'rotate-90')} />
        </button>

        {expandedSection === 'roles' && (
          <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-3">
            {/* Structural */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">Estrutural</p>
              <div className="grid grid-cols-2 gap-2">
                {STRUCTURAL_ROLES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelection({ role: opt.value })}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all touch-manipulation active:scale-[0.97]',
                      selection.role === opt.value
                        ? 'border-gold/40 bg-gold/10 text-foreground'
                        : 'border-border/25 text-muted-foreground active:bg-accent/30',
                    )}
                  >
                    <opt.icon className={cn('h-4.5 w-4.5 shrink-0', selection.role === opt.value ? opt.color : '')} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ministry */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">Ministérios</p>
              <div className="grid grid-cols-2 gap-2">
                {MINISTRY_ROLES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelection({ role: opt.value })}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all touch-manipulation active:scale-[0.97]',
                      selection.role === opt.value
                        ? 'border-gold/40 bg-gold/10 text-foreground'
                        : 'border-border/25 text-muted-foreground active:bg-accent/30',
                    )}
                  >
                    <opt.icon className={cn('h-4.5 w-4.5 shrink-0', selection.role === opt.value ? opt.color : '')} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ ACTIVATE BUTTON ═══ */}
      <Button
        onClick={handleApply}
        disabled={!selection.role}
        className="w-full h-12 rounded-2xl bg-gold/90 text-gold-foreground hover:bg-gold font-semibold text-sm touch-manipulation"
      >
        <Eye className="h-4.5 w-4.5 mr-2" />
        Ativar Operação
      </Button>
      {!selection.role && (
        <p className="text-[10px] text-muted-foreground text-center -mt-2">
          Selecione um papel para simular
        </p>
      )}

      {/* ═══ QUICK LINKS ═══ */}
      <div className="rounded-2xl border border-border/30 bg-card/50 p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">Acesso rápido</p>
        <div className="grid grid-cols-2 gap-2">
          <QuickLink icon={GitBranch} label="Organograma" onClick={() => navigate('/organograma')} />
          <QuickLink icon={Home} label="Células" onClick={() => navigate('/celulas')} />
          <QuickLink icon={Network} label="Redes" onClick={() => navigate('/redes')} />
          <QuickLink icon={FolderTree} label="Coordenações" onClick={() => navigate('/coordenacoes')} />
          <QuickLink icon={Settings} label="Configurações" onClick={() => navigate('/configuracoes')} />
          <QuickLink icon={Zap} label="Ferramentas" onClick={() => navigate('/ferramentas-teste')} />
        </div>
      </div>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function ScopeSelector({
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
        <Badge variant="outline" className="text-[9px] h-4 ml-auto">{options.length}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id, opt.label)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-xs text-left transition-all touch-manipulation active:scale-[0.97]',
              value === opt.id
                ? 'border-gold/40 bg-gold/10 text-foreground font-medium'
                : 'border-border/20 text-muted-foreground active:bg-accent/30',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-border/25 px-3 py-3 text-left transition-all touch-manipulation active:bg-accent/30 active:scale-[0.97]"
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}
