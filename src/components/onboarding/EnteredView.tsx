import { Check } from 'lucide-react';
import type { OnboardingRoleConfig } from './onboardingRoles';

interface Props {
  role: OnboardingRoleConfig;
  accentVar: string;
}

export function EnteredView({ role, accentVar }: Props) {
  const ac = accentVar;

  return (
    <div className="text-center animate-[enter-done_0.6s_cubic-bezier(0.16,1,0.3,1)_both] relative">
      {/* Ambient glow */}
      <div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none animate-[breathe-vis_3s_ease-in-out_infinite]"
        style={{ background: `radial-gradient(circle, hsl(${ac} / 0.1) 0%, transparent 65%)` }}
      />

      {/* Check icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 relative"
        style={{
          background: `hsl(${ac} / 0.12)`,
          border: `2px solid hsl(${ac} / 0.28)`,
          boxShadow: `0 0 40px hsl(${ac} / 0.2)`,
        }}
      >
        <Check size={28} strokeWidth={2.5} style={{ color: `hsl(${ac})` }} />
      </div>

      <h2 className="font-editorial font-light italic text-[28px] text-foreground tracking-tight mb-2 animate-[fade-in-up_0.5s_ease_0.15s_both]">
        Você está no Atalaia.
      </h2>
      <p className="text-[13px] text-muted-foreground animate-[fade-in-up_0.5s_ease_0.25s_both]">
        Redirecionando para o Dashboard de {role.label}...
      </p>

      {/* Progress bar */}
      <div className="mt-6 h-0.5 bg-border/30 rounded-full overflow-hidden animate-[fade-in-up_0.5s_ease_0.3s_both]">
        <div
          className="h-full rounded-full animate-[progress-anim_1.2s_cubic-bezier(0.16,1,0.3,1)_0.2s_both] w-full"
          style={{ background: `linear-gradient(90deg, hsl(${ac} / 0.5), hsl(${ac}))` }}
        />
      </div>
    </div>
  );
}
