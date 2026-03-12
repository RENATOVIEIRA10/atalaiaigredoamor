import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, ImageIcon, ArrowRight, Copy, RotateCcw, Loader2, Info } from 'lucide-react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsPWA } from '@/hooks/useIsPWA';
import { cn } from '@/lib/utils';

interface WhatsAppShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: {
    celula_name: string;
    lider1_name: string;
    lider2_name: string;
    meeting_day: string;
    meeting_time: string;
    address: string;
    bairro: string;
    cidade: string;
    instagram_lider1: string;
    instagram_lider2: string;
    instagram_celula: string;
    meeting_date: string;
    members_present: number;
    visitors: number;
    children: number;
    leaders_in_training: number;
    discipleships: number;
    mensagem: string;
    paixao: string;
    cultura: string;
    photo_url?: string | null;
  };
}

function buildBloco2(data: WhatsAppShareDialogProps['reportData']): string {
  const lines: string[] = [];
  lines.push(`*Célula ${data.celula_name}* ❤️`);
  lines.push(`Líderes: ${data.lider1_name} e ${data.lider2_name}`);
  if (data.meeting_day || data.meeting_time) {
    lines.push([data.meeting_day ? `Toda ${data.meeting_day}` : '', data.meeting_time ? `às ${data.meeting_time}` : ''].filter(Boolean).join(' '));
  }
  if (data.address) lines.push(`End.: ${data.address}`);
  if (data.bairro || data.cidade) lines.push([data.bairro, data.cidade].filter(Boolean).join(' - '));

  const instas = [data.instagram_lider1, data.instagram_lider2, data.instagram_celula].filter(Boolean);
  if (instas.length > 0) {
    lines.push('');
    lines.push('Instagram:');
    instas.forEach(ig => lines.push((ig ?? '').startsWith('@') ? ig! : `@${ig}`));
  }
  return lines.join('\n');
}

function buildBloco3(data: WhatsAppShareDialogProps['reportData']): string {
  const dateFormatted = data.meeting_date
    ? format(new Date(data.meeting_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
    : '';
  const lines: string[] = [];
  lines.push(`*Célula ${data.celula_name}*`);
  lines.push(`(${dateFormatted})`);
  lines.push('');
  lines.push(`▪️Membros: ${data.members_present}`);
  lines.push(`▪️Visitantes: ${data.visitors}`);
  lines.push(`▪️Crianças: ${data.children}`);
  lines.push(`▪️Líder em treinamento: ${data.leaders_in_training}`);
  lines.push(`▪️Discipulados: ${data.discipleships}`);
  lines.push('');
  lines.push(`📖 NOSSA MENSAGEM: *JESUS*`);
  lines.push(`❤️ NOSSA PAIXÃO: *PESSOAS*`);
  lines.push(`🫶🏾 NOSSA CULTURA: *AMOR*`);
  return lines.join('\n');
}

type WizardStep = 'idle' | 'photo' | 'bloco2' | 'bloco3' | 'done';

const STORAGE_KEY = 'wa-share-progress';

function saveProgress(celulaName: string, step: WizardStep) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ celula: celulaName, step, ts: Date.now() }));
  } catch {}
}

function loadProgress(celulaName: string): WizardStep | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.celula === celulaName && Date.now() - data.ts < 30 * 60 * 1000) {
      return data.step as WizardStep;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return null;
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/* ═══ BLOCO CARD ═══ */
function BlocoCard({ numero, titulo, descricao, isSent, isActive, onCopy, children }: {
  numero: number;
  titulo: string;
  descricao: string;
  isSent: boolean;
  isActive: boolean;
  onCopy?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden border-[1.5px] transition-all duration-300',
        'bg-foreground/[0.06]',
        isActive && 'border-wa/30 shadow-[0_0_0_3px_hsl(var(--wa)/0.12)]',
        isSent && 'border-vida/30 bg-vida/[0.06]',
        !isActive && !isSent && 'border-foreground/[0.07]'
      )}
      style={{
        opacity: !isActive && !isSent ? 0.45 : 1,
        animation: (isActive || isSent) ? 'block-in 0.4s ease both' : undefined,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.05]">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] transition-all',
              isSent && 'bg-vida/10 border-vida/30',
              isActive && !isSent && 'bg-wa/10 border-wa/30',
              !isActive && !isSent && 'bg-foreground/[0.06] border-foreground/10'
            )}
            style={{ width: 26, height: 26 }}
          >
            {isSent ? (
              <Check className="h-3 w-3 text-vida" />
            ) : (
              <span className={cn(
                'font-mono text-[9px] font-bold',
                isActive ? 'text-wa' : 'text-muted-foreground'
              )}>{numero}</span>
            )}
          </div>
          <div>
            <p className={cn(
              'text-[13px] font-medium transition-colors',
              isSent && 'text-vida',
              isActive && !isSent && 'text-foreground',
              !isActive && !isSent && 'text-muted-foreground'
            )}>{titulo}</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">{descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCopy && (
            <button onClick={onCopy} className="h-7 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-foreground/5">
              <Copy className="h-3 w-3" /> Copiar
            </button>
          )}
          {isSent && (
            <span className="px-2.5 py-1 rounded-full bg-vida/10 border border-vida/30 font-mono text-[8.5px] tracking-wider text-vida animate-fade-in">
              ENVIADO
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ═══ WA BUTTON ═══ */
function WaButton({ onClick, isBusy, isSent, children, className, disabled }: {
  onClick: () => void;
  isBusy: boolean;
  isSent: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={!isSent && !disabled ? onClick : undefined}
      disabled={isBusy || disabled}
      className={cn(
        'w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-[14px] font-semibold text-sm transition-all duration-200',
        isSent
          ? 'bg-wa/10 border-[1.5px] border-wa/30 text-wa cursor-default'
          : 'text-white hover:-translate-y-0.5 active:scale-[0.97]',
        !isSent && !isBusy && !disabled && 'animate-[wa-pulse_2s_ease-in-out_infinite]',
        disabled && !isSent && 'opacity-35 cursor-not-allowed',
        className
      )}
      style={!isSent ? {
        background: 'linear-gradient(135deg, hsl(var(--wa)), hsl(142 69% 42%))',
      } : undefined}
    >
      {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
      {isSent && <Check className="h-4 w-4" />}
      {!isBusy && !isSent && <MessageSquare className="h-[18px] w-[18px]" />}
      {children}
    </button>
  );
}

/* ═══ MAIN DIALOG ═══ */
export function WhatsAppShareDialog({ open, onOpenChange, reportData }: WhatsAppShareDialogProps) {
  const { toast } = useToast();
  const isPWA = useIsPWA();
  const [step, setStep] = useState<WizardStep>('idle');
  const [confirmPrompt, setConfirmPrompt] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [busyBtn, setBusyBtn] = useState<string | null>(null);
  const busyRef = useRef(false);

  const photoBlobRef = useRef<{ url: string; file: File } | null>(null);
  const [photoReady, setPhotoReady] = useState(false);

  const hasPhoto = !!reportData.photo_url;

  const bloco2 = useMemo(() => buildBloco2(reportData), [reportData]);
  const bloco3 = useMemo(() => buildBloco3(reportData), [reportData]);

  const confetti = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    x: 8 + i * 6.4,
    delay: i * 0.06,
    color: ['hsl(var(--primary))', 'hsl(var(--vida))', 'hsl(var(--foreground))', 'hsl(var(--wa))'][i % 4],
    size: 4 + (i % 3) * 2,
  })), []);

  // Pre-fetch photo when dialog opens
  useEffect(() => {
    if (!open || !reportData.photo_url) {
      photoBlobRef.current = null;
      setPhotoReady(false);
      return;
    }
    let cancelled = false;
    fetch(reportData.photo_url)
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return;
        const file = new File([blob], `celula-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        photoBlobRef.current = { url: URL.createObjectURL(blob), file };
        setPhotoReady(true);
      })
      .catch(() => { if (!cancelled) setPhotoReady(false); });
    return () => { cancelled = true; };
  }, [open, reportData.photo_url]);

  // Check for saved progress on open
  useEffect(() => {
    if (open && step === 'idle') {
      const saved = loadProgress(reportData.celula_name);
      if (saved && saved !== 'idle' && saved !== 'done') {
        setResumePrompt(true);
      }
    }
  }, [open, reportData.celula_name]);

  const advanceTo = useCallback((nextStep: WizardStep) => {
    setStep(nextStep);
    if (nextStep !== 'done') {
      saveProgress(reportData.celula_name, nextStep);
    } else {
      clearProgress();
    }
  }, [reportData.celula_name]);

  const firstStep: WizardStep = hasPhoto ? 'photo' : 'bloco2';

  const startFlow = () => {
    setResumePrompt(false);
    advanceTo(firstStep);
  };

  const resumeFlow = () => {
    const saved = loadProgress(reportData.celula_name);
    setResumePrompt(false);
    if (saved) setStep(saved);
  };

  const resetFlow = () => {
    setStep('idle');
    clearProgress();
    setResumePrompt(false);
    setConfirmPrompt(false);
    setBusyBtn(null);
  };

  const shareTextNative = useCallback(async (text: string, btnId: string, nextStep: WizardStep) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyBtn(btnId);

    try {
      if (navigator.share) {
        await navigator.share({ text });
        advanceTo(nextStep);
      } else {
        await navigator.clipboard.writeText(text).catch(() => {});
        toast({ title: 'Texto copiado!', description: 'Cole no WhatsApp manualmente.' });
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const url = `https://wa.me/?text=${encodeURIComponent(normalized)}`;
        if (isPWA) {
          window.location.href = url;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        setTimeout(() => {
          if (isPWA) {
            setConfirmPrompt(true);
          } else {
            advanceTo(nextStep);
          }
        }, 800);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // User cancelled share sheet — stay
      } else {
        toast({ title: 'Erro ao compartilhar', variant: 'destructive' });
      }
    } finally {
      busyRef.current = false;
      setBusyBtn(null);
    }
  }, [isPWA, advanceTo, toast]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Texto copiado!' });
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const confirmSent = (nextStep: WizardStep) => {
    setConfirmPrompt(false);
    advanceTo(nextStep);
  };

  const confirmRetry = () => {
    setConfirmPrompt(false);
  };

  const handleSharePhoto = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyBtn('photo');

    try {
      let file: File;
      if (photoBlobRef.current) {
        file = photoBlobRef.current.file;
      } else {
        const response = await fetch(reportData.photo_url!);
        const blob = await response.blob();
        file = new File([blob], `celula-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      }

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = photoBlobRef.current?.url || URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (!photoBlobRef.current) URL.revokeObjectURL(url);
        toast({ title: 'Foto salva!', description: 'Envie a foto manualmente no grupo do WhatsApp.' });
      }
    } catch {
      toast({ title: 'Não foi possível compartilhar a foto', description: 'Envie manualmente.', variant: 'default' });
    }

    setTimeout(() => {
      busyRef.current = false;
      setBusyBtn(null);
    }, 800);
  }, [reportData.photo_url, toast]);

  const stepIndex = { idle: -1, photo: 0, bloco2: 1, bloco3: 2, done: 3 };
  const currentIdx = stepIndex[step];
  const progressPercent = step === 'idle' ? 0 : step === 'photo' ? 15 : step === 'bloco2' ? 45 : step === 'bloco3' ? 75 : 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && step !== 'done') saveProgress(reportData.celula_name, step); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Enviar pelo WhatsApp</DialogTitle>
          <DialogDescription>Relatório pronto para envio.</DialogDescription>
        </DialogHeader>

        {/* Success header */}
        <div className="px-6 pt-6 pb-3 text-center">
          <div
            className="mx-auto mb-3 h-14 w-14 rounded-full bg-vida/10 border-2 border-vida/30 flex items-center justify-center"
            style={{
              boxShadow: '0 0 28px hsl(var(--vida) / 0.15)',
              animation: step !== 'idle' ? 'pop 0.5s cubic-bezier(0.16,1,0.3,1) both' : undefined,
            }}
          >
            <Check className="h-6 w-6 text-vida" />
          </div>
          <h2 className="font-editorial italic font-light text-2xl text-foreground tracking-tight mb-1">
            {step === 'done' ? 'Envio concluído!' : 'Relatório registrado'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {step === 'done' ? 'Deus abençoe! 🙏' : 'Envie os 3 blocos no grupo da coordenação'}
          </p>
        </div>

        <div className="px-5 pb-5 space-y-3 relative overflow-hidden">
          {/* Progress bar */}
          {step !== 'idle' && step !== 'done' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="mono-label text-muted-foreground">ENVIO</span>
                <span className="font-editorial text-lg font-light" style={{
                  color: progressPercent === 100 ? 'hsl(var(--vida))' : 'hsl(var(--primary))',
                }}>{progressPercent}%</span>
              </div>
              <div className="h-[3px] bg-foreground/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${progressPercent}%`,
                  background: progressPercent === 100
                    ? 'linear-gradient(90deg, hsl(var(--vida) / 0.7), hsl(var(--vida)))'
                    : 'linear-gradient(90deg, hsl(var(--primary) / 0.7), hsl(var(--primary)))',
                }} />
              </div>
            </div>
          )}

          {/* Resume prompt */}
          {resumePrompt && step === 'idle' && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
              <p className="text-sm font-medium">Deseja continuar o envio de onde parou?</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={resumeFlow}>Sim, continuar</Button>
                <Button size="sm" variant="outline" onClick={startFlow}>Recomeçar</Button>
              </div>
            </div>
          )}

          {/* Instruction tip */}
          {step !== 'idle' && step !== 'done' && !confirmPrompt && (
            <div className="flex gap-2.5 items-start p-3 rounded-xl bg-wa/[0.06] border border-wa/[0.15]">
              <Info className="h-3.5 w-3.5 text-wa mt-0.5 flex-shrink-0" />
              <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                Envie <strong className="text-foreground">bloco por bloco</strong>, na ordem. Cada botão abre o WhatsApp com o conteúdo pronto.
              </p>
            </div>
          )}

          {/* Confirm prompt */}
          {confirmPrompt && (
            <div className="rounded-xl border border-wa/30 bg-wa/[0.06] p-4 space-y-3">
              <p className="text-sm font-medium">Você conseguiu enviar no WhatsApp?</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-wa hover:bg-wa/90 text-white" onClick={() => {
                  const nextMap: Record<WizardStep, WizardStep> = { photo: 'bloco2', bloco2: 'bloco3', bloco3: 'done', idle: 'idle', done: 'done' };
                  confirmSent(nextMap[step]);
                }}>
                  <Check className="h-4 w-4 mr-1" /> Sim, enviado
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={confirmRetry}>
                  Não, tentar de novo
                </Button>
              </div>
            </div>
          )}

          {/* ── BLOCO 1: FOTO ── */}
          <BlocoCard
            numero={1}
            titulo="Foto da célula"
            descricao={hasPhoto ? 'Compartilhe a foto do encontro.' : 'Sem foto — pulado automaticamente.'}
            isSent={currentIdx > 0}
            isActive={step === 'photo'}
          >
            {hasPhoto ? (
              <>
                <img src={reportData.photo_url!} alt="Foto da célula" className="w-full h-28 object-cover" />
                {step === 'photo' && !confirmPrompt && (
                  <div className="p-3.5 space-y-2">
                    <WaButton onClick={handleSharePhoto} isBusy={busyBtn === 'photo'} isSent={false}>
                      {busyBtn === 'photo' ? 'Abrindo…' : 'Compartilhar foto'}
                    </WaButton>
                    <button className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center justify-center gap-1" onClick={() => advanceTo('bloco2')}>
                      Já enviei a foto <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2.5 text-muted-foreground text-sm py-3 px-4">
                <ImageIcon className="h-4 w-4" />
                <span>Sem foto — pulado automaticamente</span>
              </div>
            )}
          </BlocoCard>

          {/* ── BLOCO 2: INFO CÉLULA ── */}
          <BlocoCard
            numero={2}
            titulo="Informações da célula"
            descricao="Dados fixos puxados do sistema."
            isSent={currentIdx > 1}
            isActive={step === 'bloco2'}
            onCopy={step === 'bloco2' ? () => copyToClipboard(bloco2) : undefined}
          >
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed px-4 py-2.5 max-h-24 overflow-y-auto text-foreground/80">{bloco2}</pre>
            {step === 'bloco2' && !confirmPrompt && (
              <div className="p-3.5 space-y-2">
                <WaButton onClick={() => shareTextNative(bloco2, 'bloco2', 'bloco3')} isBusy={busyBtn === 'bloco2'} isSent={false}>
                  {busyBtn === 'bloco2' ? 'Abrindo WhatsApp…' : 'Enviar Bloco 2'}
                </WaButton>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center justify-center gap-1" onClick={() => advanceTo('bloco3')}>
                  Já enviei o Bloco 2 <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </BlocoCard>

          {/* ── BLOCO 3: RELATÓRIO ── */}
          <BlocoCard
            numero={3}
            titulo="Relatório semanal"
            descricao="Números + mensagens de cultura."
            isSent={currentIdx > 2}
            isActive={step === 'bloco3'}
            onCopy={step === 'bloco3' ? () => copyToClipboard(bloco3) : undefined}
          >
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed px-4 py-2.5 max-h-24 overflow-y-auto text-foreground/80">{bloco3}</pre>
            {step === 'bloco3' && !confirmPrompt && (
              <div className="p-3.5 space-y-2">
                <WaButton onClick={() => shareTextNative(bloco3, 'bloco3', 'done')} isBusy={busyBtn === 'bloco3'} isSent={false}>
                  {busyBtn === 'bloco3' ? 'Abrindo WhatsApp…' : 'Enviar Bloco 3'}
                </WaButton>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center justify-center gap-1" onClick={() => advanceTo('done')}>
                  Já enviei o Bloco 3 <Check className="h-3 w-3" />
                </button>
              </div>
            )}
          </BlocoCard>

          {/* ── START BUTTON ── */}
          {step === 'idle' && !resumePrompt && (
            <WaButton onClick={startFlow} isBusy={false} isSent={false} className="text-base py-5">
              Enviar no WhatsApp
            </WaButton>
          )}

          {/* ── DONE STATE ── */}
          {step === 'done' && (
            <div className="space-y-3 relative" style={{ animation: 'success-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
              {confetti.map((c, i) => (
                <div key={i} className="absolute pointer-events-none" style={{
                  top: -20,
                  left: `${c.x}%`,
                  width: c.size,
                  height: c.size,
                  borderRadius: c.size > 5 ? '50%' : 2,
                  background: c.color,
                  animation: `confetti 1.4s ease-out ${c.delay}s both`,
                }} />
              ))}
              <p className="text-center font-editorial italic text-lg text-vida pt-2">
                Os 3 blocos foram enviados ✓
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetFlow}>
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Reenviar
                </Button>
                <Button className="flex-1" onClick={() => { resetFlow(); onOpenChange(false); }}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
