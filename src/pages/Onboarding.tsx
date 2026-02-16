import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Eye, KeyRound } from 'lucide-react';
import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';

export default function Onboarding() {
  const navigate = useNavigate();
  const { scopeType, accessKeyId } = useRole();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  const hasSession = !!scopeType && !!accessKeyId;

  useEffect(() => {
    if (hasSession) {
      checkAcceptance();
    }
  }, [accessKeyId, hasSession]);

  // If no session, redirect to login
  if (!hasSession) {
    return <Navigate to="/" replace />;
  }

  async function checkAcceptance() {
    try {
      const { data } = await supabase
        .from('policy_acceptances')
        .select('id')
        .eq('access_key_id', accessKeyId)
        .eq('policy_version', POLICY_VERSION)
        .maybeSingle();

      if (data) {
        setAlreadyAccepted(true);
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch {
      // proceed to show onboarding
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept() {
    setIsAccepting(true);
    try {
      await supabase
        .from('policy_acceptances')
        .upsert(
          {
            access_key_id: accessKeyId,
            policy_version: POLICY_VERSION,
          },
          { onConflict: 'access_key_id,policy_version' }
        );

      navigate('/dashboard', { replace: true });
    } catch {
      // retry silently
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading || alreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1a0a0b 40%, #121212 100%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A24D]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start relative overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1a0a0b 40%, #121212 100%)' }}
    >
      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(140,15,20,0.15) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(201,162,77,0.06) 0%, transparent 50%)' }} />

      <div className="relative z-10 w-full max-w-lg px-5 py-10 sm:py-16 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 opacity-0 animate-fade-in">
          <img
            src={logoRedeAmor}
            alt="Rede Amor a 2"
            className="h-20 w-20 rounded-full object-cover shadow-2xl ring-2 ring-[#C9A24D]/30"
          />
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl text-center mb-2 opacity-0 animate-fade-in-up stagger-2"
          style={{ fontFamily: "'DM Serif Display', serif", color: '#F6F4F1', letterSpacing: '-0.01em', lineHeight: 1.2 }}
        >
          Bem-vindo ao Sistema<br />Rede Amor a 2
        </h1>
        <p
          className="text-sm sm:text-base text-center max-w-sm mb-8 opacity-0 animate-fade-in-up stagger-3"
          style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}
        >
          Este sistema existe para servir o cuidado pastoral, organizar as células e apoiar as vidas que Deus confiou à liderança.
        </p>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-6 sm:p-8 space-y-6 opacity-0 animate-slide-up stagger-4"
          style={{
            background: 'linear-gradient(180deg, #1e1e22 0%, #1a1a1e 100%)',
            border: '1px solid rgba(201,162,77,0.18)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,77,0.06)',
          }}
        >
          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 shrink-0" style={{ color: '#C9A24D' }} />
              <h2 className="text-base font-semibold" style={{ color: '#F6F4F1', fontFamily: "'Inter', sans-serif" }}>
                Cuidado com as informações
              </h2>
            </div>
            <p className="text-sm pl-7" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
              Usamos essas informações para cuidar, acompanhar e servir. Trate tudo com amor, zelo e responsabilidade.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 shrink-0" style={{ color: '#C9A24D' }} />
              <h2 className="text-base font-semibold" style={{ color: '#F6F4F1', fontFamily: "'Inter', sans-serif" }}>
                Cada um vê o que precisa ver
              </h2>
            </div>
            <p className="text-sm pl-7" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
              Você verá apenas as informações ligadas à sua função e ao seu escopo (célula, supervisão, coordenação ou rede).
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 shrink-0" style={{ color: '#C9A24D' }} />
              <h2 className="text-base font-semibold" style={{ color: '#F6F4F1', fontFamily: "'Inter', sans-serif" }}>
                Seu acesso é pessoal
              </h2>
            </div>
            <p className="text-sm pl-7" style={{ color: '#B8B6B3', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
              Seu código define seu nível de acesso. Não compartilhe seu código.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full h-12 text-base font-semibold tracking-wide mt-4"
            style={{
              background: isAccepting
                ? '#B8B6B3'
                : 'linear-gradient(135deg, #C9A24D 0%, #D4B366 100%)',
              color: '#121212',
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              boxShadow: !isAccepting ? '0 4px 20px rgba(201,162,77,0.25)' : 'none',
            }}
          >
            {isAccepting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Entendi e quero continuar
          </Button>
        </div>

        {/* Verse */}
        <div className="mt-8 text-center opacity-0 animate-fade-in stagger-6">
          <p className="text-xs italic" style={{ color: 'rgba(201,162,77,0.5)', fontFamily: "'DM Serif Display', serif" }}>
            "Tudo seja feito com amor."
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(184,182,179,0.4)', fontFamily: "'Inter', sans-serif" }}>
            1 Coríntios 16:14
          </p>
        </div>

        {/* Policy version */}
        <p className="mt-4 text-[10px]" style={{ color: 'rgba(184,182,179,0.25)' }}>
          Versão da política: {POLICY_VERSION}
        </p>
      </div>
    </div>
  );
}
