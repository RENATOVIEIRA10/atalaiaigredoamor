import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { themeIcons } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Lock as LockIcon, BookOpen, HelpCircle, ClipboardList, PlayCircle } from 'lucide-react';
import { actionIcons } from '@/lib/icons';
import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { supabase } from '@/integrations/supabase/client';

export default function HomePage() {
  const navigate = useNavigate();
  const { setScopeAccess } = useRole();
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const normalizedCode = code.trim();

      const { data, error: queryError } = await supabase
        .from('access_keys')
        .select('*')
        .eq('active', true);

      if (queryError) throw new Error('Erro ao validar código');

      const match = data?.find(k => k.code.toLowerCase() === normalizedCode.toLowerCase());

      if (!match) {
        // Increment failed attempts on any key that matches (case-insensitive, even inactive)
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
        setIsLoading(false);
        return;
      }

      // Check brute-force lockout
      if ((match.failed_attempts || 0) >= 5) {
        setError('Código bloqueado por tentativas excessivas. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      // Check expiration
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

      const scopeType = match.scope_type as 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';
      setScopeAccess(scopeType, match.scope_id, match.id);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Erro ao validar código');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(197,160,89,0.12) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(197,160,89,0.06) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col items-center">
        {/* Institutional header: Atalaia + Rede Amor a 2 */}
        <div className="mb-5 flex items-center justify-center gap-5 opacity-0 animate-fade-in">
          {/* Atalaia icon */}
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

          {/* Divider */}
          <div className="h-14 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />

          {/* Igreja do Amor logo (left) */}
          <img
            src={logoIgrejaDoAmor}
            alt="Igreja do Amor"
            className="h-14 w-auto object-contain opacity-90"
          />

          {/* Divider */}
          <div className="h-14 w-px" style={{ background: 'rgba(197,160,89,0.25)' }} />

          {/* Rede Amor a 2 logo (right) */}
          <img
            src={logoRedeAmor}
            alt="Rede Amor a 2"
            className="h-14 w-auto object-contain opacity-90"
          />
        </div>

        {/* Title — staggered */}
        <div className="text-center mb-8 opacity-0 animate-fade-in-up stagger-2">
          <h1
            className="text-xl sm:text-2xl mb-2"
            style={{
              fontFamily: "'Outfit', sans-serif",
              color: '#F4EDE4',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}
          >
            Atalaia — a serviço da Rede Amor a Dois
          </h1>
          <p
            className="text-xs sm:text-sm max-w-xs mx-auto"
            style={{
              color: '#B8B6B3',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.6,
            }}
          >
            Cuidando da saúde espiritual, organizacional e pastoral da rede
          </p>
        </div>

        {/* Login card — slide-up */}
        <div
          className="w-full rounded-2xl p-6 sm:p-8 opacity-0 animate-slide-up stagger-3 bg-card border border-border"
          style={{
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(197,160,89,0.06)',
          }}
        >
          <div className="text-center mb-6">
            <p
              className="text-xs sm:text-sm"
              style={{
                color: '#B8B6B3',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Acesse com o código fornecido pela liderança e caminhe conosco no cuidado do rebanho.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="access-code"
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: '#C5A059', fontFamily: "'Inter', sans-serif" }}
              >
                Código de Acesso
              </Label>
              <div className="relative">
                <LockIcon
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: '#C5A059' }}
                />
                <Input
                  id="access-code"
                  type="text"
                  placeholder="Ex: redeamor-4K7P2A"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  className="pl-10 h-12 text-base border-0 focus-visible:ring-1 theme-amor-input"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#F4EDE4',
                    borderRadius: '12px',
                    border: error
                      ? '1px solid #D32F2F'
                      : '1px solid rgba(197,160,89,0.25)',
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
                background: !code.trim() || isLoading
                  ? '#B8B6B3'
                  : 'linear-gradient(135deg, #C5A059 0%, #D4B366 100%)',
                color: '#1A2F4B',
                borderRadius: '12px',
                fontFamily: "'Inter', sans-serif",
                boxShadow: code.trim() && !isLoading
                  ? '0 4px 20px rgba(197,160,89,0.25)'
                  : 'none',
                transition: 'all 0.2s ease-out',
              }}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <LockIcon className="h-4 w-4 mr-2" />
              )}
              Entrar no Sistema
            </Button>
          </form>
        </div>

        {/* Links institucionais */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 opacity-0 animate-fade-in stagger-5">
          <button
            onClick={() => navigate('/material')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
            style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Material Institucional
          </button>
          <button
            onClick={() => navigate('/manual-lider')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
            style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Manual do Líder
          </button>
          <button
            onClick={() => navigate('/manual-usuario')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
            style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Manual do Usuário
          </button>
          <button
            onClick={() => navigate('/faq')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
            style={{ background: 'rgba(197,160,89,0.1)', color: '#C5A059', border: '1px solid rgba(197,160,89,0.2)' }}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Perguntas Frequentes
          </button>
        </div>

        {/* Ano da Santidade badge */}
        <div className="mt-4 flex justify-center opacity-0 animate-fade-in stagger-5">
          <img
            src={logoAnoSantidade}
            alt="Ano da Santidade 2026"
            className="h-14 w-auto object-contain opacity-60"
          />
        </div>

        {/* Scripture footer */}
        <div className="mt-6 text-center opacity-0 animate-fade-in stagger-6">
          <p
            className="text-xs italic"
            style={{
              color: 'rgba(197,160,89,0.5)',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            "Tudo seja feito com decência e ordem."
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'rgba(184,182,179,0.4)', fontFamily: "'Inter', sans-serif" }}
          >
            1 Coríntios 14:40
          </p>
        </div>

        {/* Versão do sistema */}
        <p
          className="mt-4 text-[9px] opacity-0 animate-fade-in stagger-6"
          style={{ color: 'rgba(184,182,179,0.3)', fontFamily: "'Inter', sans-serif" }}
        >
          v2026.02.20-02
        </p>
      </div>
    </div>
  );
}
