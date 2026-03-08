import { useMemo } from 'react';
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
  X, Radar, Network, Layers, Home, Eye, Users, User,
  ChevronRight, RotateCcw, Radio, Building2,
  Heart, Shield, Droplets, Church, BookOpen, AlertTriangle,
} from 'lucide-react';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional';

interface RoleDef {
  value: TorreRole;
  label: string;
  icon: React.ElementType;
  color: string;
  category: 'structural' | 'ministry';
}

const ALL_ROLES: RoleDef[] = [
  { value: 'pastor_senior_global', label: 'Pastor Global', icon: Eye, color: 'text-gold', category: 'structural' },
  { value: 'pastor_de_campo', label: 'Pastor de Campo', icon: Church, color: 'text-primary', category: 'structural' },
  { value: 'rede', label: 'Líder de Rede', icon: Network, color: 'text-primary', category: 'structural' },
  { value: 'coordenacao', label: 'Coordenador', icon: Layers, color: 'text-success', category: 'structural' },
  { value: 'supervisor', label: 'Supervisor', icon: Shield, color: 'text-warning', category: 'structural' },
  { value: 'celula', label: 'Líder de Célula', icon: Home, color: 'text-primary', category: 'structural' },
  { value: 'lider_recomeco_central', label: 'Líder Recomeço', icon: Heart, color: 'text-destructive', category: 'ministry' },
  { value: 'recomeco_operador', label: 'Operador Recomeço', icon: Heart, color: 'text-destructive', category: 'ministry' },
  { value: 'recomeco_cadastro', label: 'Cadastro NV', icon: BookOpen, color: 'text-success', category: 'ministry' },
  { value: 'central_celulas', label: 'Central Células', icon: Users, color: 'text-primary', category: 'ministry' },
  { value: 'lider_batismo_aclamacao', label: 'Líder Batismo', icon: Droplets, color: 'text-primary', category: 'ministry' },
  { value: 'central_batismo_aclamacao', label: 'Central Batismo', icon: Droplets, color: 'text-primary', category: 'ministry' },
];

/**
 * Derive available roles based on how deep the admin has selected in the hierarchy.
 */
function getAvailableRoles(
  campoId: string | null,
  redeId: string | null,
  coordenacaoId: string | null,
  celulaId: string | null,
): TorreRole[] {
  // No campus → only global role
  if (!campoId) return ['pastor_senior_global'];

  // Campus only → pastor + ministry
  if (!redeId) return [
    'pastor_de_campo',
    'lider_recomeco_central', 'recomeco_operador', 'recomeco_cadastro',
    'central_celulas', 'lider_batismo_aclamacao', 'central_batismo_aclamacao',
  ];

  // Campus + Rede → rede leader + ministry
  if (!coordenacaoId) return [
    'rede',
    'lider_recomeco_central', 'recomeco_operador', 'recomeco_cadastro',
    'central_celulas', 'lider_batismo_aclamacao', 'central_batismo_aclamacao',
  ];

  // Campus + Rede + Coordenação → coordenador, supervisor
  if (!celulaId) return ['coordenacao', 'supervisor'];

  // Full depth → célula leader
  return ['celula'];
}

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
  return ALL_ROLES.find(r => r.value === role)?.label || role;
}

export function TorreControlePanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();
  const { isOpen, setIsOpen, selection, setSelection, clearSelection, isOperating, setActiveState, clearActiveState } = useTorreControle();
  const { activateDemo, deactivateDemo } = useDemoMode();
  const { setActiveCampo, clearCampo, setIsGlobalView } = useCampo();
  const { setActiveRede, clearRede } = useRede();
  const { data: campos } = useCampos();

  // Fetch redes filtered by selected campus
  const { data: redes } = useQuery({
    queryKey: ['torre-redes', selection.campoId],
    queryFn: async () => {
      const { data } = await supabase.from('redes').select('id, name, slug, ativa, campo_id')
        .eq('ativa', true).eq('campo_id', selection.campoId!).order('name');
      return data || [];
    },
    enabled: !!selection.campoId,
  });

  // Fetch coordenações filtered by selected rede
  const { data: coordenacoes } = useQuery({
    queryKey: ['torre-coords', selection.redeId],
    queryFn: async () => {
      const { data } = await supabase.from('coordenacoes').select('id, name, rede_id')
        .eq('rede_id', selection.redeId!).order('ordem');
      return data || [];
    },
    enabled: !!selection.redeId,
  });

  // Fetch células filtered by selected coordenação
  const { data: celulas } = useQuery({
    queryKey: ['torre-celulas', selection.coordenacaoId],
    queryFn: async () => {
      const { data } = await supabase.from('celulas').select('id, name, coordenacao_id')
        .eq('coordenacao_id', selection.coordenacaoId!).order('name');
      return data || [];
    },
    enabled: !!selection.coordenacaoId,
  });

  // Fetch supervisors when supervisor role is selected and coordenação is set
  const needsSupervisorEntity = selection.role === 'supervisor' && !!selection.coordenacaoId;
  const { data: supervisores } = useQuery({
    queryKey: ['torre-supervisores', selection.coordenacaoId],
    queryFn: async () => {
      const { data } = await supabase.from('supervisores')
        .select(`
          id, profile_id, coordenacao_id, leadership_couple_id,
          profile:profiles!supervisores_profile_id_fkey(id, name),
          leadership_couple:leadership_couples(
            id,
            spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name)
          )
        `)
        .eq('coordenacao_id', selection.coordenacaoId!);
      return data || [];
    },
    enabled: needsSupervisorEntity,
  });

  // Compute available roles dynamically
  const availableRoles = useMemo(() =>
    getAvailableRoles(selection.campoId, selection.redeId, selection.coordenacaoId, selection.celulaId),
    [selection.campoId, selection.redeId, selection.coordenacaoId, selection.celulaId]
  );

  const structuralRoles = useMemo(() =>
    ALL_ROLES.filter(r => r.category === 'structural' && availableRoles.includes(r.value)),
    [availableRoles]
  );

  const ministryRoles = useMemo(() =>
    ALL_ROLES.filter(r => r.category === 'ministry' && availableRoles.includes(r.value)),
    [availableRoles]
  );

  // Clear role when it becomes unavailable due to scope change
  const roleIsValid = selection.role ? availableRoles.includes(selection.role) : true;

  if (!isAdmin) return null;

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

    activateDemo(
      demoScope, scopeId, label, null,
      selection.campoId, selection.redeId,
      selection.coordenacaoId, selection.celulaId,
    );

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
    setIsOpen(false);
  };

  const handleDeactivate = () => {
    deactivateDemo();
    clearActiveState();
    clearRede();
    setIsGlobalView(false);
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
          isOperating
            ? 'bg-gold/90 text-gold-foreground hover:bg-gold'
            : 'bg-card/90 backdrop-blur-lg text-foreground hover:bg-card border-gold/20',
          'hover:scale-105'
        )}
      >
        <Radar className={cn('h-5 w-5', isOperating ? 'text-gold-foreground' : 'text-gold')} />
        <span className="text-sm font-semibold hidden md:inline">Torre de Controle</span>
        {isOperating && <Radio className="h-3 w-3 animate-pulse" />}
      </button>
    );
  }

  const activeCampos = (campos || []).filter(c => c.ativo);

  // Helper to get supervisor display name
  const getSupervisorLabel = (sup: any): string => {
    if (sup.leadership_couple) {
      const s1 = sup.leadership_couple.spouse1?.name?.split(' ')[0] || '';
      const s2 = sup.leadership_couple.spouse2?.name?.split(' ')[0] || '';
      return `👫 ${s1} & ${s2}`;
    }
    return sup.profile?.name || 'Supervisor';
  };

  // Scope depth hint for user guidance
  const getScopeHint = (): string | null => {
    if (!selection.campoId) return 'Selecione um campus para ver os papéis disponíveis';
    if (!selection.redeId && structuralRoles.length > 0) return null;
    return null;
  };

  const scopeHint = getScopeHint();

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
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Escopo → Papel</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Active indicator */}
      {isOperating && (
        <div className="px-5 py-2.5 bg-gold/8 border-b border-gold/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-gold animate-pulse" />
            <span className="text-[11px] font-semibold text-gold">Operação ativa</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[11px] text-gold hover:text-foreground" onClick={handleDeactivate}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Desativar
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* ═══ STEP 1: HIERARCHY SELECTORS ═══ */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold flex items-center gap-2">
              <span className="h-px w-5 bg-gold/25" />
              1. Escolha o escopo
            </p>

            {/* Global option */}
            <button
              onClick={() => {
                setSelection({
                  campoId: null, campoNome: null,
                  redeId: null, redeNome: null,
                  coordenacaoId: null, coordenacaoNome: null,
                  celulaId: null, celulaNome: null,
                  role: 'pastor_senior_global',
                });
              }}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 mb-2',
                selection.role === 'pastor_senior_global' && !selection.campoId
                  ? 'border-gold/40 bg-gold/10 text-foreground shadow-[0_0_16px_-6px_hsl(var(--gold)/0.3)]'
                  : 'border-border/20 bg-transparent text-muted-foreground hover:bg-background/30 hover:text-foreground',
              )}
            >
              <Eye className={cn('h-4 w-4 shrink-0', selection.role === 'pastor_senior_global' && !selection.campoId ? 'text-gold' : '')} />
              <span className="text-xs font-medium">🌍 Visão Global (sem campus)</span>
            </button>

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
                  role: null,
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
                    role: null,
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
                    role: null,
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
                  setSelection({ celulaId: id, celulaNome: label, role: null });
                }}
              />
            )}
          </div>

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

          {/* ═══ STEP 2: DYNAMIC ROLES ═══ */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold flex items-center gap-2">
              <span className="h-px w-5 bg-gold/25" />
              2. Operar como
            </p>

            {scopeHint && (
              <p className="text-[11px] text-muted-foreground/60 italic">{scopeHint}</p>
            )}

            {/* Role not valid warning */}
            {!roleIsValid && selection.role && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-[11px] text-destructive">Papel anterior inválido para este escopo. Selecione outro.</span>
              </div>
            )}

            {/* Structural */}
            {structuralRoles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">Estruturais</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {structuralRoles.map(opt => (
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
            )}

            {/* Ministry */}
            {ministryRoles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">Ministérios</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ministryRoles.map(opt => (
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
            )}

            {availableRoles.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60 italic text-center py-4">
                Selecione o escopo acima para ver os papéis disponíveis
              </p>
            )}
          </div>

          {/* ═══ STEP 3: ENTITY SELECTOR (when supervisor role needs person) ═══ */}
          {needsSupervisorEntity && (
            <>
              <Separator className="bg-border/15" />
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold flex items-center gap-2">
                  <span className="h-px w-5 bg-warning/25" />
                  3. Escolha o supervisor
                </p>
                {(supervisores || []).length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span className="text-[11px] text-warning">Nenhum supervisor cadastrado nesta coordenação. Navegação permitida sem vínculo.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(supervisores || []).map((sup: any) => (
                      <button
                        key={sup.id}
                        onClick={() => {
                          // For supervisor, we keep coordenacaoId as the scope
                          // The supervisor entity is informational
                          setSelection({ celulaId: null, celulaNome: null });
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
                          'border-border/20 bg-transparent text-muted-foreground hover:bg-background/30 hover:text-foreground',
                        )}
                      >
                        <Shield className="h-4 w-4 shrink-0 text-warning" />
                        <span className="text-xs font-medium">{getSupervisorLabel(sup)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/20 px-5 py-4 space-y-2">
        <Button
          onClick={handleApply}
          disabled={!selection.role || !roleIsValid}
          className="w-full h-10 rounded-xl bg-gold/90 text-gold-foreground hover:bg-gold font-semibold text-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ativar Operação
        </Button>
        {!selection.role && !scopeHint && (
          <p className="text-[10px] text-muted-foreground text-center">
            Selecione escopo e papel para operar
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
          : 'border-border/20 bg-transparent text-muted-foreground hover:bg-background/30 hover:text-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', selected ? color : '')} />
      <span className="text-xs font-medium truncate">{label}</span>
    </button>
  );
}
