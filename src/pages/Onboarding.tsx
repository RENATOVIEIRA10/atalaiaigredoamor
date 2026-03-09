import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { useRede } from '@/contexts/RedeContext';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';
import { roleLabels } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Eye, KeyRound, Sparkles, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── helpers ── */
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const principles = [
  {
    icon: ShieldCheck,
    title: 'Cuidado com as informações',
    text: 'Use as informações com zelo, amor e responsabilidade — elas existem para cuidar de vidas.',
  },
  {
    icon: Eye,
    title: 'Cada um vê o que precisa ver',
    text: 'Você verá apenas o que está ligado à sua função e ao seu campo de atuação.',
  },
  {
    icon: KeyRound,
    title: 'Acesso pessoal e intransferível',
    text: 'Seu código define seu nível de acesso. Não compartilhe com ninguém.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { scopeType, accessKeyId, selectedRole } = useRole();
  const { activeCampo } = useCampo();
  const { activeRede } = useRede();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [scopeNames, setScopeNames] = useState<{ rede?: string; coordenacao?: string }>({});

  const hasSession = !!scopeType && !!accessKeyId;
  const roleName = selectedRole ? (roleLabels[selectedRole] || selectedRole) : '';
  const campoName = activeCampo?.nome;

  // Resolve scope entity names
  useEffect(() => {
    if (!hasSession || !scopeType) return;
    // Only resolve for scopes that have a scopeId pointing to a coordenação or similar
    // The rede context already provides activeRede
  }, [hasSession, scopeType]);

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

  const redeName = activeRede?.name;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative overflow-y-auto bg-background">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% -5%, hsl(var(--primary) / 0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 50% 105%, hsl(var(--primary) / 0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-5 py-12 sm:py-20 flex flex-col items-center">
        {/* Spark icon */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <div className="relative h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
            Bem-vindo ao Atalaia
          </h1>
        </motion.div>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-sm sm:text-base text-center max-w-sm mb-8 text-muted-foreground leading-relaxed"
        >
          Cuidando de vidas. Fortalecendo líderes. Servindo o Reino.
        </motion.p>

        {/* Scope confirmation card */}
        {(roleName || campoName) && (
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="w-full rounded-2xl p-5 mb-6 border border-primary/20 bg-primary/5 backdrop-blur-md text-center space-y-1.5"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">
              Você está entrando como
            </p>
            <p className="text-base sm:text-lg font-semibold text-foreground">
              {roleName}
              {campoName && (
                <span className="text-muted-foreground font-normal"> — {campoName}</span>
              )}
            </p>
            {(redeName) && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {[redeName].filter(Boolean).join(' • ')}
              </p>
            )}
          </motion.div>
        )}

        {/* Mission block */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full rounded-2xl p-6 sm:p-8 mb-6 border border-border/40 bg-card/60 backdrop-blur-md text-center"
        >
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Este sistema foi preparado para apoiar seu chamado,
            <br className="hidden sm:block" />{' '}
            organizar o cuidado pastoral
            <br className="hidden sm:block" />{' '}
            e fortalecer a missão da nossa igreja.
          </p>
        </motion.div>

        {/* Principles */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full rounded-2xl p-6 sm:p-8 space-y-5 border border-border/40 bg-card/60 backdrop-blur-md"
        >
          {principles.map((s, i) => (
            <motion.div
              key={s.title}
              custom={6 + i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex gap-4"
            >
              <div className="shrink-0 mt-0.5 h-9 w-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </motion.div>
          ))}

          {/* CTA */}
          <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full h-12 text-base font-semibold tracking-wide mt-3"
            >
              {isAccepting && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              Entrar e começar a servir
            </Button>
          </motion.div>
        </motion.div>

        {/* Verse */}
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 text-center space-y-0.5">
          <p className="text-xs italic text-primary/30 font-display">
            "Tudo seja feito com amor."
          </p>
          <p className="text-[10px] text-muted-foreground/40">
            1 Coríntios 16:14
          </p>
        </motion.div>

        {/* Policy version */}
        <motion.p custom={11} variants={fadeUp} initial="hidden" animate="visible" className="mt-4 text-[10px] text-muted-foreground/25">
          Versão da política: {POLICY_VERSION}
        </motion.p>
      </div>
    </div>
  );
}
