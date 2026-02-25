import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MessageCircle, CheckCircle, Edit3, Loader2, AlertTriangle,
} from 'lucide-react';
import { useRecomecoAgent } from '@/hooks/useRecomecoAgent';
import {
  useRecomecoTemplates,
  useRecomecoMessages,
  useCreateRecomecoMessage,
  useConfirmRecomecoMessage,
} from '@/hooks/useRecomecoAgent';
import type { NovaVida } from '@/hooks/useNovasVidas';

function normalizeWhatsAppForUrl(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

interface BoasVindasWhatsAppProps {
  vida: NovaVida;
  compact?: boolean;
}

export function BoasVindasWhatsApp({ vida, compact = false }: BoasVindasWhatsAppProps) {
  const { data: agent } = useRecomecoAgent();
  const { data: templates } = useRecomecoTemplates();
  const { data: messages } = useRecomecoMessages(vida.id);
  const createMessage = useCreateRecomecoMessage();
  const confirmMessage = useConfirmRecomecoMessage();
  const [showEditor, setShowEditor] = useState(false);
  const [editedMsg, setEditedMsg] = useState('');

  const lastMessage = messages?.[0];
  const isSent = lastMessage?.status === 'sent_confirmed';
  const isOpened = lastMessage?.status === 'opened_whatsapp';

  const defaultTemplate = templates?.[0];

  const builtMessage = useMemo(() => {
    if (!defaultTemplate || !agent) return '';
    return defaultTemplate.body
      .replace(/\{vida_nome\}/g, vida.nome || '')
      .replace(/\{agente_nome\}/g, agent.nome || '')
      .replace(/\{agente_assinatura\}/g, agent.mensagem_assinatura || agent.cargo || '');
  }, [defaultTemplate, agent, vida]);

  const phone = normalizeWhatsAppForUrl(vida.whatsapp);

  const handleOpenWhatsApp = () => {
    if (!phone) return;
    const msgText = editedMsg || builtMessage;
    const encodedMsg = encodeURIComponent(msgText);

    // Track the message
    createMessage.mutate({
      vida_id: vida.id,
      template_id: defaultTemplate?.id,
      message_preview: msgText,
      status: 'opened_whatsapp',
    });

    // Open WhatsApp - use location.href for PWA compatibility
    const url = `https://wa.me/${phone}?text=${encodedMsg}`;
    window.open(url, '_blank');
    setShowEditor(false);
  };

  const handleConfirm = () => {
    if (lastMessage) {
      confirmMessage.mutate(lastMessage.id);
    }
  };

  // Compact badge for lists
  if (compact) {
    return (
      <Badge
        variant="outline"
        className={`text-[10px] gap-1 ${
          isSent
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : isOpened
            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            : 'bg-white/10 text-white/50 border-white/20'
        }`}
      >
        {isSent ? (
          <><CheckCircle className="h-2.5 w-2.5" />Enviada</>
        ) : isOpened ? (
          <><MessageCircle className="h-2.5 w-2.5" />Aberta</>
        ) : (
          'Pendente'
        )}
      </Badge>
    );
  }

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: '#C5A059' }}>
              Boas-vindas (WhatsApp)
            </p>
            {isSent && (
              <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-300 border-green-500/30 gap-1">
                <CheckCircle className="h-2.5 w-2.5" />Enviada
              </Badge>
            )}
            {isOpened && !isSent && (
              <Badge variant="outline" className="text-[10px] bg-yellow-500/20 text-yellow-300 border-yellow-500/30 gap-1">
                <MessageCircle className="h-2.5 w-2.5" />WhatsApp aberto
              </Badge>
            )}
          </div>

          {!phone && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">Telefone inválido ou ausente. Corrija o WhatsApp antes de enviar.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!isSent && phone && (
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                style={{ background: '#25D366', color: '#fff' }}
                onClick={() => {
                  setEditedMsg(builtMessage);
                  setShowEditor(true);
                }}
                disabled={!agent}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar Boas-vindas
              </Button>
            )}

            {isOpened && !isSent && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 text-green-400 border-green-500/30"
                onClick={handleConfirm}
                disabled={confirmMessage.isPending}
              >
                {confirmMessage.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                Marcar como Enviada
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <Dialog open={showEditor} onOpenChange={o => { if (!o) setShowEditor(false); }}>
        <DialogContent className="bg-[#1e1e22] border-[#C5A059]/20 text-[#F4EDE4] max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: '#F4EDE4' }}>Mensagem de Boas-vindas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: '#B8B6B3' }}>
              <Edit3 className="h-3 w-3" />
              Ajuste a mensagem se necessário antes de abrir o WhatsApp.
            </div>
            <Textarea
              value={editedMsg}
              onChange={e => setEditedMsg(e.target.value)}
              className="bg-white/5 border-white/10 text-[#F4EDE4] min-h-[200px]"
              rows={8}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditor(false)}
                className="flex-1 h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenWhatsApp}
                className="flex-1 h-11 gap-2"
                disabled={createMessage.isPending}
                style={{ background: '#25D366', color: '#fff' }}
              >
                {createMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
