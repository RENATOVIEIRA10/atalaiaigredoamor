import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Copy, Check, QrCode } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  };
}

function buildBloco1(data: WhatsAppShareDialogProps['reportData']): string {
  const lines: string[] = [];

  lines.push(`*Célula ${data.celula_name}* ❤️`);
  lines.push(`Líderes: ${data.lider1_name} e ${data.lider2_name}`);

  if (data.meeting_day || data.meeting_time) {
    const dayTime = [data.meeting_day ? `Toda ${data.meeting_day}` : '', data.meeting_time ? `às ${data.meeting_time}` : ''].filter(Boolean).join(' ');
    lines.push(dayTime);
  }

  if (data.address) {
    lines.push(`End.: ${data.address}`);
  }

  if (data.bairro || data.cidade) {
    lines.push([data.bairro, data.cidade].filter(Boolean).join(' - '));
  }

  const instas = [data.instagram_lider1, data.instagram_lider2, data.instagram_celula].filter(Boolean);
  if (instas.length > 0) {
    lines.push('');
    lines.push('Instagram:');
    instas.forEach(ig => lines.push(ig.startsWith('@') ? ig : `@${ig}`));
  }

  return lines.join('\n');
}

function buildBloco2(data: WhatsAppShareDialogProps['reportData']): string {
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
  lines.push(`📖 NOSSA MENSAGEM: *${data.mensagem || '—'}*`);
  lines.push(`❤️ NOSSA PAIXÃO: *PESSOAS*`);
  lines.push(`🫶🏾 NOSSA CULTURA: *AMOR*`);

  return lines.join('\n');
}

interface BlocoSectionProps {
  title: string;
  text: string;
  waUrl: string;
}

function BlocoSection({ title, text, waUrl }: BlocoSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copiado!', description: `${title} copiado para a área de transferência` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="rounded-md bg-muted/30 p-3">
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          onClick={() => window.open(waUrl, '_blank')}
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Enviar no WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="text-center space-y-2 pt-1">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" />
          Escaneie para enviar pelo celular
        </div>
        <div className="flex justify-center bg-white rounded-lg p-3 mx-auto w-fit">
          <QRCodeSVG value={waUrl} size={140} level="M" />
        </div>
      </div>
    </div>
  );
}

export function WhatsAppShareDialog({ open, onOpenChange, reportData }: WhatsAppShareDialogProps) {
  const bloco1 = buildBloco1(reportData);
  const bloco2 = buildBloco2(reportData);
  const waUrl1 = `https://wa.me/?text=${encodeURIComponent(bloco1)}`;
  const waUrl2 = `https://wa.me/?text=${encodeURIComponent(bloco2)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <div className="space-y-4">
          <BlocoSection title="Bloco 1 — Apresentação da Célula" text={bloco1} waUrl={waUrl1} />
          <BlocoSection title="Bloco 2 — Relatório da Semana" text={bloco2} waUrl={waUrl2} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
