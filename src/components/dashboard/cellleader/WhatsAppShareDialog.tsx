import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, ImageIcon, ArrowRight, Copy, Download, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { useIsPWA } from '@/hooks/useIsPWA';

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

export function WhatsAppShareDialog({ open, onOpenChange, reportData }: WhatsAppShareDialogProps) {
  const { toast } = useToast();
  const isPWA = useIsPWA();
  const [step, setStep] = useState<WizardStep>('idle');
  const [confirmPrompt, setConfirmPrompt] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [busyBtn, setBusyBtn] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Pre-cached photo blob
  const photoBlobRef = useRef<{ url: string; file: File } | null>(null);
  const [photoReady, setPhotoReady] = useState(false);

  const hasPhoto = !!reportData.photo_url;

  // Pre-compute text blocks once via useMemo (no work on click)
  const bloco2 = useMemo(() => buildBloco2(reportData), [reportData]);
  const bloco3 = useMemo(() => buildBloco3(reportData), [reportData]);

  // Pre-encode WhatsApp URLs so click is instant
  const waUrlBloco2 = useMemo(() => {
    const normalized = bloco2.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return `https://wa.me/?text=${encodeURIComponent(normalized)}`;
  }, [bloco2]);

  const waUrlBloco3 = useMemo(() => {
    const normalized = bloco3.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return `https://wa.me/?text=${encodeURIComponent(normalized)}`;
  }, [bloco3]);

  // Pre-fetch photo when dialog opens
  useEffect(() => {
    if (!open || !reportData.photo_url) {
      photoBlobRef.current = null;
      setPhotoReady(false);
      return;
    }
    let cancelled = false;
    const t0 = performance.now();
    fetch(reportData.photo_url)
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return;
        const file = new File([blob], `celula-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        photoBlobRef.current = { url: URL.createObjectURL(blob), file };
        setPhotoReady(true);
        console.log(`[WA perf] photo prefetch: ${Math.round(performance.now() - t0)}ms`);
      })
      .catch(() => {
        if (!cancelled) setPhotoReady(false);
      });
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

  // Fast WhatsApp open — no encoding on click, just navigate
  const openWhatsAppFast = useCallback((url: string, btnId: string, nextStep: WizardStep) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyBtn(btnId);

    const t0 = performance.now();
    console.log(`[WA perf] ${btnId} click`);

    // Instant navigation
    if (isPWA) {
      window.location.href = url;
    } else {
      const newTab = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newTab || newTab.closed) {
        window.location.href = url;
      }
    }

    console.log(`[WA perf] ${btnId} dispatched: ${Math.round(performance.now() - t0)}ms`);

    // Release lock after short delay
    setTimeout(() => {
      busyRef.current = false;
      setBusyBtn(null);
      if (isPWA) {
        setConfirmPrompt(true);
      } else {
        advanceTo(nextStep);
      }
    }, 800);
  }, [isPWA, advanceTo]);

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

  // Photo share — uses pre-fetched blob, no network on click
  const handleSharePhoto = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyBtn('photo');

    const t0 = performance.now();
    console.log('[WA perf] photo share click');

    try {
      let file: File;
      if (photoBlobRef.current) {
        file = photoBlobRef.current.file;
        console.log(`[WA perf] photo from cache: 0ms`);
      } else {
        // Fallback: fetch now (shouldn't happen if prefetch worked)
        const response = await fetch(reportData.photo_url!);
        const blob = await response.blob();
        file = new File([blob], `celula-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        console.log(`[WA perf] photo fallback fetch: ${Math.round(performance.now() - t0)}ms`);
      }

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Fallback: download
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

    console.log(`[WA perf] photo total: ${Math.round(performance.now() - t0)}ms`);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar pelo WhatsApp
          </DialogTitle>
          <DialogDescription>
            Relatório está pronto para ser encaminhado no grupo da coordenação.
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        {step !== 'idle' && (
          <div className="space-y-1.5">
            <Progress value={progressPercent} className="h-2" />
            <span className="text-xs text-muted-foreground">
              {step === 'done' ? '✅ Envio concluído!' : `Etapa ${currentIdx + 1} de 3`}
            </span>
          </div>
        )}

        {/* Resume prompt */}
        {resumePrompt && step === 'idle' && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <p className="text-sm font-medium">Deseja continuar o envio do WhatsApp de onde parou?</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={resumeFlow}>Sim, continuar</Button>
              <Button size="sm" variant="outline" onClick={startFlow}>Recomeçar</Button>
            </div>
          </div>
        )}

        {/* PWA Confirmation prompt after returning from WhatsApp */}
        {confirmPrompt && (
          <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Você conseguiu enviar no WhatsApp?</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => {
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

        <div className="space-y-3">
          {/* ═══ ETAPA 1: FOTO ═══ */}
          <div className={`rounded-lg border p-3 transition-all ${currentIdx > 0 ? 'opacity-40' : ''} ${step === 'photo' ? 'ring-2 ring-green-500/50' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <StepBadge n={1} done={currentIdx > 0} active={step === 'photo'} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Foto da Célula</span>
              {step === 'photo' && hasPhoto && !photoReady && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
              )}
            </div>
            {hasPhoto ? (
              <>
                <img src={reportData.photo_url!} alt="Foto da célula" className="w-full h-28 object-cover rounded-md" />
                {step === 'photo' && !confirmPrompt && (
                  <div className="space-y-2 mt-3">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleSharePhoto}
                      disabled={busyBtn === 'photo'}
                    >
                      {busyBtn === 'photo' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      {busyBtn === 'photo' ? 'Abrindo…' : 'Abrir WhatsApp para enviar a foto'}
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => advanceTo('bloco2')}>
                      Já enviei a foto <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2 justify-center">
                <ImageIcon className="h-4 w-4" />
                <span>Sem foto — pulado automaticamente</span>
              </div>
            )}
          </div>

          {/* ═══ ETAPA 2: BLOCO 2 ═══ */}
          <div className={`rounded-lg border p-3 transition-all ${currentIdx > 1 ? 'opacity-40' : ''} ${step === 'bloco2' ? 'ring-2 ring-green-500/50' : ''}`}>
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
            {step === 'bloco2' && !confirmPrompt && (
              <div className="space-y-2 mt-3">
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openWhatsAppFast(waUrlBloco2, 'bloco2', 'bloco3')}
                  disabled={busyBtn === 'bloco2'}
                >
                  {busyBtn === 'bloco2' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  {busyBtn === 'bloco2' ? 'Abrindo WhatsApp…' : 'Abrir WhatsApp com o BLOCO 2'}
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => advanceTo('bloco3')}>
                  Já enviei o BLOCO 2 <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* ═══ ETAPA 3: BLOCO 3 ═══ */}
          <div className={`rounded-lg border p-3 transition-all ${currentIdx > 2 ? 'opacity-40' : ''} ${step === 'bloco3' ? 'ring-2 ring-green-500/50' : ''}`}>
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
            {step === 'bloco3' && !confirmPrompt && (
              <div className="space-y-2 mt-3">
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openWhatsAppFast(waUrlBloco3, 'bloco3', 'done')}
                  disabled={busyBtn === 'bloco3'}
                >
                  {busyBtn === 'bloco3' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  {busyBtn === 'bloco3' ? 'Abrindo WhatsApp…' : 'Abrir WhatsApp com o BLOCO 3'}
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => advanceTo('done')}>
                  Já enviei o BLOCO 3 <Check className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ AÇÕES PRINCIPAIS ═══ */}
        {step === 'idle' && !resumePrompt && (
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-5" onClick={startFlow}>
            <MessageSquare className="h-5 w-5 mr-2" />
            Enviar no WhatsApp
          </Button>
        )}

        {step === 'done' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-200">Envio concluído. Deus abençoe! 🙏</p>
            </div>
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
