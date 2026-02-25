import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';

type AuthView = 'main' | 'email-login' | 'email-signup';

export default function Auth() {
  const { user, isLoading, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Process OAuth callback on mount
  useEffect(() => {
    const processOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);

      const error = hashParams.get('error') || urlParams.get('error');
      const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

      if (error) {
        setAuthError(errorDescription || error);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = urlParams.get('code');

      if ((accessToken && refreshToken) || code) {
        setIsProcessingCallback(true);
        try {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) setAuthError(error.message);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : 'Erro ao processar autenticação');
        } finally {
          setIsProcessingCallback(false);
        }
      }
    };
    processOAuthCallback();
  }, []);

  // Redirect to Home (code entry) after auth
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setAuthError(null);
    try {
      if (view === 'email-signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/auth' },
        });
        if (error) throw error;
        setEmailSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação');
    } finally {
      setEmailLoading(false);
    }
  };

  if (isLoading || isProcessingCallback) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      {/* Radial glows */}
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
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#C5A059', fontFamily: "'Outfit', sans-serif" }}>ATALAIA</span>
          </div>
          <div className="h-14 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />
          <img src={logoIgrejaDoAmor} alt="Igreja do Amor" className="h-14 w-auto object-contain opacity-90" />
          <div className="h-14 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />
          <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-14 w-auto object-contain opacity-90" />
        </div>

        {/* Title */}
        <div className="text-center mb-8 opacity-0 animate-fade-in-up stagger-2">
          <h1 className="text-xl sm:text-2xl mb-2" style={{ fontFamily: "'Outfit', sans-serif", color: '#F4EDE4', fontWeight: 600 }}>
            Atalaia — Entrar
          </h1>
          <p className="text-xs sm:text-sm max-w-xs mx-auto" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-6 sm:p-8 opacity-0 animate-slide-up stagger-3 bg-card border border-border"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,160,89,0.06)' }}
        >
          {authError && (
            <div className="flex items-center gap-2 text-sm mb-4 p-3 rounded-lg" style={{ background: 'rgba(211,47,47,0.1)', color: '#D32F2F' }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {emailSent && (
            <div className="text-center p-4 rounded-lg mb-4" style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059' }}>
              <p className="text-sm font-medium">Verifique seu e-mail</p>
              <p className="text-xs mt-1" style={{ color: '#B8B6B3' }}>
                Enviamos um link de confirmação para <strong>{email}</strong>.
              </p>
            </div>
          )}

          {view === 'main' && !emailSent && (
            <div className="space-y-3">
              {/* Google */}
              <Button
                onClick={() => { setAuthError(null); signInWithGoogle(); }}
                className="w-full h-12 text-base font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#F4EDE4',
                  borderRadius: '12px',
                  border: '1px solid rgba(197,160,89,0.25)',
                }}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </Button>

              {/* Apple */}
              <Button
                onClick={() => { setAuthError(null); signInWithApple(); }}
                className="w-full h-12 text-base font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#F4EDE4',
                  borderRadius: '12px',
                  border: '1px solid rgba(197,160,89,0.25)',
                }}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Entrar com Apple
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(197,160,89,0.15)' }} />
                <span className="text-xs" style={{ color: '#B8B6B3' }}>ou</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(197,160,89,0.15)' }} />
              </div>

              {/* Email */}
              <Button
                onClick={() => { setAuthError(null); setView('email-login'); }}
                className="w-full h-12 text-base font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#F4EDE4',
                  borderRadius: '12px',
                  border: '1px solid rgba(197,160,89,0.25)',
                }}
              >
                <Mail className="mr-2 h-5 w-5" />
                Entrar com E-mail
              </Button>
            </div>
          )}

          {(view === 'email-login' || view === 'email-signup') && !emailSent && (
            <>
              <button
                onClick={() => { setView('main'); setAuthError(null); setEmail(''); setPassword(''); }}
                className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
                style={{ color: '#B8B6B3' }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>

              <h2 className="text-sm font-semibold mb-4" style={{ color: '#F4EDE4' }}>
                {view === 'email-login' ? 'Entrar com E-mail' : 'Criar Conta'}
              </h2>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium uppercase tracking-widest" style={{ color: '#C5A059' }}>
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 text-sm border-0"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#F4EDE4',
                      borderRadius: '10px',
                      border: '1px solid rgba(197,160,89,0.25)',
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-widest" style={{ color: '#C5A059' }}>
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 text-sm border-0"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#F4EDE4',
                      borderRadius: '10px',
                      border: '1px solid rgba(197,160,89,0.25)',
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold"
                  disabled={emailLoading}
                  style={{
                    background: emailLoading ? '#B8B6B3' : 'linear-gradient(135deg, #C5A059 0%, #D4B366 100%)',
                    color: '#1A2F4B',
                    borderRadius: '10px',
                  }}
                >
                  {emailLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {view === 'email-login' ? 'Entrar' : 'Criar Conta'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                {view === 'email-login' ? (
                  <button
                    onClick={() => { setView('email-signup'); setAuthError(null); }}
                    className="text-xs underline"
                    style={{ color: '#C5A059' }}
                  >
                    Não tem conta? Cadastre-se
                  </button>
                ) : (
                  <button
                    onClick={() => { setView('email-login'); setAuthError(null); }}
                    className="text-xs underline"
                    style={{ color: '#C5A059' }}
                  >
                    Já tem conta? Entrar
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center opacity-0 animate-fade-in stagger-6">
          <p className="text-xs italic" style={{ color: 'rgba(197,160,89,0.5)', fontFamily: "'Outfit', sans-serif" }}>
            "Tudo seja feito com decência e ordem."
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(184,182,179,0.4)' }}>
            1 Coríntios 14:40
          </p>
        </div>
      </div>
    </div>
  );
}
