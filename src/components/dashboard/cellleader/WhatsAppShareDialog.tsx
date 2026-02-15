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

function buildWhatsAppMessage(data: WhatsAppShareDialogProps['reportData']): string {
  const dateFormatted = data.meeting_date
    ? format(new Date(data.meeting_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
    : '';

  const lines: string[] = [];

  lines.push(`*Célula ${data.celula_name}* ❤️`);
  lines.push(`Líderes: ${data.lider1_name} e ${data.lider2_name}`);

  if (data.meeting_day || data.meeting_time) {
    const dayTime = [data.meeting_day, data.meeting_time ? `às ${data.meeting_time}` : ''].filter(Boolean).join(' ');
    lines.push(dayTime);
  }

  if (data.address) {
    lines.push(`End.: ${data.address}`);
  }

  if (data.bairro || data.cidade) {
    lines.push([data.bairro, data.cidade].filter(Boolean).join(' - '));
  }

  // Instagram block
  const instas = [data.instagram_lider1, data.instagram_lider2, data.instagram_celula].filter(Boolean);
  if (instas.length > 0) {
    lines.push('');
    lines.push('Instagram:');
    instas.forEach(ig => lines.push(ig.startsWith('@') ? ig : `@${ig}`));
  }

  lines.push('');
  lines.push(`*Célula ${data.celula_name}*`);
  lines.push(`(${dateFormatted})`);
  lines.push('');
  lines.push(`▪️Membros: ${data.members_present}`);
  lines.push(`▪️Visitantes: ${data.visitors}`);
  lines.push(`▪️Crianças: ${data.children}`);
  lines.push(`▪️Líder em treinamento: ${data.leaders_in_training}`);
  lines.push(`▪️Discipulados: ${data.discipleships}`);

  if (data.mensagem) {
    lines.push('');
    lines.push(`📖 NOSSA MENSAGEM: *${data.mensagem}*`);
  }
  if (data.paixao) {
    lines.push(`❤️ NOSSA PAIXÃO: *${data.paixao}*`);
  }
  if (data.cultura) {
    lines.push(`🫶🏾 NOSSA CULTURA: *${data.cultura}*`);
  }

  return lines.join('\n');
}

export function WhatsAppShareDialog({ open, onOpenChange, reportData }: WhatsAppShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const message = buildWhatsAppMessage(reportData);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast({ title: 'Copiado!', description: 'Mensagem copiada para a área de transferência' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar pelo WhatsApp
          </DialogTitle>
          <DialogDescription>
            O relatório está pronto para ser encaminhado no grupo da célula.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Prévia da mensagem</p>
            <ScrollArea className="h-[200px]">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{message}</pre>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={() => window.open(waUrl, '_blank')}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Abrir WhatsApp com a mensagem
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar mensagem'}
            </Button>
          </div>

          {/* QR Code */}
          <div className="rounded-lg border p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <QrCode className="h-4 w-4" />
              Escaneie para enviar pelo celular
            </div>
            <div className="flex justify-center bg-white rounded-lg p-4 mx-auto w-fit">
              <QRCodeSVG value={waUrl} size={180} level="M" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ideal se você preencheu o relatório no computador
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
