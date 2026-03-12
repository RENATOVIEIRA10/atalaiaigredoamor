import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingVisual } from './OnboardingVisuals';
import { OnboardingIcon } from './OnboardingIcon';
import type { OnboardingRoleConfig } from './onboardingRoles';

interface Props {
  role: OnboardingRoleConfig;
  accentVar: string; // e.g. "var(--gold)"
  onEnter: () => void;
  isAccepting: boolean;
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.96,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
    scale: 0.96,
  }),
};

export function OnboardingSlides({ role, accentVar, onEnter, isAccepting }: Props) {
  const [slide, setSlide] = useState(-1); // -1 = welcome
  const [dir, setDir] = useState(1);

  const totalSlides = role.slides.length;
  const isWelcome = slide === -1;
  const isLast = slide === totalSlides - 1;
  const accentColor = accentVar; // CSS custom property value

  const goNext = () => { setDir(1); setSlide(s => Math.min(s + 1, totalSlides - 1)); };
  const goPrev = () => { setDir(-1); setSlide(s => Math.max(s - 1, -1)); };

  return (
    <div className="animate-[scale-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both]">
      <AnimatePresence mode="wait" custom={dir}>
        {isWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center relative"
          >
            {/* Ambient glow */}
            <div
              className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full pointer-events-none animate-[breathe-vis_4s_ease-in-out_infinite]"
              style={{ background: `radial-gradient(circle, hsl(${accentColor} / 0.12) 0%, transparent 65%)` }}
            />

            {/* Role icon with rings */}
            <div className="relative inline-flex mb-6">
              {[80, 100, 120].map((r, i) => (
                <div key={r} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: r, height: r,
                    border: `1px solid hsl(${accentColor})`,
                    opacity: 0.06 + i * 0.04,
                    animation: `breathe-vis ${3 + i}s ease-in-out infinite ${i * 0.5}s`,
                  }}
                />
              ))}
              <div
                className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center animate-[logo-in_0.7s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]"
                style={{
                  background: `linear-gradient(135deg, hsl(${accentColor} / 0.2), hsl(${accentColor} / 0.08))`,
                  border: `2px solid hsl(${accentColor} / 0.35)`,
                  boxShadow: `0 0 40px hsl(${accentColor} / 0.15)`,
                }}
              >
                <OnboardingIcon name={role.icon} size={28} style={{ color: `hsl(${accentColor})` }} />
              </div>
            </div>

            {/* Code + label */}
            <div
              className="font-mono text-[9.5px] tracking-[0.14em] mb-3 animate-[fade-in-up_0.5s_ease_0.2s_both]"
              style={{ color: `hsl(${accentColor})` }}
            >
              {role.code} · {role.label.toUpperCase()}
            </div>

            {/* Greeting */}
            <h2 className="font-editorial font-light italic text-[30px] text-foreground tracking-tight leading-tight mb-5 animate-[fade-in-up_0.5s_ease_0.3s_both]">
              {role.greeting}
            </h2>

            {/* Verse */}
            <div
              className="px-5 py-4 rounded-[14px] mb-7 animate-[verse-in_0.6s_ease_0.4s_both]"
              style={{
                background: `hsl(${accentColor} / 0.05)`,
                border: `1px solid hsl(${accentColor} / 0.22)`,
              }}
            >
              <p className="font-editorial italic font-light text-[15px] text-foreground leading-relaxed mb-1.5">
                &ldquo;{role.verse}&rdquo;
              </p>
              <span className="font-mono text-[9.5px] tracking-[0.1em]"
                style={{ color: `hsl(${accentColor})` }}>
                {role.verseRef}
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={goNext}
              className="w-full py-[15px] rounded-[14px] border-none text-sm font-semibold tracking-wide cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] animate-[fade-in-up_0.5s_ease_0.5s_both]"
              style={{
                background: `linear-gradient(135deg, hsl(${accentColor}), hsl(${accentColor} / 0.8))`,
                color: 'hsl(var(--background))',
                boxShadow: `0 8px 32px hsl(${accentColor} / 0.2)`,
              }}
            >
              Conhecer o sistema →
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`slide-${slide}`}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Dot navigation */}
            <div className="flex gap-1.5 justify-center mb-7">
              {role.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDir(i > slide ? 1 : -1); setSlide(i); }}
                  className="h-[7px] rounded-full cursor-pointer transition-all duration-300 border-none"
                  style={{
                    width: i === slide ? 24 : 7,
                    background: i === slide
                      ? `hsl(${accentColor})`
                      : `hsl(${accentColor} / 0.2)`,
                    animation: i === slide ? 'dot-pulse 2s ease-in-out infinite' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Visual container */}
            <div
              className="rounded-[18px] mb-6 overflow-hidden relative"
              style={{
                background: `hsl(${accentColor} / 0.04)`,
                border: `1px solid hsl(${accentColor} / 0.22)`,
              }}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, hsl(${accentColor} / 0.1) 0%, transparent 65%)` }}
              />
              <OnboardingVisual
                type={role.slides[slide].visual}
                accentColor={accentColor}
              />
            </div>

            {/* Text */}
            <div className="text-center mb-7">
              <div className="font-mono text-[9px] tracking-[0.14em] mb-2.5"
                style={{ color: `hsl(${accentColor})` }}>
                {String(slide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
              </div>
              <h3 className="font-editorial font-light text-2xl text-foreground tracking-tight leading-tight mb-3">
                {role.slides[slide].title}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
                {role.slides[slide].body}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2.5 items-center">
              <button
                onClick={goPrev}
                className="bg-transparent border-none font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground cursor-pointer uppercase p-2 hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>

              <div className="flex-1">
                {isLast ? (
                  <button
                    onClick={onEnter}
                    disabled={isAccepting}
                    className="w-full py-[15px] rounded-[14px] border-none text-sm font-semibold tracking-wide cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: `linear-gradient(135deg, hsl(${accentColor}), hsl(${accentColor} / 0.8))`,
                      color: 'hsl(var(--background))',
                      boxShadow: `0 8px 32px hsl(${accentColor} / 0.22)`,
                    }}
                  >
                    {isAccepting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Entrando...
                      </span>
                    ) : (
                      'Entrar no Atalaia →'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="w-full py-[15px] rounded-[14px] text-sm font-semibold tracking-wide cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, hsl(${accentColor} / 0.15), hsl(${accentColor} / 0.08))`,
                      border: `1.5px solid hsl(${accentColor} / 0.28)`,
                      color: `hsl(${accentColor})`,
                    }}
                  >
                    Próximo →
                  </button>
                )}
              </div>

              {!isLast && (
                <button
                  onClick={onEnter}
                  className="bg-transparent border-none font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground cursor-pointer uppercase p-2 hover:text-foreground transition-colors"
                >
                  Pular
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
