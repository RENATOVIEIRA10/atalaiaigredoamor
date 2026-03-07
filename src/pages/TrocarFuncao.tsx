import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAccessLinks } from '@/hooks/useUserAccessLinks';
import { useRole } from '@/contexts/RoleContext';
import { useRede } from '@/contexts/RedeContext';
import { useCampo } from '@/contexts/CampoContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCampos } from '@/hooks/useCampos';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, AlertCircle, Lock, ArrowRight, Trash2, LogOut, MapPin, Globe } from 'lucide-react';
import { roleLabels } from '@/lib/icons';
import { RedeSelector } from '@/components/rede/RedeSelector';
import { toast } from 'sonner';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';

type ScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura' | 'recomeco_cadastro' | 'central_celulas' | 'lider_recomeco_central' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo';

const GLOBAL_SCOPES = new Set(['pastor_senior_global', 'admin', 'pastor', 'demo_institucional']);

function scopeTypeToRole(st: string) {
  const map: Record<string, string> = {
    pastor: 'pastor', admin: 'admin', rede: 'rede_leader',
    coordenacao: 'coordenador', supervisor: 'supervisor',
    celula: 'celula_leader', demo_institucional: 'demo_institucional',
    recomeco_operador: 'recomeco_operador', recomeco_leitura: 'recomeco_leitura',
    recomeco_cadastro: 'recomeco_cadastro', central_celulas: 'central_celulas',
    lider_recomeco_central: 'lider_recomeco_central',
    lider_batismo_aclamacao: 'lider_batismo_aclamacao',
    central_batismo_aclamacao: 'central_batismo_aclamacao',
    pastor_senior_global: 'pastor_senior_global',
    pastor_de_campo: 'pastor_de_campo',
  };
  return map[st] || st;
}

function scopeLabel(scopeType: string) {
  const role = scopeTypeToRole(scopeType);
  return roleLabels[role as keyof typeof roleLabels] || scopeType;
}

export default function TrocarFuncao() {
  const navigate = useNavigate();
  const { links, isLoading, upsertLink, removeLink } = useUserAccessLinks();
  const { setScopeAccess, clearAccess } = useRole();
  const { setActiveRede, clearRede } = useRede();
  const { setActiveCampo, clearCampo, setIsGlobalView } = useCampo();
  const { signOut } = useAuth();
  const { data: campos } = useCampos();
  const [showAddCode, setShowAddCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [showRedeSelect, setShowRedeSelect] = useState(false);
  const [campusFilter, setCampusFilter] = useState<string | null>(null); // null = todos

  // Build campus name map
  const campoNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    campos?.forEach(c => { m[c.id] = c.nome; });
    return m;
  }, [campos]);

  // Group links by campus
  const groupedLinks = useMemo(() => {
    const GLOBAL_KEY = '__global__';
    const groups: Record<string, typeof links> = {};

    links.forEach(link => {
      const isGlobal = GLOBAL_SCOPES.has(link.scope_type) && !link.campo_id;
      const key = isGlobal ? GLOBAL_KEY : (link.campo_id || GLOBAL_KEY);
      if (!groups[key]) groups[key] = [];
      groups[key].push(link);
    });

    // Sort: global first, then alphabetical by campus name
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      if (a === GLOBAL_KEY) return -1;
      if (b === GLOBAL_KEY) return 1;
      return (campoNameMap[a] || '').localeCompare(campoNameMap[b] || '');
    });

    return sorted;
  }, [links, campoNameMap]);

  // Available campus IDs for filter chips
  const availableCampusIds = useMemo(() => {
    const ids = new Set<string>();
    links.forEach(l => {
      if (l.campo_id) ids.add(l.campo_id);
      else if (GLOBAL_SCOPES.has(l.scope_type)) ids.add('__global__');
    });
    return ids;
  }, [links]);

  const showFilters = links.length > 5 && availableCampusIds.size > 1;

  const filteredGroups = useMemo(() => {
    if (!campusFilter) return groupedLinks;
    return groupedLinks.filter(([key]) => key === campusFilter);
  }, [groupedLinks, campusFilter]);

  const getCampusLabel = (key: string) => {
    if (key === '__global__') return 'Global / Sem campus';
    return campoNameMap[key] || 'Campus desconhecido';
  };

  const getCampusToastLabel = (link: typeof links[0]) => {
    if (GLOBAL_SCOPES.has(link.scope_type) && !link.campo_id) return 'Visão Global';
    if (link.campo_id && campoNameMap[link.campo_id]) return `Campus ${campoNameMap[link.campo_id]}`;
    return null;
  };

  const resolveCampoFromAccessKey = async (accessKeyId: string) => {
    try {
      const { data } = await supabase
        .from('access_keys')
        .select('campo_id, campos:campos!access_keys_campo_id_fkey(id, nome)')
        .eq('id', accessKeyId)
        .single();
      if (data?.campo_id && data.campos) {
        const campo = data.campos as any;
        setActiveCampo({ id: campo.id, nome: campo.nome });
      }
    } catch (_) { /* silent */ }
  };

  const resolveCampoFromPastores = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (!authUser) return null;
    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', authUser.id).single();
      if (!profile) return null;
      const { data: cp } = await supabase
        .from('campo_pastores')
        .select('campo_id, campos:campos!campo_pastores_campo_id_fkey(id, nome)')
        .eq('profile_id', profile.id)
        .limit(1)
        .single();
      if (cp?.campo_id && cp.campos) {
        const campo = cp.campos as any;
        setActiveCampo({ id: campo.id, nome: campo.nome });
        return campo;
      }
    } catch (_) { /* silent */ }
    return null;
  };

  const activateLink = async (link: typeof links[0]) => {
    const scopeType = link.scope_type as ScopeType;

    // Show micro-toast
    const campusToast = getCampusToastLabel(link);
    if (campusToast) {
      toast.info(`Entrando no ${campusToast}…`, { duration: 2000 });
    }

    if (scopeType === 'pastor_senior_global') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      clearCampo();
      setIsGlobalView(true);
      navigate('/dashboard');
      return;
    }

    if (link.campo_id) {
      const { data: campoData } = await supabase.from('campos').select('id, nome').eq('id', link.campo_id).single();
      if (campoData) setActiveCampo({ id: campoData.id, nome: campoData.nome });
    } else {
      await resolveCampoFromAccessKey(link.access_key_id);
    }

    if (scopeType === 'recomeco_operador' || scopeType === 'recomeco_leitura') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      navigate('/recomeco');
      return;
    }

    if (scopeType === 'recomeco_cadastro') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      navigate('/recomeco-cadastro');
      return;
    }

    if (scopeType === 'central_celulas') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      navigate('/central-celulas');
      return;
    }

    if (scopeType === 'lider_recomeco_central' || scopeType === 'lider_batismo_aclamacao' || scopeType === 'central_batismo_aclamacao') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      navigate('/dashboard');
      return;
    }

    if (scopeType === 'pastor_de_campo') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      const campoPastor = await resolveCampoFromPastores();
      if (!campoPastor) await resolveCampoFromAccessKey(link.access_key_id);
      navigate('/dashboard');
      return;
    }

    if (scopeType === 'pastor' || scopeType === 'admin') {
      setPendingMatch(link);
      setShowRedeSelect(true);
      return;
    }

    if (link.rede_id) {
      const { data: redeData } = await supabase
        .from('redes')
        .select('id, name, slug, ativa')
        .eq('id', link.rede_id)
        .single();
      if (redeData) setActiveRede({ id: redeData.id, name: redeData.name, slug: redeData.slug, ativa: redeData.ativa });
    }

    setScopeAccess(scopeType, link.scope_id, link.access_key_id);
    navigate('/onboarding');
  };

  const handleRedeSelected = () => {
    if (!pendingMatch) return;
    setScopeAccess(pendingMatch.scope_type as ScopeType, pendingMatch.scope_id, pendingMatch.access_key_id);
    navigate('/onboarding');
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setCodeLoading(true);
    setCodeError('');

    try {
      const normalizedCode = code.trim();
      const { data: matchRows, error: queryError } = await supabase
        .from('access_keys')
        .select('*')
        .ilike('code', normalizedCode)
        .limit(1);

      if (queryError) throw new Error('Erro ao validar código');
      const match = matchRows?.[0] ?? null;

      if (!match || !match.active) {
        setCodeError(match && !match.active ? 'Código desativado.' : 'Código inválido.');
        setCodeLoading(false);
        return;
      }

      if ((match.failed_attempts || 0) >= 5) {
        setCodeError('Código bloqueado. Contate o administrador.');
        setCodeLoading(false);
        return;
      }

      if (match.expires_at && new Date(match.expires_at) < new Date()) {
        setCodeError('Código expirado.');
        setCodeLoading(false);
        return;
      }

      await supabase
        .from('access_keys')
        .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
        .eq('id', match.id);

      const label = scopeLabel(match.scope_type);
      await upsertLink({
        id: match.id,
        scope_type: match.scope_type,
        scope_id: match.scope_id,
        rede_id: match.rede_id,
        campo_id: match.campo_id,
      }, label);

      setCode('');
      setShowAddCode(false);
    } catch (err: any) {
      setCodeError(err.message || 'Erro ao validar código');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleLogout = async () => {
    clearAccess();
    clearRede();
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center relative overflow-y-auto overscroll-y-contain" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)', WebkitOverflowScrolling: 'touch' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(197,160,89,0.12) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col items-center" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2rem)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)' }}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-center gap-4">
          <div className="rounded-lg px-2 py-1" style={{ background: 'rgba(244,237,228,0.95)' }}>
            <img src={logoIgrejaDoAmor} alt="Igreja do Amor" className="h-10 w-auto object-contain" />
          </div>
          <div className="h-8 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />
          <div className="rounded-lg px-2 py-1" style={{ background: 'rgba(244,237,228,0.95)' }}>
            <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Outfit', sans-serif", color: '#F4EDE4' }}>
          {showRedeSelect ? 'Selecionar Rede' : 'Escolha sua Função'}
        </h1>
        <p className="text-xs mb-6" style={{ color: '#B8B6B3' }}>
          {showRedeSelect ? 'Escolha a rede para continuar' : 'Selecione uma função vinculada ou adicione um novo código'}
        </p>

        <div
          className="w-full rounded-2xl p-5"
          style={{
            background: 'rgba(20,35,56,0.94)',
            border: '1px solid rgba(197,160,89,0.24)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,160,89,0.06)'
          }}
        >
          {showRedeSelect ? (
            <>
              <button
                onClick={() => { setShowRedeSelect(false); setPendingMatch(null); clearRede(); }}
                className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
                style={{ color: '#B8B6B3' }}
              >
                ← Voltar
              </button>
              <RedeSelector onSelected={handleRedeSelected} />
            </>
          ) : (
            <div className="space-y-3">
              {/* Campus filter chips */}
              {showFilters && (
                <div className="flex flex-wrap gap-2 pb-2 border-b" style={{ borderColor: 'rgba(197,160,89,0.15)' }}>
                  <button
                    onClick={() => setCampusFilter(null)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: !campusFilter ? 'rgba(197,160,89,0.26)' : 'rgba(15,26,43,0.65)',
                      color: !campusFilter ? '#F4EDE4' : '#D8D6D2',
                      border: `1px solid ${!campusFilter ? 'rgba(197,160,89,0.45)' : 'rgba(197,160,89,0.2)'}`,
                    }}
                  >
                    Todos
                  </button>
                  {[...availableCampusIds].sort((a, b) => {
                    if (a === '__global__') return -1;
                    if (b === '__global__') return 1;
                    return (campoNameMap[a] || '').localeCompare(campoNameMap[b] || '');
                  }).map(id => (
                    <button
                      key={id}
                      onClick={() => setCampusFilter(id)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: campusFilter === id ? 'rgba(197,160,89,0.26)' : 'rgba(15,26,43,0.65)',
                        color: campusFilter === id ? '#F4EDE4' : '#D8D6D2',
                        border: `1px solid ${campusFilter === id ? 'rgba(197,160,89,0.45)' : 'rgba(197,160,89,0.2)'}`,
                      }}
                    >
                      {id === '__global__' ? 'Global' : (campoNameMap[id] || 'Campus')}
                    </button>
                  ))}
                </div>
              )}

              {/* Grouped function links */}
              {filteredGroups.map(([campusKey, campusLinks]) => (
                <div key={campusKey} className="space-y-2">
                  {/* Campus header - show when multiple groups exist */}
                  {groupedLinks.length > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      {campusKey === '__global__' ? (
                        <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: '#C5A059' }} />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: '#C5A059' }} />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#C5A059' }}>
                        {getCampusLabel(campusKey)}
                      </span>
                    </div>
                  )}

                  {campusLinks.map(link => (
                    <div key={link.id} className="flex items-center gap-2">
                      <Button
                        onClick={() => activateLink(link)}
                        className="flex-1 h-12 text-sm font-semibold justify-between gap-2"
                        style={{
                          background: 'rgba(15,26,43,0.72)',
                          color: '#F4EDE4',
                          borderRadius: '12px',
                          border: '1px solid rgba(197,160,89,0.25)',
                        }}
                      >
                        <span className="truncate text-left">{link.label || scopeLabel(link.scope_type)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Campus badge inline when only one group (no headers) */}
                          {groupedLinks.length <= 1 && link.campo_id && campoNameMap[link.campo_id] && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(197,160,89,0.15)', color: '#C5A059' }}>
                              {campoNameMap[link.campo_id]}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 opacity-50" />
                        </div>
                      </Button>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: '#D8D6D2' }}
                        title="Desvincular"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {links.length === 0 && !showAddCode && (
                <p className="text-xs text-center py-4" style={{ color: '#B8B6B3' }}>
                  Nenhuma função vinculada. Insira um código de acesso para começar.
                </p>
              )}

              {/* Add code form */}
              {showAddCode ? (
                <form onSubmit={handleAddCode} className="space-y-3 pt-2 border-t" style={{ borderColor: 'rgba(197,160,89,0.15)' }}>
                  <Label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#C5A059' }}>
                    Código de Acesso
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#C5A059' }} />
                    <Input
                      type="text"
                      placeholder="Ex: redeamor-4K7P2A"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
                      className="pl-10 h-11 text-sm border-0"
                      style={{
                        background: 'rgba(15,26,43,0.72)',
                        color: '#F4EDE4',
                        borderRadius: '10px',
                        border: codeError ? '1px solid #D32F2F' : '1px solid rgba(197,160,89,0.25)',
                      }}
                      autoFocus
                    />
                  </div>
                  {codeError && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#D32F2F' }}>
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{codeError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => { setShowAddCode(false); setCode(''); setCodeError(''); }}
                      className="flex-1 h-10 text-xs"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#B8B6B3',
                        borderRadius: '10px',
                        border: '1px solid rgba(197,160,89,0.15)',
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!code.trim() || codeLoading}
                      className="flex-1 h-10 text-xs font-semibold"
                      style={{
                        background: codeLoading ? '#B8B6B3' : 'linear-gradient(135deg, #C5A059 0%, #D4B366 100%)',
                        color: '#1A2F4B',
                        borderRadius: '10px',
                      }}
                    >
                      {codeLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Validar
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  onClick={() => setShowAddCode(true)}
                  className="w-full h-11 text-sm font-medium"
                  style={{
                    background: 'rgba(197,160,89,0.1)',
                    color: '#C5A059',
                    borderRadius: '12px',
                    border: '1px solid rgba(197,160,89,0.2)',
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {links.length > 0 ? 'Adicionar outra função' : 'Inserir código de acesso'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-2 text-xs transition-colors"
          style={{ color: '#B8B6B3' }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
