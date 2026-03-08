import { useEffect, useMemo } from 'react';
import { useTorreControle, TorreRole } from '@/contexts/TorreControleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useRole } from '@/contexts/RoleContext';
import { useCampos } from '@/hooks/useCampos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Landmark, X, Building2, Network, Users, User,
  ChevronRight, Eye, RotateCcw, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DemoScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional';

const ROLE_OPTIONS: { value: TorreRole; label: string; icon: string }[] = [
  { value: 'pastor_senior_global', label: 'Pastor Global', icon: '🌐' },
  { value: 'pastor_de_campo', label: 'Pastor de Campo', icon: '⛪' },
  { value: 'rede', label: 'Líder de Rede', icon: '🔗' },
  { value: 'coordenacao', label: 'Coordenador', icon: '📋' },
  { value: 'supervisor', label: 'Supervisor', icon: '👁️' },
  { value: 'celula', label: 'Líder de Célula', icon: '🏠' },
  { value: 'lider_recomeco_central', label: 'Líder Recomeço', icon: '🔄' },
  { value: 'central_celulas', label: 'Central de Células', icon: '📞' },
  { value: 'lider_batismo_aclamacao', label: 'Líder Batismo', icon: '💧' },
  { value: 'central_batismo_aclamacao', label: 'Central Batismo', icon: '📝' },
  { value: 'recomeco_operador', label: 'Operador Recomeço', icon: '✍️' },
  { value: 'recomeco_cadastro', label: 'Cadastro Recomeço', icon: '📄' },
];

function torreRoleToDemoScope(role: TorreRole): DemoScopeType {
  switch (role) {
    case 'pastor_senior_global': return 'pastor';
    case 'pastor_de_campo': return 'pastor';
    case 'rede': return 'rede';
    case 'coordenacao': return 'coordenacao';
    case 'supervisor': return 'supervisor';
    case 'celula': return 'celula';
    default: return 'pastor';
  }
}

function torreRoleLabel(role: TorreRole): string {
  return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
}

export function TorreControlePanel() {
  const { isAdmin } = useRole();
  const { isOpen, setIsOpen, selection, setSelection, clearSelection, isActive } = useTorreControle();
  const { activateDemo, deactivateDemo, isDemoActive } = useDemoMode();
  const { data: campos } = useCampos();

  // Fetch redes filtered by selected campus
  const { data: redes } = useQuery({
    queryKey: ['torre-redes', selection.campoId],
    queryFn: async () => {
      let q = supabase.from('redes').select('id, name, campo_id').eq('ativa', true).order('name');
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

  // Apply selection to demo mode
  const handleApply = () => {
    if (!selection.role) return;
    const demoScope = torreRoleToDemoScope(selection.role);
    
    // Determine scopeId based on role
    let scopeId: string | null = null;
    if (selection.role === 'celula') scopeId = selection.celulaId;
    else if (selection.role === 'supervisor') scopeId = selection.coordenacaoId;
    else if (selection.role === 'coordenacao') scopeId = selection.coordenacaoId;
    else if (selection.role === 'rede') scopeId = selection.redeId;

    const label = `Torre: ${torreRoleLabel(selection.role)}`;
    activateDemo(demoScope, scopeId, label, null, selection.campoId);
  };

  const handleDeactivate = () => {
    deactivateDemo();
    clearSelection();
  };

  if (!isAdmin) return null;

  // Floating toggle button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 shadow-2xl transition-all duration-300",
          "bg-primary text-primary-foreground hover:scale-105",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Landmark className="h-5 w-5" />
        <span className="text-sm font-semibold hidden md:inline">Torre de Controle</span>
        {isActive && <Radio className="h-3.5 w-3.5" />}
      </button>
    );
  }

  const activeCampos = (campos || []).filter(c => c.ativo);

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">Torre de Controle</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Active indicator */}
      {isActive && isDemoActive && (
        <div className="px-4 py-2 bg-accent/20 border-b border-accent/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-accent-foreground animate-pulse" />
            <span className="text-xs font-medium text-accent-foreground">Modo ativo</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-accent-foreground" onClick={handleDeactivate}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Desativar
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* 1. Campus */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              Campus
            </label>
            <Select
              value={selection.campoId || ''}
              onValueChange={(v) => {
                const campo = activeCampos.find(c => c.id === v);
                setSelection({
                  campoId: v, campoNome: campo?.nome || null,
                  redeId: null, redeNome: null,
                  coordenacaoId: null, coordenacaoNome: null,
                  celulaId: null, celulaNome: null,
                });
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecionar campus..." />
              </SelectTrigger>
              <SelectContent>
                {activeCampos.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Rede */}
          {selection.campoId && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Network className="h-3.5 w-3.5" />
                Rede
              </label>
              <Select
                value={selection.redeId || ''}
                onValueChange={(v) => {
                  const rede = (redes || []).find(r => r.id === v);
                  setSelection({
                    redeId: v, redeNome: rede?.name || null,
                    coordenacaoId: null, coordenacaoNome: null,
                    celulaId: null, celulaNome: null,
                  });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar rede..." />
                </SelectTrigger>
                <SelectContent>
                  {(redes || []).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3. Coordenação */}
          {selection.redeId && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" />
                Coordenação
              </label>
              <Select
                value={selection.coordenacaoId || ''}
                onValueChange={(v) => {
                  const coord = (coordenacoes || []).find(c => c.id === v);
                  setSelection({
                    coordenacaoId: v, coordenacaoNome: coord?.name || null,
                    celulaId: null, celulaNome: null,
                  });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar coordenação..." />
                </SelectTrigger>
                <SelectContent>
                  {(coordenacoes || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 4. Célula */}
          {selection.coordenacaoId && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <User className="h-3.5 w-3.5" />
                Célula
              </label>
              <Select
                value={selection.celulaId || ''}
                onValueChange={(v) => {
                  const cel = (celulas || []).find(c => c.id === v);
                  setSelection({ celulaId: v, celulaNome: cel?.name || null });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar célula..." />
                </SelectTrigger>
                <SelectContent>
                  {(celulas || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Breadcrumb */}
          {selection.campoId && (
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {selection.campoNome && (
                <>
                  <Badge variant="outline" className="text-[10px] h-5">{selection.campoNome}</Badge>
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

          <Separator />

          {/* 5. Visualizar como */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Eye className="h-3.5 w-3.5" />
              Visualizar como
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelection({ role: opt.value })}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left",
                    "border border-border hover:border-primary/40 hover:bg-primary/5",
                    selection.role === opt.value && "border-primary bg-primary/10 text-primary shadow-sm"
                  )}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Apply button */}
      <div className="p-4 border-t border-border bg-muted/20">
        <Button
          className="w-full"
          disabled={!selection.role || !selection.campoId}
          onClick={handleApply}
        >
          <Eye className="h-4 w-4 mr-2" />
          Aplicar Visão
        </Button>
        {(!selection.campoId || !selection.role) && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Selecione campus e papel para aplicar
          </p>
        )}
      </div>
    </div>
  );
}
