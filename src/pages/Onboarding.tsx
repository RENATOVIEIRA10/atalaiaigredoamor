import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { useRede } from '@/contexts/RedeContext';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';
import { Loader2 } from 'lucide-react';
import { getOnboardingRole } from '@/components/onboarding/onboardingRoles';
import { OnboardingSlides } from '@/components/onboarding/OnboardingSlides';
import { EnteredView } from '@/components/onboarding/EnteredView';

export default function Onboarding() {
  const navigate = useNavigate();
  const { scopeType, accessKeyId } = useRole();
  const { activeCampo } = useCampo();
  const { activeRede } = useRede();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [phase, setPhase] = useState<'onboarding' | 'done'>('onboarding');

  const hasSession = !!scopeType && !!accessKeyId;
  const role = getOnboardingRole(scopeType || '');
  const accentVar = `var(--${role.accentToken})`;

  useEffect(() => {
    if (hasSession) checkAcceptance();
  }, [accessKeyId, hasSession]);

  if (!hasSession) return <Navigate to="/" replace />;

  async function checkAcceptance() {
    try {
      const { data } = await supabase
        .from('policy_acceptances')
        .select('id')
        .eq('access_key_id', accessKeyId)
        .eq('policy_version', POLICY_VERSION)
        .maybeSingle();

      if (data) {
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch {
      // show onboarding
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
          { access_key_id: accessKeyId, policy_version: POLICY_VERSION },
          { onConflict: 'access_key_id,policy_version' }
        );
      setPhase('done');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center relative bg-background overflow-auto"
      style={{
        minHeight: '100dvh',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.022]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          inset: '-50%', width: '200%', height: '200%',
          animation: 'grain 0.5s steps(1) infinite',
        }}
      />

      {/* Ambient glows */}
      <div
        className="fixed pointer-events-none animate-[breathe-vis_5s_ease-in-out_infinite]"
        style={{
          top: -100, left: -100, width: 600, height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsl(${accentVar} / 0.08) 0%, transparent 65%)`,
          transition: 'background 0.8s ease',
        }}
      />
      <div
        className="fixed pointer-events-none animate-[breathe-vis_6s_ease-in-out_infinite_2s]"
        style={{
          bottom: -80, right: -80, width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(var(--vida) / 0.05) 0%, transparent 65%)',
        }}
      />

      {/* Dot grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--gold) / 0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Logo header */}
      <div className="flex items-center gap-2 mb-8 animate-[fade-in_0.5s_ease_both] z-10">
        <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
          <path d="M20 80C20 80 28 40 50 15C72 40 80 80 80 80"
            stroke="hsl(var(--gold))" strokeWidth="12" strokeLinecap="round" />
          <path d="M35 60C40 57 60 57 65 60"
            stroke="hsl(var(--gold))" strokeWidth="9" strokeLinecap="round" />
          <circle cx="50" cy="8" r="9" fill="hsl(var(--gold))" />
        </svg>
        <span className="font-mono text-[10px] tracking-[0.18em] text-primary">
          ATALAIA OS
        </span>
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-[420px] rounded-3xl backdrop-blur-[24px] relative overflow-hidden z-10"
        style={{
          background: 'hsl(214 49% 20% / 0.55)',
          border: '1px solid hsl(var(--border) / 0.4)',
          padding: '32px 28px',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-700"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(${accentVar} / 0.5), transparent)`,
          }}
        />

        {/* Internal glass reflection */}
        <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-3xl pointer-events-none"
          style={{ background: 'linear-gradient(180deg, hsl(var(--foreground) / 0.015) 0%, transparent 100%)' }}
        />

        <div className="relative z-[2]">
          {phase === 'onboarding' && (
            <OnboardingSlides
              role={role}
              accentVar={accentVar}
              onEnter={handleAccept}
              isAccepting={isAccepting}
            />
          )}
          {phase === 'done' && (
            <EnteredView role={role} accentVar={accentVar} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 font-mono text-[9.5px] tracking-[0.08em] text-muted-foreground/50 animate-[fade-in_0.5s_ease_0.5s_both] z-10">
        Igreja do Amor · Rede Amor a 2 · {new Date().getFullYear()}
      </div>

      {/* Policy version */}
      <p className="mt-2 text-[10px] text-muted-foreground/20 z-10">
        Versão da política: {POLICY_VERSION}
      </p>
    </div>
  );
}
