import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAccessLinks } from '@/hooks/useUserAccessLinks';
import { useRole } from '@/contexts/RoleContext';
import { useRede } from '@/contexts/RedeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, AlertCircle, Lock, ArrowRight, Trash2, LogOut } from 'lucide-react';
import { roleLabels } from '@/lib/icons';
import { RedeSelector } from '@/components/rede/RedeSelector';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';

type ScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura';

function scopeTypeToRole(st: string) {
  const map: Record<string, string> = {
    pastor: 'pastor', admin: 'admin', rede: 'rede_leader',
    coordenacao: 'coordenador', supervisor: 'supervisor',
    celula: 'celula_leader', demo_institucional: 'demo_institucional',
    recomeco_operador: 'recomeco_operador', recomeco_leitura: 'recomeco_leitura',
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
  const { signOut } = useAuth();
  const [showAddCode, setShowAddCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [showRedeSelect, setShowRedeSelect] = useState(false);

  const activateLink = async (link: typeof links[0]) => {
    const scopeType = link.scope_type as ScopeType;
    
    if (scopeType === 'recomeco_operador' || scopeType === 'recomeco_leitura') {
      setScopeAccess(scopeType, link.scope_id, link.access_key_id);
      navigate('/recomeco');
      return;
    }

    if (scopeType === 'pastor' || scopeType === 'admin') {
      setPendingMatch(link);
      setShowRedeSelect(true);
      return;
    }

    // Auto-set rede
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
      const { data, error: queryError } = await supabase
        .from('access_keys')
        .select('*')
        .eq('active', true);

      if (queryError) throw new Error('Erro ao validar código');
      const match = data?.find(k => k.code.toLowerCase() === normalizedCode.toLowerCase());

      if (!match) {
        setCodeError('Código inválido.');
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

      // Update last_used_at
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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(197,160,89,0.12) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col items-center">
        {/* Header */}
        <div className="mb-5 flex items-center justify-center gap-4">
          <img src={logoIgrejaDoAmor} alt="Igreja do Amor" className="h-10 w-auto object-contain opacity-90" />
          <div className="h-8 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />
          <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-10 w-auto object-contain opacity-90" />
        </div>

        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Outfit', sans-serif", color: '#F4EDE4' }}>
          {showRedeSelect ? 'Selecionar Rede' : 'Escolha sua Função'}
        </h1>
        <p className="text-xs mb-6" style={{ color: '#B8B6B3' }}>
          {showRedeSelect ? 'Escolha a rede para continuar' : 'Selecione uma função vinculada ou adicione um novo código'}
        </p>

        <div
          className="w-full rounded-2xl p-6 bg-card border border-border"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,160,89,0.06)' }}
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
              {/* Linked functions */}
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2">
                  <Button
                    onClick={() => activateLink(link)}
                    className="flex-1 h-12 text-sm font-semibold justify-between"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#F4EDE4',
                      borderRadius: '12px',
                      border: '1px solid rgba(197,160,89,0.25)',
                    }}
                  >
                    <span>{link.label || scopeLabel(link.scope_type)}</span>
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </Button>
                  <button
                    onClick={() => removeLink(link.id)}
                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: '#B8B6B3' }}
                    title="Desvincular"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                        background: 'rgba(255,255,255,0.08)',
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
