import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Baby, BookOpen, GraduationCap, Send, Info, Image, Check, Minus, Plus, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { CelulaPhotoUpload } from './CelulaPhotoUpload';
import { getWeekStartFromDate } from '@/hooks/useWeeklyReports';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface ReportFormData {
  meetingDate: string;
  membersPresent: number;
  leadersInTraining: number;
  discipleships: number;
  visitors: number;
  children: number;
  notes: string;
  photoUrl: string | null;
}

interface ReportFormWizardProps {
  celulaId: string;
  celulaName: string;
  celulaData: any;
  onSubmit: (data: ReportFormData) => Promise<void>;
  isSubmitting: boolean;
}

const STEPS = ['Foto', 'Presença', 'Estrutura', 'Revisão'];

const CULTURA = [
  { icon: '🖤', label: 'NOSSA MENSAGEM', valor: 'JESUS' },
  { icon: '🖤', label: 'NOSSA PAIXÃO', valor: 'PESSOAS' },
  { icon: '🖤', label: 'NOSSA CULTURA', valor: 'AMOR' },
];

/* ═══ NUMERIC STEPPER ═══ */
function NumericStepper({ value, onChange, label, icon: Icon, variant = 'gold', note }: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  icon: React.ElementType;
  variant?: 'gold' | 'vida' | 'blue';
  note?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const variants = {
    gold: { border: 'border-primary/30', bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', ring: 'ring-primary/10', cssVar: 'primary' },
    vida: { border: 'border-vida/30', bg: 'bg-vida/10', text: 'text-vida', dot: 'bg-vida', ring: 'ring-vida/10', cssVar: 'vida' },
    blue: { border: 'border-blue-soft/30', bg: 'bg-blue-soft/10', text: 'text-blue-soft', dot: 'bg-blue-soft', ring: 'ring-blue-soft/10', cssVar: 'blue-soft' },
  };
  const v = variants[variant];
  const isValid = value > 0;

  const trigger = (next: number) => {
    if (next < 0) { setShaking(true); setTimeout(() => setShaking(false), 400); return; }
    if (next > 999) return;
    onChange(next);
    setPopKey(k => k + 1);
  };

  return (
    <div>
      <div className="mono-label text-muted-foreground flex items-center gap-1.5 mb-2">
        <span className={cn('h-1.5 w-1.5 rounded-full transition-colors duration-300', isValid ? v.dot : 'bg-muted-foreground/40')} />
        <Icon className={cn('h-3 w-3 transition-colors duration-300', isValid ? v.text : 'text-muted-foreground/40')} />
        {label}
      </div>
      <div className={cn(
        'relative flex items-center rounded-[14px] border-[1.5px] overflow-hidden transition-all duration-200',
        'bg-foreground/[0.06] border-foreground/[0.08]',
        focused && `${v.border} ${v.bg} ring-[3px] ${v.ring}`,
        isValid && !focused && `${v.border} ${v.bg}`,
        shaking && 'animate-[shake_0.38s_cubic-bezier(0.36,0.07,0.19,0.97)]'
      )}>
        <button
          type="button"
          className="w-11 h-[52px] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-90 flex-shrink-0"
          onClick={() => trigger(value - 1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 flex justify-center relative">
          <input
            type="number" min={0} max={999} value={value}
            onChange={e => trigger(Math.max(0, parseInt(e.target.value) || 0))}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className={cn(
              'w-[60px] text-center font-editorial font-light text-[32px] leading-none',
              'bg-transparent border-none outline-none caret-primary',
              '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              isValid ? v.text : 'text-foreground'
            )}
            style={popKey > 0 ? { animation: 'num-bounce 0.35s cubic-bezier(0.16,1,0.3,1)' } : undefined}
          />
          {popKey > 0 && (
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full pointer-events-none"
              style={{
                border: `2px solid hsl(var(--${v.cssVar}))`,
                animation: 'ring-expand 0.5s ease-out forwards',
              }}
            />
          )}
        </div>
        <button
          type="button"
          className="w-11 h-[52px] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-90 flex-shrink-0"
          onClick={() => trigger(value + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {note && <p className="text-[10.5px] text-muted-foreground font-mono tracking-wide mt-1.5">{note}</p>}
    </div>
  );
}

/* ═══ STEP DOT ═══ */
function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      'h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center border-[1.5px] transition-all duration-300',
      done && 'bg-vida border-vida/30',
      active && !done && 'bg-primary border-primary/30',
      !active && !done && 'bg-foreground/[0.06] border-foreground/10'
    )} style={{
      boxShadow: done ? '0 0 12px hsl(var(--vida) / 0.2)' : active ? '0 0 16px hsl(var(--primary) / 0.25)' : 'none',
    }}>
      {done ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20,6 9,17 4,12" strokeDasharray="30" strokeDashoffset="0"
            style={{ animation: 'check-draw 0.3s ease forwards' }} />
        </svg>
      ) : (
        <span className={cn(
          'font-mono text-[10px] font-semibold',
          active ? 'text-primary-foreground' : 'text-muted-foreground'
        )}>{n}</span>
      )}
    </div>
  );
}

/* ═══ REPORT FORM WIZARD ═══ */
export function ReportFormWizard({ celulaId, celulaName, celulaData, onSubmit, isSubmitting }: ReportFormWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [meetingDate, setMeetingDate] = useState('');
  const [membersPresent, setMembersPresent] = useState(0);
  const [leadersInTraining, setLeadersInTraining] = useState(0);
  const [discipleships, setDiscipleships] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const completude = [!!photoUrl, membersPresent > 0, discipleships > 0 || leadersInTraining > 0, notes.length > 0].filter(Boolean).length;
  const pct = Math.round((completude / 4) * 100);
  const canNext = [true, membersPresent > 0, true, true][step];

  const cel = celulaData as any;
  const lideres = cel?.leadership_couple
    ? [cel.leadership_couple.spouse1?.name, cel.leadership_couple.spouse2?.name].filter(Boolean).join(' & ')
    : '';

  const dateDisplay = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const handleSubmit = async () => {
    if (!meetingDate) {
      toast({ title: 'Informe a data da reunião', variant: 'destructive' });
      return;
    }
    try {
      await onSubmit({ meetingDate, membersPresent, leadersInTraining, discipleships, visitors, children, notes, photoUrl });
      setStep(0);
      setMeetingDate('');
      setMembersPresent(0);
      setLeadersInTraining(0);
      setDiscipleships(0);
      setVisitors(0);
      setChildren(0);
      setNotes('');
      setPhotoUrl(null);
    } catch {
      toast({ title: 'Erro ao enviar relatório', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-0">
      {/* Step navigation */}
      <div className="pb-4 border-b border-border/30">
        <div className="flex items-center">
          {STEPS.map((label, i) => (
            <div key={i} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5">
                <StepDot n={i + 1} active={step === i} done={step > i} />
                <span className={cn(
                  'font-mono text-[8.5px] tracking-wider whitespace-nowrap transition-colors',
                  step === i && 'text-primary',
                  step > i && 'text-vida',
                  step < i && 'text-muted-foreground'
                )}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-[1.5px] mx-1.5 mb-5 rounded-full transition-all duration-500',
                  step > i ? 'bg-gradient-to-r from-vida to-vida/70' : 'bg-foreground/[0.07]'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-5">
        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="mono-label text-muted-foreground">COMPLETUDE</span>
            <span className="font-editorial text-lg font-light" style={{
              color: pct === 100 ? 'hsl(var(--vida))' : 'hsl(var(--primary))',
            }}>{pct}%</span>
          </div>
          <div className="h-[3px] bg-foreground/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'linear-gradient(90deg, hsl(var(--vida) / 0.7), hsl(var(--vida)))'
                : 'linear-gradient(90deg, hsl(var(--primary) / 0.7), hsl(var(--primary)))',
            }} />
          </div>
        </div>

        {/* STEP 0: Foto */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-start">
                <div>
                  <span className="mono-label text-primary mb-1 block">CÉLULA</span>
                  <h3 className="font-editorial text-xl font-light text-foreground">{celulaName}</h3>
                  {lideres && <p className="text-xs text-muted-foreground mt-1">{lideres}</p>}
                </div>
                <div className="text-right">
                  <span className="mono-label text-muted-foreground mb-1 block">SEMANA</span>
                  <p className="text-[11.5px] text-foreground max-w-[130px] text-right leading-snug">{dateDisplay}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="mono-label text-muted-foreground">DATA DA REUNIÃO *</Label>
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="h-12 text-base" />
            </div>

            <CelulaPhotoUpload
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              celulaId={celulaId}
              weekStart={meetingDate ? getWeekStartFromDate(meetingDate) : ''}
            />

            {!photoUrl && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/[0.06] border border-primary/10">
                <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  A foto será o Bloco 1 do envio ao supervisor. Ela ficará no histórico permanente da célula.
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Presença */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="font-editorial text-xl font-light text-foreground mb-1">Quantas pessoas estiveram presentes?</h3>
              <p className="text-xs text-muted-foreground">Cada número representa uma vida.</p>
            </div>
            <div className="space-y-4">
              <NumericStepper value={membersPresent} onChange={setMembersPresent}
                label="Membros presentes" icon={Users} variant="gold" note="Inclui os líderes" />
              <NumericStepper value={visitors} onChange={setVisitors}
                label="Visitantes" icon={Users} variant="vida" note="Pessoas que vieram pela primeira vez" />
              <NumericStepper value={children} onChange={setChildren}
                label="Crianças" icon={Baby} variant="blue" note="Menores de 12 anos" />
            </div>
            {(membersPresent + visitors + children) > 0 && (
              <div className="p-3.5 rounded-xl bg-vida/10 border border-vida/30 flex items-center justify-between animate-fade-in">
                <span className="mono-label text-vida">TOTAL DO ENCONTRO</span>
                <span className="font-editorial text-[28px] font-light text-vida">{membersPresent + visitors + children}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Estrutura */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="font-editorial text-xl font-light text-foreground mb-1">Estrutura da célula</h3>
              <p className="text-xs text-muted-foreground">Dados que refletem o estado atual da célula.</p>
            </div>
            <div className="space-y-4">
              <NumericStepper value={discipleships} onChange={setDiscipleships}
                label="Membros em discipulado" icon={BookOpen} variant="gold"
                note="Quantos membros da célula estão sendo discipulados" />
              <NumericStepper value={leadersInTraining} onChange={setLeadersInTraining}
                label="Líderes em treinamento" icon={GraduationCap} variant="blue"
                note="Membros em formação para liderança" />
            </div>
          </div>
        )}

        {/* STEP 3: Revisão */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="font-editorial text-xl font-light text-foreground mb-1">Algo a registrar para o supervisor?</h3>
              <p className="text-xs text-muted-foreground">Opcional — mas um registro vivo ajuda quem cuida de você.</p>
            </div>

            <div>
              <div className="mono-label text-muted-foreground flex items-center gap-1.5 mb-2">
                <Send className="h-3 w-3" /> OBSERVAÇÕES
              </div>
              <Textarea
                className="min-h-20 text-sm"
                placeholder="Como foi o encontro? Há alguma vida que precisa de atenção especial?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <p className="text-right font-mono text-[9px] text-muted-foreground mt-1">{notes.length} caracteres</p>
            </div>

            {/* Preview dos 3 blocos */}
            <div className="rounded-[14px] border border-border overflow-hidden bg-foreground/[0.06]">
              <div className="px-3.5 py-2.5 border-b border-border/50 mono-label text-primary">
                PRÉVIA — 3 BLOCOS WHATSAPP
              </div>

              {/* B1 */}
              <div className="px-3.5 py-3 border-b border-border/30">
                <span className="mono-label text-muted-foreground text-[8.5px] block mb-1.5">BLOCO 1 · FOTO</span>
                <div className="flex items-center gap-2.5">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-primary/20" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-foreground/[0.06] border border-dashed border-foreground/10 flex items-center justify-center">
                      <Image className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className={cn('text-[11.5px]', photoUrl ? 'text-foreground' : 'text-muted-foreground')}>
                    {photoUrl ? 'Foto da célula' : 'Sem foto'}
                  </span>
                </div>
              </div>

              {/* B2 */}
              <div className="px-3.5 py-3 border-b border-border/30">
                <span className="mono-label text-muted-foreground text-[8.5px] block mb-1.5">BLOCO 2 · CÉLULA</span>
                {[
                  ['Célula', celulaName],
                  ['Líderes', lideres],
                  ['Dia', cel?.meeting_day || ''],
                  ['Horário', cel?.meeting_time || ''],
                ].filter(([, val]) => val).map(([k, val]) => (
                  <div key={k} className="flex gap-2 mb-0.5">
                    <span className="font-mono text-[9px] text-muted-foreground min-w-[50px]">{k}</span>
                    <span className="text-[11.5px] text-foreground">{val}</span>
                  </div>
                ))}
              </div>

              {/* B3 */}
              <div className="px-3.5 py-3">
                <span className="mono-label text-muted-foreground text-[8.5px] block mb-1.5">BLOCO 3 · RELATÓRIO + CULTURA</span>
                {[
                  ['Membros', membersPresent, 'text-primary'] as const,
                  ['Visitantes', visitors, 'text-vida'] as const,
                  ['Crianças', children, 'text-blue-soft'] as const,
                  ['LIT', leadersInTraining, 'text-blue-soft'] as const,
                  ['Discipulados', discipleships, 'text-primary'] as const,
                ].map(([k, val, c]) => (
                  <div key={k} className="flex justify-between mb-0.5">
                    <span className="text-[11.5px] text-muted-foreground">▪️ {k}</span>
                    <span className={cn('font-editorial text-[17px] font-light', val > 0 ? c : 'text-muted-foreground')}>
                      {String(val).padStart(2, '0')}
                    </span>
                  </div>
                ))}
                <div className="mt-2.5 pt-2 border-t border-border/30">
                  {CULTURA.map(c => (
                    <p key={c.label} className="text-[11.5px] text-muted-foreground mb-0.5">
                      {c.icon} {c.label}: <strong className="text-foreground">{c.valor}</strong>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/30">
          {step > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <Button disabled={!canNext} onClick={() => setStep(s => s + 1)} className={cn(!canNext && 'opacity-40')}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !meetingDate}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Registrar Relatório</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
