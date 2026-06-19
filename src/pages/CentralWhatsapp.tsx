import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSetWhatsappMessageStatus, useWhatsappOps, WhatsappMessage } from '@/hooks/useWhatsappOps';
import { cn } from '@/lib/utils';

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

export default function CentralWhatsapp() {
  const { data, isLoading, error, refetch, isFetching } = useWhatsappOps();
  const setStatus = useSetWhatsappMessageStatus();

  const pendingMessages = useMemo(
    () => (data?.messages || []).filter((m) => ['received', 'pending', 'pending_confirmation', 'failed'].includes(m.status)),
    [data?.messages],
  );

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
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
              Atualizar
            </Button>
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

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Bot} label="Conexão" value={connectionLabel} subtitle={bot.whatsapp_user || 'WhatsApp não identificado'} color={bot.ok ? 'vida' : 'ruby'} />
          <StatCard icon={Inbox} label="Pendências" value={data?.metrics.pending_total || 0} subtitle="Inbox pastoral" color={(data?.metrics.pending_total || 0) > 0 ? 'gold' : 'vida'} />
          <StatCard icon={MessageSquare} label="Relatórios" value={data?.metrics.reports_total || 0} subtitle="Mensagens classificadas" />
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
              <InfoRow label="QR pendente" value={bot.has_qr ? 'Sim' : 'Não'} icon={QrCode} />
              <InfoRow label="Fila pendente" value={String(bot.queue_pending ?? 0)} />
              <InfoRow label="Rate limit streak" value={String(bot.queue_rate_limit_streak ?? 0)} />
              <InfoRow label="Backoff até" value={bot.queue_backoff_until || 'sem backoff'} />
              <InfoRow label="Último envio" value={relativeTime(bot.last_sent_at)} icon={Send} />
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
                        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ messageId: message.id, status: 'approved' })}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ messageId: message.id, status: 'needs_correction' })}>
                          Corrigir
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ messageId: message.id, status: 'discarded' })}>
                          <XCircle className="mr-1.5 h-3.5 w-3.5" /> Descartar
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

          <TabsContent value="messages">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.messages || []).map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(message.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{message.phone || message.remote_jid || '--'}</TableCell>
                        <TableCell><Badge variant="outline">{message.classification}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{message.status}</Badge></TableCell>
                        <TableCell className="max-w-xl text-sm">{messagePreview(message)}</TableCell>
                      </TableRow>
                    ))}
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
                    {(data?.events || []).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(event.created_at)}</TableCell>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell><Badge variant={event.severity === 'critical' ? 'destructive' : 'outline'}>{event.severity}</Badge></TableCell>
                        <TableCell className="max-w-xl text-sm text-muted-foreground">{event.description || event.event_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
