import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Eye, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const sections = [
  {
    icon: ShieldCheck,
    title: 'Cuidado com as informações',
    text: 'Usamos essas informações para cuidar, acompanhar e servir. Trate tudo com amor, zelo e responsabilidade.',
  },
  {
    icon: Eye,
    title: 'Cada um vê o que precisa ver',
    text: 'Você verá apenas as informações ligadas à sua função e ao seu escopo (célula, supervisão, coordenação ou rede).',
  },
  {
    icon: KeyRound,
    title: 'Seu acesso é pessoal',
    text: 'Seu código define seu nível de acesso. Não compartilhe seu código.',
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
      {/* Warm ambient glow at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 35% at 50% 0%, hsl(15 60% 30% / 0.25) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 50% 100%, hsl(40 58% 52% / 0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-5 py-12 sm:py-20 flex flex-col items-center">
        {/* Logo */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-gold/10 blur-xl" />
            <img
              src={logoRedeAmor}
              alt="Rede Amor a 2"
              className="relative h-20 w-20 rounded-full object-cover ring-2 ring-gold/30 shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Bem-vindo ao Sistema
            <br />
            Rede Amor a 2
          </h1>
        </motion.div>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-sm sm:text-base text-center max-w-sm mb-10 text-muted-foreground leading-relaxed"
        >
          Este sistema existe para servir o cuidado pastoral, organizar as células e apoiar as vidas que Deus confiou à liderança.
        </motion.p>

        {/* Card */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full rounded-2xl p-6 sm:p-8 space-y-6 border border-border/50 bg-card/60 backdrop-blur-md"
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
              <div className="shrink-0 mt-0.5 h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-gold" />
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
              className="w-full h-12 text-base font-semibold tracking-wide mt-2 bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              {isAccepting && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              Entendi e quero continuar
            </Button>
          </motion.div>
        </motion.div>

        {/* Verse */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 text-center space-y-0.5">
          <p className="text-xs italic text-gold/40 font-display">
            "Tudo seja feito com amor."
          </p>
          <p className="text-[10px] text-muted-foreground/40">
            1 Coríntios 16:14
          </p>
        </motion.div>

        {/* Policy version */}
        <motion.p custom={9} variants={fadeUp} initial="hidden" animate="visible" className="mt-4 text-[10px] text-muted-foreground/25">
          Versão da política: {POLICY_VERSION}
        </motion.p>
      </div>
    </div>
  );
}
