import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { supabase } from '@/integrations/supabase/client';

export default function HomePage() {
  const navigate = useNavigate();
  const { setScopeAccess } = useRole();
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
        setAttempts(prev => prev + 1);
        setError('Código inválido. Verifique e tente novamente.');
        setIsLoading(false);
        return;
      }

      if (match.failed_attempts >= 5) {
        setError('Código bloqueado por tentativas excessivas. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      await supabase
        .from('access_keys')
        .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
        .eq('id', match.id);

      const scopeType = match.scope_type as 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';
      setScopeAccess(scopeType, match.scope_id);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao validar código');

      const { data: keys } = await supabase
        .from('access_keys')
        .select('id, failed_attempts')
        .ilike('code', code.trim())
        .eq('active', true);

      if (keys && keys.length > 0) {
        await supabase
          .from('access_keys')
          .update({ failed_attempts: (keys[0].failed_attempts || 0) + 1 })
          .eq('id', keys[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0e0e10 0%, #1a0a0b 40%, #121212 100%)',
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(140,15,20,0.15) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(201,162,77,0.06) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-5 py-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <img
            src={logoRedeAmor}
            alt="Rede Amor a 2"
            className="h-28 w-28 rounded-full object-cover shadow-2xl ring-2 ring-[#C9A24D]/30"
          />
        </div>

        {/* Welcome text */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl sm:text-3xl mb-2"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: '#F6F4F1',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Bem-vindo à Rede Amor a 2
          </h1>
          <p
            className="text-sm sm:text-base max-w-xs mx-auto"
            style={{
              color: '#B8B6B3',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.6,
            }}
          >
            Uma ferramenta para servir, cuidar e organizar vidas no Reino.
          </p>
        </div>

        {/* Login card */}
        <div
          className="w-full rounded-2xl p-6 sm:p-8"
          style={{
            background: 'linear-gradient(180deg, #1e1e22 0%, #1a1a1e 100%)',
            border: '1px solid rgba(201,162,77,0.18)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,77,0.06)',
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
                style={{ color: '#C9A24D', fontFamily: "'Inter', sans-serif" }}
              >
                Código de Acesso
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: '#C9A24D' }}
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
                  className="pl-10 h-12 text-base border-0 focus-visible:ring-1"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: '#F6F4F1',
                    borderRadius: '12px',
                    border: error
                      ? '1px solid #D32F2F'
                      : '1px solid rgba(201,162,77,0.15)',
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
              className="w-full h-12 text-base font-semibold tracking-wide transition-all duration-200"
              disabled={!code.trim() || isLoading}
              style={{
                background: !code.trim() || isLoading
                  ? '#B8B6B3'
                  : 'linear-gradient(135deg, #C9A24D 0%, #D4B366 100%)',
                color: '#121212',
                borderRadius: '12px',
                fontFamily: "'Inter', sans-serif",
                boxShadow: code.trim() && !isLoading
                  ? '0 4px 20px rgba(201,162,77,0.25)'
                  : 'none',
              }}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Entrar no Sistema
            </Button>
          </form>
        </div>

        {/* Ano da Santidade badge */}
        <div className="mt-6 flex justify-center">
          <img
            src={logoAnoSantidade}
            alt="Ano da Santidade 2026"
            className="h-14 w-auto object-contain opacity-60"
          />
        </div>

        {/* Scripture footer */}
        <div className="mt-6 text-center">
          <p
            className="text-xs italic"
            style={{
              color: 'rgba(201,162,77,0.5)',
              fontFamily: "'DM Serif Display', serif",
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
      </div>
    </div>
  );
}
