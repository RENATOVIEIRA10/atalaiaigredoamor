import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useRede } from '@/contexts/RedeContext';
import { useCampo } from '@/contexts/CampoContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAccessLinks } from '@/hooks/useUserAccessLinks';
import { themeIcons } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Lock as LockIcon, BookOpen, HelpCircle, ClipboardList, PlayCircle, ArrowLeft } from 'lucide-react';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { supabase } from '@/integrations/supabase/client';
import { RedeSelector } from '@/components/rede/RedeSelector';
import { roleLabels } from '@/lib/icons';

type LoginStep = 'code' | 'rede-select';
type ScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura' | 'recomeco_cadastro' | 'central_celulas' | 'lider_recomeco_central' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo';

function scopeTypeToRoleKey(st: string) {
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
  const role = scopeTypeToRoleKey(scopeType);
  return roleLabels[role as keyof typeof roleLabels] || scopeType;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { setScopeAccess, selectedRole } = useRole();
  const { setActiveRede, clearRede } = useRede();
  const { setActiveCampo, clearCampo, setIsGlobalView } = useCampo();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { links, isLoading: linksLoading, upsertLink } = useUserAccessLinks();
  const ThemeIcon = themeIcons[theme];
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('code');
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [autoRedirectDone, setAutoRedirectDone] = useState(false);

  // Helper: resolve campo from access_key and set context
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
        return campo;
      }
    } catch (_) { /* silent */ }
    return null;
  };

  // Helper: resolve campo from campo_pastores table for pastor_de_campo
  const resolveCampoFromPastores = async () => {
    if (!user) return null;
    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
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

  // Auto-redirect: if user has exactly 1 linked function and no role selected yet, activate it
  useEffect(() => {
    if (linksLoading || autoRedirectDone || selectedRole) return;
    if (links.length === 1) {
      setAutoRedirectDone(true);
      const link = links[0];
      const st = link.scope_type as ScopeType;

      const doAutoActivate = async () => {
        // Resolve campo from link directly if available
        if (link.campo_id) {
          const { data: campoData } = await supabase.from('campos').select('id, nome').eq('id', link.campo_id).single();
          if (campoData) setActiveCampo({ id: campoData.id, nome: campoData.nome });
        }

        if (st === 'recomeco_operador' || st === 'recomeco_leitura') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          navigate('/recomeco');
          return;
        }
        if (st === 'recomeco_cadastro') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          navigate('/recomeco-cadastro');
          return;
        }
        if (st === 'central_celulas') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          navigate('/central-celulas');
          return;
        }
        if (st === 'lider_recomeco_central') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          navigate('/dashboard');
          return;
        }
        if (st === 'lider_batismo_aclamacao') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          navigate('/dashboard');
          return;
        }
        if (st === 'central_batismo_aclamacao') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          navigate('/dashboard');
          return;
        }
        if (st === 'pastor_senior_global') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          // Always start in global view, never fall into a campus
          clearCampo();
          setIsGlobalView(true);
          navigate('/dashboard');
          return;
        }
        if (st === 'pastor_de_campo') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          // Try campo_pastores first, then fallback to access_key
          const campoPastor = await resolveCampoFromPastores();
          if (!campoPastor) await resolveCampoFromAccessKey(link.access_key_id);
          navigate('/dashboard');
          return;
        }
        if (st === 'pastor' || st === 'admin') {
          // Can't auto-select rede, go to trocar-funcao
          navigate('/trocar-funcao');
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
        // Auto-set campo from access_key
        await resolveCampoFromAccessKey(link.access_key_id);
        setScopeAccess(st, link.scope_id, link.access_key_id);
        navigate('/onboarding');
      };
      doAutoActivate();
    } else if (links.length > 1) {
      setAutoRedirectDone(true);
      navigate('/trocar-funcao');
    }
  }, [links, linksLoading, autoRedirectDone, selectedRole, setScopeAccess, navigate, setActiveRede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const normalizedCode = code.trim();

      // Query directly by code (case-insensitive) to avoid 1000-row limit
      const { data: matchRows, error: queryError } = await supabase
        .from('access_keys')
        .select('*')
        .ilike('code', normalizedCode)
        .limit(1);

      if (queryError) throw new Error('Erro ao validar código');

      const match = matchRows?.[0] ?? null;

      if (!match || !match.active) {
        if (match && !match.active) {
          setError('Código desativado. Contate o administrador.');
        } else {
          // Increment failed_attempts for any matching (inactive) key
          const { data: anyKeys } = await supabase
            .from('access_keys')
            .select('id, failed_attempts')
            .ilike('code', normalizedCode);
          if (anyKeys && anyKeys.length > 0) {
            await supabase
              .from('access_keys')
              .update({ failed_attempts: (anyKeys[0].failed_attempts || 0) + 1 })
              .eq('id', anyKeys[0].id);
          }
          setAttempts(prev => prev + 1);
          setError('Código inválido. Verifique e tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      if ((match.failed_attempts || 0) >= 5) {
        setError('Código bloqueado por tentativas excessivas. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      if (match.expires_at && new Date(match.expires_at) < new Date()) {
        setError('Código expirado. Solicite um novo ao administrador.');
        setIsLoading(false);
        return;
      }

      // Update last_used_at and reset failed attempts
      await supabase
        .from('access_keys')
        .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
        .eq('id', match.id);

      // Log access silently
      try {
        await supabase.from('access_logs').insert({
          access_key_id: match.id,
          scope_type: match.scope_type,
          scope_id: match.scope_id,
          code_used: match.code,
          user_agent: navigator.userAgent?.substring(0, 200) || null,
        });
      } catch (_) { /* silent */ }

      // Save link to user
      const label = scopeLabel(match.scope_type);
      const campoResolved = await resolveCampoFromAccessKey(match.id);
      await upsertLink({
        id: match.id,
        scope_type: match.scope_type,
        scope_id: match.scope_id,
        rede_id: match.rede_id,
        campo_id: match.campo_id,
      }, label);

      const scopeType = match.scope_type as ScopeType;

      // Recomeco scopes go directly to their pages
      if (scopeType === 'recomeco_operador' || scopeType === 'recomeco_leitura') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        navigate('/recomeco');
        setIsLoading(false);
        return;
      }
      if (scopeType === 'recomeco_cadastro') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        navigate('/recomeco-cadastro');
        setIsLoading(false);
        return;
      }
      if (scopeType === 'central_celulas') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        navigate('/central-celulas');
        setIsLoading(false);
        return;
      }
      if (scopeType === 'lider_recomeco_central') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }
      if (scopeType === 'lider_batismo_aclamacao') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }
      if (scopeType === 'central_batismo_aclamacao') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }

      // Pastor senior global — ALWAYS starts in global view
      if (scopeType === 'pastor_senior_global') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        // Clear any previously saved campus and activate global view
        clearCampo();
        setIsGlobalView(true);
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }

      // Pastor de campo
      if (scopeType === 'pastor_de_campo') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        const campoPastor = await resolveCampoFromPastores();
        if (!campoPastor) await resolveCampoFromAccessKey(match.id);
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }

      // Pastor/admin can pick any rede
      if (scopeType === 'pastor' || scopeType === 'admin') {
        await resolveCampoFromAccessKey(match.id);
        setPendingMatch({ ...match, scopeType });
        setStep('rede-select');
        setIsLoading(false);
        return;
      }

      // For scoped roles, auto-set rede from access_key
      if (match.rede_id) {
        const { data: redeData } = await supabase
          .from('redes')
          .select('id, name, slug, ativa')
          .eq('id', match.rede_id)
          .single();
        if (redeData) {
          setActiveRede({ id: redeData.id, name: redeData.name, slug: redeData.slug, ativa: redeData.ativa });
        }
      }

      // Auto-set campo
      await resolveCampoFromAccessKey(match.id);

      setScopeAccess(scopeType, match.scope_id, match.id);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Erro ao validar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeSelected = () => {
    if (!pendingMatch) return;
    const scopeType = pendingMatch.scopeType;
    setScopeAccess(scopeType, pendingMatch.scope_id, pendingMatch.id);
    navigate('/onboarding');
  };

  const handleBackToCode = () => {
    setStep('code');
    setPendingMatch(null);
    clearRede();
  };

  // Show loading while checking links for auto-redirect
  if (linksLoading && !selectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
        style={{ background: 'rgba(197,160,89,0.1)', color: '#B8B6B3', border: '1px solid rgba(197,160,89,0.15)' }}
      >
        <ThemeIcon className="h-4 w-4" style={{ color: '#C5A059' }} />
        {theme === 'padrao' ? 'Tema Padrão' : 'Tema Amor'}
      </button>
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(197,160,89,0.12) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(197,160,89,0.06) 0%, transparent 50%)' }} />

      <div className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col items-center">
        {/* Institutional header */}
        <div className="mb-5 flex items-center justify-center gap-5 opacity-0 animate-fade-in">
          <div className="flex flex-col items-center gap-1">
            <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 80C30 80 35 45 50 20C65 45 70 80 70 80" stroke="#C5A059" strokeWidth="6" strokeLinecap="round"/>
              <path d="M40 65C45 62 55 62 60 65" stroke="#C5A059" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="50" cy="15" r="5" fill="#C5A059" />
            </svg>
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#C5A059', fontFamily: "'Outfit', sans-serif" }}>
              ATALAIA
            </span>
          </div>
          <div className="h-14 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />
          <img src={logoIgrejaDoAmor} alt="Igreja do Amor" className="h-14 w-auto object-contain opacity-90" />
          <div className="h-14 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />
          <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-14 w-auto object-contain opacity-90" />
        </div>

        {/* Title */}
        <div className="text-center mb-8 opacity-0 animate-fade-in-up stagger-2">
          <h1 className="text-xl sm:text-2xl mb-2" style={{ fontFamily: "'Outfit', sans-serif", color: '#F4EDE4', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            Atalaia — a serviço da Rede Amor a Dois
          </h1>
          <p className="text-xs sm:text-sm max-w-xs mx-auto" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
            Cuidando da saúde espiritual, organizacional e pastoral da rede
          </p>
        </div>

        {/* Main card */}
        <div
          className="w-full rounded-2xl p-6 sm:p-8 opacity-0 animate-slide-up stagger-3 bg-card border border-border"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,160,89,0.06)' }}
        >
          {step === 'code' && (
            <>
              <div className="text-center mb-6">
                <p className="text-xs sm:text-sm" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif" }}>
                  Acesse com o código fornecido pela liderança e caminhe conosco no cuidado do rebanho.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="access-code" className="text-xs font-medium uppercase tracking-widest" style={{ color: '#C5A059', fontFamily: "'Inter', sans-serif" }}>
                    Código de Acesso
                  </Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#C5A059' }} />
                    <Input
                      id="access-code"
                      type="text"
                      placeholder="Ex: redeamor-4K7P2A"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setError(''); }}
                      className="pl-10 h-12 text-base border-0 focus-visible:ring-1 theme-amor-input"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#F4EDE4',
                        borderRadius: '12px',
                        border: error ? '1px solid #D32F2F' : '1px solid rgba(197,160,89,0.25)',
                        fontFamily: "'Inter', sans-serif",
                      }}
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#D32F2F' }}>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {!error && (
                    <p className="text-xs" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif" }}>
                      Seu acesso define o nível de informações que você poderá visualizar.
                    </p>
                  )}
                  {attempts >= 3 && (
                    <p className="text-xs" style={{ color: '#B8B6B3' }}>
                      💡 Não tem um código? Entre em contato com o administrador ou líder da sua rede.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold tracking-wide btn-tap"
                  disabled={!code.trim() || isLoading}
                  style={{
                    background: !code.trim() || isLoading ? '#B8B6B3' : 'linear-gradient(135deg, #C5A059 0%, #D4B366 100%)',
                    color: '#1A2F4B',
                    borderRadius: '12px',
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: code.trim() && !isLoading ? '0 4px 20px rgba(197,160,89,0.25)' : 'none',
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LockIcon className="h-4 w-4 mr-2" />}
                  Entrar no Sistema
                </Button>
              </form>
            </>
          )}

          {step === 'rede-select' && (
            <>
              <button
                onClick={handleBackToCode}
                className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
                style={{ color: '#B8B6B3' }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
              <RedeSelector onSelected={handleRedeSelected} />
            </>
          )}
        </div>

        {/* Links institucionais */}
        {step === 'code' && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 opacity-0 animate-fade-in stagger-5">
              <button onClick={() => navigate('/material')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors" style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}>
                <BookOpen className="h-3.5 w-3.5" />
                Material Institucional
              </button>
              <button onClick={() => navigate('/manual-lider')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors" style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}>
                <ClipboardList className="h-3.5 w-3.5" />
                Manual do Líder
              </button>
              <button onClick={() => navigate('/manual-usuario')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors" style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}>
                <PlayCircle className="h-3.5 w-3.5" />
                Manual do Usuário
              </button>
              <button onClick={() => navigate('/faq')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors" style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}>
                <HelpCircle className="h-3.5 w-3.5" />
                Perguntas Frequentes
              </button>
            </div>

            <div className="mt-4 flex justify-center opacity-0 animate-fade-in stagger-5">
              <img src={logoAnoSantidade} alt="Ano da Santidade 2026" className="h-14 w-auto object-contain opacity-60" />
            </div>
          </>
        )}

        {/* Scripture footer */}
        <div className="mt-6 text-center opacity-0 animate-fade-in stagger-6">
          <p className="text-xs italic" style={{ color: 'rgba(197,160,89,0.5)', fontFamily: "'Outfit', sans-serif" }}>
            "Tudo seja feito com decência e ordem."
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(184,182,179,0.4)', fontFamily: "'Inter', sans-serif" }}>
            1 Coríntios 14:40
          </p>
        </div>

        <p className="mt-4 text-[9px] opacity-0 animate-fade-in stagger-6" style={{ color: 'rgba(184,182,179,0.3)', fontFamily: "'Inter', sans-serif" }}>
          v2026.02.25-01
        </p>
      </div>
    </div>
  );
}
