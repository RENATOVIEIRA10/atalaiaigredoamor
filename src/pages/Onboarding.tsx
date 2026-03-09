import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Eye, KeyRound, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
} as const;

const sections = [
  {
    icon: ShieldCheck,
    title: 'Cuidado com as informações',
    text: 'Os dados aqui são vidas reais. Trate cada informação com zelo, responsabilidade e amor pastoral.',
  },
  {
    icon: Eye,
    title: 'Visão por escopo',
    text: 'Você verá apenas o que é relevante à sua função — célula, supervisão, coordenação ou rede.',
  },
  {
    icon: KeyRound,
    title: 'Acesso pessoal e intransferível',
    text: 'Seu código define seu nível de acesso. Nunca compartilhe suas credenciais.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { scopeType, accessKeyId } = useRole();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  const hasSession = !!scopeType && !!accessKeyId;

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
        setAlreadyAccepted(true);
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
      navigate('/dashboard', { replace: true });
    } catch {
      // retry
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading || alreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative overflow-y-auto bg-background">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, hsl(217 72% 58% / 0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 50% 100%, hsl(40 58% 52% / 0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-5 py-12 sm:py-20 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-primary/10 blur-xl" />
            <img
              src={logoIgrejaDoAmor}
              alt="Igreja do Amor"
              className="relative h-20 w-20 rounded-full object-cover ring-2 ring-border shadow-2xl brightness-0 invert"
            />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Fingerprint className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">Diretrizes de Uso</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Bem-vindo ao Atalaia
          </h1>
        </motion.div>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-sm sm:text-base text-center max-w-sm mb-10 text-muted-foreground leading-relaxed"
        >
          Antes de prosseguir, leia e aceite as diretrizes de uso do sistema pastoral.
        </motion.p>

        {/* Card */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full rounded-2xl p-6 sm:p-8 space-y-5 premium-surface border border-border"
        >
          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              custom={4 + i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex gap-4"
            >
              <div className="shrink-0 mt-0.5 h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </motion.div>
          ))}

          {/* CTA */}
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full h-12 text-base font-semibold tracking-wide mt-3"
            >
              {isAccepting && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              Entendi e quero continuar
            </Button>
          </motion.div>
        </motion.div>

        {/* Verse */}
        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 text-center space-y-0.5"
        >
          <p className="text-xs italic text-gold/50 font-display">
            "Tudo seja feito com amor."
          </p>
          <p className="text-[10px] text-muted-foreground/40">
            1 Coríntios 16:14
          </p>
        </motion.div>

        {/* Policy version */}
        <motion.p
          custom={9}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-4 text-[10px] text-muted-foreground/25"
        >
          Versão da política: {POLICY_VERSION}
        </motion.p>
      </div>
    </div>
  );
}
