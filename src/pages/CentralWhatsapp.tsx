import { useMemo, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  MessageSquare,
  QrCode,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  XCircle,
  Power,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useSetWhatsappMessageStatus,
  useWhatsappOps,
  useWhatsappBotQR,
  useWhatsappBotReconnect,
  useSendWhatsappMessage,
  useWhatsappMessageDetail,
  WhatsappMessage,
} from '@/hooks/useWhatsappOps';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

function relativeTime(value?: string | null) {
  if (!value) return 'sem registro';
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: ptBR });
}

function statusTone(status?: string) {
  if (status === 'open' || status === 'online') return 'text-[hsl(var(--vida))]';
  if (status === 'config_missing' || status === 'unreachable') return 'text-[hsl(var(--ruby))]';
  return 'text-[hsl(var(--gold))]';
}

function messagePreview(message: WhatsappMessage) {
  const text = message.message_text || '';
  if (text.length <= 120) return text || 'Sem texto';
  return `${text.slice(0, 120)}...`;
}

function payloadPreview(payload: Record<string, unknown> | null) {
  if (!payload || Object.keys(payload).length === 0) return 'Sem extração';
  return JSON.stringify(payload, null, 2);
}

const STATUS_OPTIONS = ['received', 'pending', 'pending_confirmation', 'approved', 'needs_correction', 'discarded', 'failed', 'sent'];
const CLASS_OPTIONS = ['report', 'manual', 'unclassified', 'question', 'noise'];

export default function CentralWhatsapp() {
  const { data, isLoading, error, refetch, isFetching } = useWhatsappOps();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ messageId: string; status: string } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterText, setFilterText] = useState('');

  const pendingMessages = useMemo(
    () => (data?.messages || []).filter((m) => ['received', 'pending', 'pending_confirmation', 'failed'].includes(m.status)),
    [data?.messages],
  );

  const filteredMessages = useMemo(() => {
    return (data?.messages || []).filter((m) => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (filterClass !== 'all' && m.classification !== filterClass) return false;
      if (filterPhone && !(m.phone || m.remote_jid || '').includes(filterPhone)) return false;
      if (filterText && !(m.message_text || '').toLowerCase().includes(filterText.toLowerCase())) return false;
      return true;
    });
  }, [data?.messages, filterStatus, filterClass, filterPhone, filterText]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const bot = data?.bot || {};
  const connectionLabel = bot.connection || bot.status || (bot.ok ? 'online' : 'indisponível');

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Central WhatsApp"
          subtitle="Atalaia no WhatsApp: relatórios, pendências, QR e auditoria pastoral em um só lugar."
          icon={MessageSquare}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setSendOpen(true)}>
                <Send className="mr-2 h-4 w-4" /> Enviar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" /> QR / Conexão
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
                Atualizar
              </Button>
            </div>
          }
        />

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Não foi possível carregar a operação WhatsApp. Verifique a Edge Function `whatsapp-ops`.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard icon={Bot} label="Conexão" value={connectionLabel} subtitle={bot.whatsapp_user || 'WhatsApp não identificado'} color={bot.ok ? 'vida' : 'ruby'} />
          <StatCard icon={Inbox} label="Pendências" value={data?.metrics.pending_total || 0} subtitle="Inbox pastoral" color={(data?.metrics.pending_total || 0) > 0 ? 'gold' : 'vida'} />
          <StatCard icon={MessageSquare} label="Relatórios" value={data?.metrics.reports_total || 0} subtitle="Mensagens classificadas" />
          <StatCard icon={CheckCircle2} label="Confirmar" value={data?.metrics.pending_confirmation_total || 0} subtitle="Aguardando resposta" color={(data?.metrics.pending_confirmation_total || 0) > 0 ? 'gold' : 'vida'} />
          <StatCard icon={AlertTriangle} label="Sem relatório" value={data?.metrics.missing_reports_total ?? '--'} subtitle="Semana atual" color={(data?.metrics.missing_reports_total || 0) > 0 ? 'ruby' : 'vida'} />
          <StatCard icon={Clock3} label="Última msg" value={bot.mudo_ha_min ?? '--'} unit="min" subtitle={relativeTime(bot.last_message_at)} color={(bot.mudo_ha_min || 0) > 1440 ? 'ruby' : 'vida'} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className={cn('h-4 w-4', statusTone(connectionLabel))} />
                Saúde da Operação WhatsApp
              </CardTitle>
              <CardDescription>Estado do processo Baileys/PM2 e fila de mensagens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Status" value={connectionLabel} />
              <InfoRow label="QR pendente" value={bot.has_qr ? 'Sim — abrir QR' : 'Não'} icon={QrCode} />
              <InfoRow label="Fila pendente" value={String(bot.queue_pending ?? 0)} />
              <InfoRow label="Rate limit streak" value={String(bot.queue_rate_limit_streak ?? 0)} />
              <InfoRow label="Backoff até" value={bot.queue_backoff_until || 'sem backoff'} />
              <InfoRow label="Último envio" value={relativeTime(bot.last_sent_at)} icon={Send} />
              <InfoRow label="Último relatório salvo" value={relativeTime(bot.last_report_saved_at)} icon={CheckCircle2} />
              <InfoRow label="Banco" value={bot.database_write_ok === false ? `falha em ${relativeTime(bot.database_write_at)}` : `ok ${relativeTime(bot.database_write_at)}`} />
              <InfoRow label="Último erro" value={relativeTime(bot.last_error_at)} icon={AlertTriangle} />
              <InfoRow label="Commit" value={bot.commit_sha || 'não informado'} />
              <InfoRow label="Versão" value={bot.versao || 'não informada'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="h-4 w-4 text-primary" />
                Inbox Pastoral
              </CardTitle>
              <CardDescription>Mensagens ambíguas, relatórios aguardando confirmação e falhas de processamento.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMessages.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhuma pendência pastoral agora.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMessages.slice(0, 8).map((message) => (
                    <div key={message.id} className="rounded-lg border bg-card p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{message.classification}</Badge>
                          <Badge variant={message.status === 'failed' ? 'destructive' : 'secondary'}>{message.status}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{relativeTime(message.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{messagePreview(message)}</p>
                      {message.error_message && <p className="mt-2 text-xs text-destructive">{message.error_message}</p>}
                      <pre className="mt-3 max-h-32 overflow-auto rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                        {payloadPreview(message.extracted_payload)}
                      </pre>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setStatusDialog({ messageId: message.id, status: 'approved' })}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatusDialog({ messageId: message.id, status: 'needs_correction' })}>
                          Corrigir
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatusDialog({ messageId: message.id, status: 'discarded' })}>
                          <XCircle className="mr-1.5 h-3.5 w-3.5" /> Descartar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedMessageId(message.id)}>
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="events">Auditoria Pastoral</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-3">
            <Card>
              <CardContent className="grid gap-3 p-4 md:grid-cols-4">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Classificação</Label>
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {CLASS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Telefone contém</Label>
                  <Input value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} placeholder="5511..." />
                </div>
                <div>
                  <Label className="text-xs">Buscar texto</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="palavra-chave" className="pl-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Direção</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">Nenhuma mensagem para os filtros atuais.</TableCell></TableRow>
                    ) : (
                      filteredMessages.map((message) => (
                        <TableRow key={message.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedMessageId(message.id)}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(message.created_at)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{message.direction}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{message.phone || message.remote_jid || '--'}</TableCell>
                          <TableCell><Badge variant="outline">{message.classification}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{message.status}</Badge></TableCell>
                          <TableCell className="max-w-xl text-sm">{messagePreview(message)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.events || []).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">Sem eventos registrados.</TableCell></TableRow>
                    ) : (
                      (data?.events || []).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(event.created_at)}</TableCell>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell><Badge variant={event.severity === 'critical' ? 'destructive' : 'outline'}>{event.severity}</Badge></TableCell>
                          <TableCell className="max-w-xl text-sm text-muted-foreground">{event.description || event.event_type}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <StatusDialog dialog={statusDialog} onClose={() => setStatusDialog(null)} />
      <QrDialog open={qrOpen} onOpenChange={setQrOpen} botHasQr={bot.has_qr} />
      <SendDialog open={sendOpen} onOpenChange={setSendOpen} />
      <MessageDetailSheet messageId={selectedMessageId} onClose={() => setSelectedMessageId(null)} />
    </AppLayout>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/35 px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="max-w-[55%] truncate text-right font-medium">{value}</span>
    </div>
  );
}

// ----- STATUS DIALOG (with note) -----
function StatusDialog({ dialog, onClose }: { dialog: { messageId: string; status: string } | null; onClose: () => void }) {
  const [note, setNote] = useState('');
  const setStatus = useSetWhatsappMessageStatus();
  const open = !!dialog;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setNote(''); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como {dialog?.status}</DialogTitle>
          <DialogDescription>A nota fica registrada na auditoria pastoral (whatsapp_events).</DialogDescription>
        </DialogHeader>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Descreva o motivo / contexto pastoral (mínimo 3 caracteres)" rows={4} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => { onClose(); setNote(''); }}>Cancelar</Button>
          <Button
            disabled={note.trim().length < 3 || setStatus.isPending}
            onClick={async () => {
              if (!dialog) return;
              try {
                await setStatus.mutateAsync({ messageId: dialog.messageId, status: dialog.status, note: note.trim() });
                toast.success('Status atualizado e auditado.');
                onClose();
                setNote('');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Falha ao salvar');
              }
            }}
          >
            {setStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- QR DIALOG -----
function QrDialog({ open, onOpenChange, botHasQr }: { open: boolean; onOpenChange: (o: boolean) => void; botHasQr?: boolean }) {
  const qr = useWhatsappBotQR();
  const reconnect = useWhatsappBotReconnect();

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o) qr.mutate(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code & Reconexão</DialogTitle>
          <DialogDescription>
            {botHasQr ? 'Bot aguardando pareamento. Escaneie o QR no WhatsApp do número operacional.' : 'Sessão ativa — peça novo QR apenas se precisar parear outro número.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {qr.isPending && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          {qr.data?.qr ? (
            qr.data.qr.startsWith('data:image') ? (
              <img src={qr.data.qr} alt="QR WhatsApp" className="h-64 w-64 rounded border" />
            ) : (
              <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{qr.data.qr}</pre>
            )
          ) : !qr.isPending && (
            <p className="text-sm text-muted-foreground">Sem QR disponível no momento.</p>
          )}
          {qr.error && <p className="text-xs text-destructive">{(qr.error as Error).message}</p>}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => qr.mutate()} disabled={qr.isPending}>
            <RefreshCw className={cn('mr-2 h-4 w-4', qr.isPending && 'animate-spin')} /> Atualizar QR
          </Button>
          <Button
            variant="destructive"
            disabled={reconnect.isPending}
            onClick={async () => {
              try {
                await reconnect.mutateAsync();
                toast.success('Reconexão solicitada ao agente.');
                qr.mutate();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Falha ao reconectar');
              }
            }}
          >
            {reconnect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
            Reconectar bot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- SEND DIALOG -----
function SendDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const send = useSendWhatsappMessage();

  const digits = phone.replace(/\D/g, '');
  const canSend = digits.length >= 10 && digits.length <= 15 && text.trim().length > 0 && text.length <= 4000;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setPhone(''); setText(''); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp via agente</DialogTitle>
          <DialogDescription>Mensagem registrada em whatsapp_messages como `outbound` e auditada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Telefone (com DDI)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999999999" />
            <p className="mt-1 text-[11px] text-muted-foreground">{digits.length}/15 dígitos</p>
          </div>
          <div>
            <Label className="text-xs">Mensagem</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Texto da mensagem (max 4000 chars)" />
            <p className="mt-1 text-[11px] text-muted-foreground">{text.length}/4000</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!canSend || send.isPending}
            onClick={async () => {
              try {
                const res = await send.mutateAsync({ phone: digits, text });
                if ((res as any)?.ok) toast.success('Mensagem enviada.');
                else toast.warning('Registrada como falha — verifique o agente.');
                onOpenChange(false);
                setPhone(''); setText('');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Falha ao enviar');
              }
            }}
          >
            {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" /> Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- MESSAGE DETAIL SHEET -----
function MessageDetailSheet({ messageId, onClose }: { messageId: string | null; onClose: () => void }) {
  const { data, isLoading } = useWhatsappMessageDetail(messageId);
  return (
    <Sheet open={!!messageId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detalhes da mensagem</SheetTitle>
          <SheetDescription>Histórico do número, vínculos pastorais e auditoria.</SheetDescription>
        </SheetHeader>
        {isLoading && <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        {data && (
          <div className="mt-4 space-y-4">
            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{data.message.direction}</Badge>
                  <Badge variant="outline">{data.message.classification}</Badge>
                  <Badge variant="secondary">{data.message.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(data.message.created_at), 'PPpp', { locale: ptBR })}
                </p>
                <p className="font-mono text-xs">{data.message.phone || data.message.remote_jid}</p>
                <p className="whitespace-pre-wrap text-sm">{data.message.message_text || 'Sem texto'}</p>
                {data.message.error_message && <p className="text-xs text-destructive">{data.message.error_message}</p>}
                {data.message.extracted_payload && Object.keys(data.message.extracted_payload).length > 0 && (
                  <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(data.message.extracted_payload, null, 2)}</pre>
                )}
              </CardContent>
            </Card>

            {data.celula && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Célula vinculada</CardTitle></CardHeader>
                <CardContent className="space-y-1 p-4 pt-0 text-sm">
                  <p className="font-medium">{data.celula.nome}</p>
                  <p className="text-xs text-muted-foreground">{data.celula.dia_semana} {data.celula.horario}</p>
                  {data.celula.endereco && <p className="text-xs text-muted-foreground">{data.celula.endereco}</p>}
                  <Link to={`/celulas`} className="inline-flex items-center text-xs text-primary hover:underline">
                    <ExternalLink className="mr-1 h-3 w-3" /> Ir para células
                  </Link>
                </CardContent>
              </Card>
            )}

            {data.weekly_report && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Relatório semanal vinculado</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-xs">
                  <pre className="max-h-40 overflow-auto rounded bg-muted p-2">{JSON.stringify(data.weekly_report, null, 2)}</pre>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Histórico do número ({data.history.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {data.history.length === 0 && <p className="text-xs text-muted-foreground">Sem outras mensagens deste número.</p>}
                {data.history.map((h) => (
                  <div key={h.id} className="rounded border p-2 text-xs">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-muted-foreground">{relativeTime(h.created_at)}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[10px]">{h.direction}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{h.status}</Badge>
                      </div>
                    </div>
                    <p className="line-clamp-2">{h.message_text || '—'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Auditoria desta mensagem</CardTitle></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {data.events.length === 0 && <p className="text-xs text-muted-foreground">Sem eventos.</p>}
                {data.events.map((ev) => (
                  <div key={ev.id} className="rounded border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ev.title}</span>
                      <Badge variant={ev.severity === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">{ev.severity}</Badge>
                    </div>
                    <p className="text-muted-foreground">{relativeTime(ev.created_at)}</p>
                    {ev.description && <p className="mt-1">{ev.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
