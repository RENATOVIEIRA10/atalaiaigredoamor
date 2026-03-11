import { useState, useEffect, useRef } from 'react';
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
import { AlertCircle, Loader2, KeyRound, BookOpen, HelpCircle, ClipboardList, PlayCircle, ArrowLeft, Shield, Eye, Compass } from 'lucide-react';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { supabase } from '@/integrations/supabase/client';
import { RedeSelector } from '@/components/rede/RedeSelector';
import { roleLabels } from '@/lib/icons';
import { motion, AnimatePresence } from 'framer-motion';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    if (step === 'code' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [step]);

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
          clearCampo();
          setIsGlobalView(true);
          navigate('/home');
          return;
        }
        if (st === 'pastor_de_campo') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          const campoPastor = await resolveCampoFromPastores();
          if (!campoPastor) await resolveCampoFromAccessKey(link.access_key_id);
          navigate('/dashboard');
          return;
        }
        if (st === 'admin') {
          setScopeAccess(st, link.scope_id, link.access_key_id);
          clearCampo();
          setIsGlobalView(true);
          navigate('/dashboard');
          return;
        }
        if (st === 'pastor') {
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

      await supabase
        .from('access_keys')
        .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
        .eq('id', match.id);

      try {
        await supabase.from('access_logs').insert({
          access_key_id: match.id,
          scope_type: match.scope_type,
          scope_id: match.scope_id,
          code_used: match.code,
          user_agent: navigator.userAgent?.substring(0, 200) || null,
        });
      } catch (_) { /* silent */ }

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

      if (scopeType === 'pastor_senior_global') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        clearCampo();
        setIsGlobalView(true);
        navigate('/home');
        setIsLoading(false);
        return;
      }

      if (scopeType === 'pastor_de_campo') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        const campoPastor = await resolveCampoFromPastores();
        if (!campoPastor) await resolveCampoFromAccessKey(match.id);
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }

      if (scopeType === 'admin') {
        setScopeAccess(scopeType, match.scope_id, match.id);
        clearCampo();
        setIsGlobalView(true);
        navigate('/home');
        setIsLoading(false);
        return;
      }

      if (scopeType === 'pastor') {
        await resolveCampoFromAccessKey(match.id);
        setPendingMatch({ ...match, scopeType });
        setStep('rede-select');
        setIsLoading(false);
        return;
      }

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-gold/30 animate-spin border-t-gold" />
            <KeyRound className="absolute inset-0 m-auto h-5 w-5 text-gold" />
          </div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">Preparando seu acesso…</p>
        </motion.div>
      </div>
    );
  }

  const infoItems = [
    { icon: Eye, text: 'Sua visão no sistema' },
    { icon: Compass, text: 'Sua área de atuação' },
    { icon: Shield, text: 'Seu nível de liderança' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Cinematic ambient layers */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--gold) / 0.08) 0%, transparent 60%)'
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 100%, hsl(var(--primary) / 0.06) 0%, transparent 50%)'
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 15% 50%, hsl(var(--gold) / 0.04) 0%, transparent 40%)'
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 85% 30%, hsl(var(--primary) / 0.03) 0%, transparent 35%)'
      }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.012]" style={{
        backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 bg-secondary/50 text-muted-foreground border border-gold/10 hover:border-gold/25"
      >
        <ThemeIcon className="h-4 w-4 text-gold" />
        {theme === 'padrao' ? 'Padrão' : theme === 'claro' ? 'Claro' : 'Amor'}
      </button>

      <div className="relative z-10 w-full max-w-lg px-5 py-8 flex flex-col items-center">
        {/* Institutional header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-5 flex items-center justify-center gap-5"
        >
          <div className="flex flex-col items-center gap-1.5">
            <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 80C30 80 35 45 50 20C65 45 70 80 70 80" stroke="hsl(var(--gold))" strokeWidth="5" strokeLinecap="round"/>
              <path d="M40 65C45 62 55 62 60 65" stroke="hsl(var(--gold))" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="50" cy="15" r="5" fill="hsl(var(--gold))" />
            </svg>
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-gold" style={{ fontFamily: "'Playfair Display', serif" }}>
              ATALAIA
            </span>
          </div>
          <div className="h-14 w-px bg-gold/20" />
          <img src={logoIgrejaDoAmor} alt="Igreja do Amor" className="h-14 w-auto object-contain opacity-70 dark-invert-logo" />
          <div className="h-14 w-px bg-gold/20" />
          <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-14 w-auto object-contain opacity-70 dark-invert-logo" />
        </motion.div>

        {/* Portal title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl mb-2 font-bold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Portal de Acesso Ministerial
          </h1>
          <p className="text-sm max-w-sm mx-auto text-muted-foreground leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Seu acesso define sua missão dentro da Rede
          </p>
        </motion.div>

        {/* Main card — glassmorphism premium */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="w-full rounded-2xl p-7 sm:p-9 backdrop-blur-xl"
          style={{
            background: 'hsl(var(--card) / 0.85)',
            border: '1px solid hsl(var(--gold) / 0.2)',
            boxShadow: '0 20px 60px hsl(var(--background) / 0.6), 0 0 0 1px hsl(var(--gold) / 0.05), inset 0 1px 0 hsl(var(--gold) / 0.06)'
          }}
        >
          <AnimatePresence mode="wait">
            {step === 'code' && (
              <motion.div
                key="code-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Card header */}
                <div className="text-center mb-7">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gold/10 border border-gold/15">
                    <KeyRound className="h-5 w-5 text-gold" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Insira o código fornecido pela liderança para acessar seu campo de responsabilidade dentro da Rede Amor a Dois.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <label htmlFor="access-code" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      Código Ministerial
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/60 transition-colors group-focus-within:text-gold" />
                      <Input
                        ref={inputRef}
                        id="access-code"
                        type="text"
                        placeholder="Digite seu código ministerial"
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setError(''); }}
                        className="pl-10 h-13 text-base bg-background/60 border-gold/15 focus-visible:ring-gold/30 focus-visible:border-gold/30 text-foreground placeholder:text-muted-foreground/50"
                        style={{ borderRadius: '12px', height: '52px', fontFamily: "'Manrope', sans-serif" }}
                        autoComplete="off"
                      />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-sm text-destructive"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Info items */}
                    {!error && (
                      <div className="pt-1 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          Seu código determina:
                        </p>
                        {infoItems.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.08 }}
                            className="flex items-center gap-2.5"
                          >
                            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-gold/8">
                              <item.icon className="h-3 w-3 text-gold/70" />
                            </div>
                            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Manrope', sans-serif" }}>{item.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {attempts >= 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Não tem um código? Entre em contato com o administrador ou líder da sua rede.
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-13 text-base font-semibold tracking-wide transition-all duration-300 border-0"
                    disabled={!code.trim() || isLoading}
                    style={{
                      height: '52px',
                      borderRadius: '12px',
                      fontFamily: "'Manrope', sans-serif",
                      background: !code.trim() || isLoading
                        ? 'hsl(var(--muted))'
                        : 'linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(42 65% 58%) 100%)',
                      color: !code.trim() || isLoading
                        ? 'hsl(var(--muted-foreground))'
                        : 'hsl(var(--background))',
                      boxShadow: code.trim() && !isLoading
                        ? '0 4px 24px hsl(var(--gold) / 0.3), 0 1px 3px hsl(var(--gold) / 0.15)'
                        : 'none',
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <KeyRound className="h-4 w-4 mr-2.5" />
                    )}
                    Ativar Meu Acesso
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'rede-select' && (
              <motion.div
                key="rede-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={handleBackToCode}
                  className="flex items-center gap-1.5 text-xs mb-4 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </button>
                <RedeSelector onSelected={handleRedeSelected} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Institutional links */}
        {step === 'code' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-7 flex flex-col items-center gap-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Recursos Ministeriais
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'Material Institucional', icon: BookOpen, path: '/material' },
                { label: 'Manual do Líder', icon: ClipboardList, path: '/manual-lider' },
                { label: 'Manual do Usuário', icon: PlayCircle, path: '/manual-usuario' },
                { label: 'Perguntas Frequentes', icon: HelpCircle, path: '/faq' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-medium transition-all duration-200 bg-secondary/40 text-muted-foreground border border-gold/8 hover:border-gold/20 hover:text-gold hover:bg-gold/5"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>

            <img src={logoAnoSantidade} alt="Ano da Santidade 2026" className="h-12 w-auto object-contain opacity-40 mt-1" />
          </motion.div>
        )}

        {/* Scripture footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-7 text-center"
        >
          <p className="text-xs italic text-gold/35" style={{ fontFamily: "'Playfair Display', serif" }}>
            "Tudo seja feito com decência e ordem."
          </p>
          <p className="text-[10px] mt-0.5 text-muted-foreground/30" style={{ fontFamily: "'Manrope', sans-serif" }}>
            1 Coríntios 14:40
          </p>
        </motion.div>
      </div>
    </div>
  );
}
