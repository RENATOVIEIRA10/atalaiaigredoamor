import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, ImageIcon, ArrowRight, RotateCcw, Copy } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

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
    instas.forEach(ig => lines.push(ig.startsWith('@') ? ig : `@${ig}`));
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

type FlowStep = 'idle' | 'photo' | 'bloco2' | 'bloco3' | 'done';

const AUTO_ADVANCE_SECONDS = 5;

export function WhatsAppShareDialog({ open, onOpenChange, reportData }: WhatsAppShareDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep>('idle');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasPhoto = !!reportData.photo_url;
  const bloco2 = buildBloco2(reportData);
  const bloco3 = buildBloco3(reportData);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startCountdown = (onComplete: () => void) => {
    clearTimer();
    setCountdown(AUTO_ADVANCE_SECONDS);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = AUTO_ADVANCE_SECONDS - elapsed;
      if (remaining <= 0) {
        clearTimer();
        setCountdown(0);
        onComplete();
      } else {
        setCountdown(remaining);
      }
    }, 200);
  };

  const openWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Texto copiado!' });
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const goToBloco2 = useCallback(() => {
    clearTimer();
    setStep('bloco2');
    openWhatsApp(bloco2);
    startCountdown(goToBloco3Ref.current);
  }, [bloco2]);

  // Use refs to avoid stale closures in timers
  const goToBloco3Ref = useRef(() => {});
  const goToBloco3 = useCallback(() => {
    clearTimer();
    setStep('bloco3');
    openWhatsApp(bloco3);
    startCountdown(() => {
      setStep('done');
      toast({ title: '✅ Relatório enviado!', description: 'Os 3 blocos foram encaminhados no WhatsApp.' });
    });
  }, [bloco3, toast]);
  goToBloco3Ref.current = goToBloco3;

  const sharePhoto = useCallback(async () => {
    if (!reportData.photo_url) return;
    try {
      const response = await fetch(reportData.photo_url);
      const blob = await response.blob();
      const file = new File([blob], `celula-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        // After share sheet closes, auto-advance
        goToBloco2();
        return;
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Foto salva!', description: 'Envie a foto no grupo e depois toque em "Continuar".' });
    } catch {
      // User cancelled share or error — still allow advancing
      toast({ title: 'Foto não enviada', description: 'Você pode enviar depois. Continuando...', variant: 'default' });
      goToBloco2();
    }
  }, [reportData.photo_url, toast, goToBloco2]);

  const startFlow = useCallback(async () => {
    if (hasPhoto) {
      setStep('photo');
      await sharePhoto();
    } else {
      // Skip photo, go straight to bloco2
      setStep('bloco2');
      openWhatsApp(bloco2);
      startCountdown(goToBloco3Ref.current);
    }
  }, [hasPhoto, sharePhoto, bloco2]);

  const resetFlow = () => { clearTimer(); setStep('idle'); setCountdown(0); };

  const stepIndex = { idle: -1, photo: 0, bloco2: 1, bloco3: 2, done: 3 };
  const currentIdx = stepIndex[step];

  const progressPercent = step === 'idle' ? 0 : step === 'photo' ? 15 : step === 'bloco2' ? 45 : step === 'bloco3' ? 75 : 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetFlow(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar pelo WhatsApp
          </DialogTitle>
          <DialogDescription>
            Relatório pronto para encaminhar no grupo da coordenação.
          </DialogDescription>
        </DialogHeader>

        {/* Global progress bar */}
        {step !== 'idle' && (
          <div className="space-y-1.5">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {step === 'done' ? '✅ Concluído!' : `Passo ${currentIdx + 1} de 3`}
              </span>
              {countdown > 0 && step !== 'done' && (
                <span className="text-xs text-green-600 font-medium animate-pulse">
                  Próximo em {countdown}s...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Preview blocks */}
        <div className="space-y-3">
          {/* Block 1 - Photo */}
          <div className={`rounded-lg border p-3 transition-all ${currentIdx > 0 ? 'opacity-40 scale-[0.98]' : ''} ${step === 'photo' ? 'ring-2 ring-green-500/50' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <StepBadge n={1} done={currentIdx > 0} active={step === 'photo'} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Foto da Célula</span>
            </div>
            {hasPhoto ? (
              <img src={reportData.photo_url!} alt="Foto da célula" className="w-full h-28 object-cover rounded-md" />
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2 justify-center">
                <ImageIcon className="h-4 w-4" />
                <span>Sem foto — pulado automaticamente</span>
              </div>
            )}
            {step === 'photo' && !navigator.share && (
              <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={goToBloco2}>
                Foto enviada — Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Block 2 - Fixed info */}
          <div className={`rounded-lg border p-3 transition-all ${currentIdx > 1 ? 'opacity-40 scale-[0.98]' : ''} ${step === 'bloco2' ? 'ring-2 ring-green-500/50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StepBadge n={2} done={currentIdx > 1} active={step === 'bloco2'} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informações da Célula</span>
              </div>
              {step === 'bloco2' && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copyToClipboard(bloco2)}>
                  <Copy className="h-3 w-3 mr-1" />Copiar
                </Button>
              )}
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-md p-2 max-h-24 overflow-y-auto">{bloco2}</pre>
            {step === 'bloco2' && (
              <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => { clearTimer(); goToBloco3(); }}>
                Já enviei — Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Block 3 - Report */}
          <div className={`rounded-lg border p-3 transition-all ${currentIdx > 2 ? 'opacity-40 scale-[0.98]' : ''} ${step === 'bloco3' ? 'ring-2 ring-green-500/50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StepBadge n={3} done={currentIdx > 2} active={step === 'bloco3'} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relatório da Semana</span>
              </div>
              {step === 'bloco3' && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copyToClipboard(bloco3)}>
                  <Copy className="h-3 w-3 mr-1" />Copiar
                </Button>
              )}
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-md p-2 max-h-24 overflow-y-auto">{bloco3}</pre>
            {step === 'bloco3' && (
              <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => { clearTimer(); setStep('done'); toast({ title: '✅ Relatório enviado!' }); }}>
                Já enviei — Concluir <Check className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Main action */}
        {step === 'idle' && (
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-5" onClick={startFlow}>
            <MessageSquare className="h-5 w-5 mr-2" />
            Enviar relatório no WhatsApp
          </Button>
        )}

        {step === 'done' && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetFlow}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reenviar
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepBadge({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  if (done) {
    return <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>;
  }
  return (
    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${active ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950' : 'border-muted-foreground/30 text-muted-foreground'}`}>
      {n}
    </div>
  );
}
