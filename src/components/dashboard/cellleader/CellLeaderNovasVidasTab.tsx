import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { useNovasVidasByCelula, useChangeNovaVidaStatus, STATUS_LABELS, type PipelineStatus } from '@/hooks/useNovasVidas';
import { useCreateMember } from '@/hooks/useMembers';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, MessageCircle, CheckCircle, Clock, RotateCcw, UserPlus, Heart,
  MapPin, CalendarDays, AlertTriangle, Eye, Phone as PhoneIcon, Calendar, UserCheck,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

function normalizeWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return null;
}

const promoteSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  whatsapp: z.string().optional(),
  birth_date: z.string().optional(),
});

type PromoteFormData = z.infer<typeof promoteSchema>;

const STATUS_ICONS: Record<string, React.ElementType> = {
  encaminhada: Clock,
  recebida_pela_celula: Eye,
  contatada: MessageCircle,
  sem_resposta: Clock,
  agendada: Calendar,
  visitou: UserCheck,
  integrada: CheckCircle,
  convertida_membro: UserPlus,
  nao_convertida: RotateCcw,
  reatribuir: RotateCcw,
};

interface CellLeaderNovasVidasTabProps {
  celulaId: string;
  celulaName: string;
  coupleNames?: string;
}

export function CellLeaderNovasVidasTab({ celulaId, celulaName, coupleNames }: CellLeaderNovasVidasTabProps) {
  const { data: vidas, isLoading } = useNovasVidasByCelula(celulaId);
  const changeStatus = useChangeNovaVidaStatus();
  const createMember = useCreateMember();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [promoteTarget, setPromoteTarget] = useState<any>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [notesDialog, setNotesDialog] = useState<{ vidaId: string; targetStatus: PipelineStatus } | null>(null);
  const [notesText, setNotesText] = useState('');

  const form = useForm<PromoteFormData>({
    resolver: zodResolver(promoteSchema),
    defaultValues: { name: '', whatsapp: '', birth_date: '' },
  });

  const activeVidas = (vidas || []).filter(v => !['nao_convertida'].includes(v.status));
  const pendingAlertDays = 3;
  const hasOldPending = activeVidas.some(v =>
    v.status === 'encaminhada' && differenceInDays(new Date(), new Date(v.updated_at)) >= pendingAlertDays
  );

  function handleWhatsApp(nv: any) {
    const phone = nv.whatsapp?.replace(/\D/g, '');
    if (!phone) {
      toast({ title: 'WhatsApp não disponível', variant: 'destructive' });
      return;
    }
    const leaderName = coupleNames || 'a liderança';
    const msg = encodeURIComponent(
      `Oi, tudo bem? Aqui é ${leaderName} da célula ${celulaName}.\n\nRecebemos seu contato pelo Recomeço da Igreja do Amor e queremos te acolher. 🤗`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  function handleStatusChange(vidaId: string, newStatus: PipelineStatus, notes?: string) {
    changeStatus.mutate({
      vidaId,
      newStatus,
      notes,
      actorRole: 'celula_leader',
    });
  }

  function handleStatusWithNotes(vidaId: string, targetStatus: PipelineStatus) {
    setNotesDialog({ vidaId, targetStatus });
    setNotesText('');
  }

  function confirmStatusWithNotes() {
    if (!notesDialog) return;
    handleStatusChange(notesDialog.vidaId, notesDialog.targetStatus, notesText || undefined);
    setNotesDialog(null);
  }

  function openPromote(nv: any) {
    form.reset({
      name: nv.nome || '',
      whatsapp: nv.whatsapp || '',
      birth_date: '',
    });
    setPromoteTarget(nv);
  }

  async function onPromote(data: PromoteFormData) {
    if (!promoteTarget) return;
    setIsPromoting(true);
    try {
      const rawWa = data.whatsapp?.trim() || '';
      let normalizedWa: string | null = null;
      if (rawWa) {
        normalizedWa = normalizeWhatsApp(rawWa);
        if (!normalizedWa) {
          form.setError('whatsapp', { message: 'Número inválido. Use DDD + número' });
          setIsPromoting(false);
          return;
        }
      }

      // Fetch celula to get rede_id
      const { data: celulaData } = await supabase
        .from('celulas')
        .select('rede_id')
        .eq('id', celulaId)
        .single();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          name: data.name,
          user_id: crypto.randomUUID(),
          birth_date: data.birth_date || null,
        })
        .select()
        .single();
      if (profileError) throw profileError;

      await createMember.mutateAsync({
        profile_id: profile.id,
        celula_id: celulaId,
        whatsapp: normalizedWa,
        rede_id: celulaData?.rede_id || null,
      } as any);

      // Update via pipeline
      changeStatus.mutate({
        vidaId: promoteTarget.id,
        newStatus: 'convertida_membro',
        actorRole: 'celula_leader',
        extraData: { assigned_cell_id: celulaId },
      });

      // Sync encaminhamentos_recomeco so upper dashboards reflect conversion
      const { data: memberRecord } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('celula_id', celulaId)
        .single();

      await supabase
        .from('encaminhamentos_recomeco')
        .update({
          status: 'convertido',
          promovido_membro_at: new Date().toISOString(),
          membro_id: memberRecord?.id || null,
        })
        .eq('nova_vida_id', promoteTarget.id);

      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['recomeco-funnel-all'] });
      toast({ title: 'Vida convertida em membro da célula! 🎉' });
      setPromoteTarget(null);
    } catch (error: any) {
      toast({ title: 'Erro ao promover', description: error.message, variant: 'destructive' });
    } finally {
      setIsPromoting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasOldPending && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Há novas vidas aguardando recebimento há mais de {pendingAlertDays} dias.
            </p>
          </CardContent>
        </Card>
      )}

      {activeVidas.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhuma nova vida recebida"
          description="Quando a Central encaminhar vidas para sua célula, elas aparecerão aqui."
        />
      ) : (
        <div className="grid gap-3">
          {activeVidas.map(nv => {
            const st = STATUS_LABELS[nv.status] || { label: nv.status, color: '' };
            const Icon = STATUS_ICONS[nv.status] || Clock;
            const daysSince = differenceInDays(new Date(), new Date(nv.updated_at));

            return (
              <Card key={nv.id} className="border-l-4 border-l-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{nv.nome}</p>
                      {(nv.bairro || nv.cidade) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {[nv.bairro, nv.cidade].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(nv.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        {daysSince > 0 && <span className="ml-1">({daysSince}d)</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs shrink-0 gap-1', st.color)}>
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </Badge>
                  </div>

                    <div className="flex flex-wrap gap-2">
                     {nv.whatsapp && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleWhatsApp(nv)}>
                        <MessageCircle className="h-3.5 w-3.5 text-green-600" />WhatsApp
                      </Button>
                    )}

                    {nv.status === 'encaminhada' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleStatusChange(nv.id, 'recebida_pela_celula')}>
                        <Eye className="h-3.5 w-3.5 text-indigo-500" />Recebida
                      </Button>
                    )}

                    {['encaminhada', 'recebida_pela_celula'].includes(nv.status) && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleStatusChange(nv.id, 'contatada')}>
                        <CheckCircle className="h-3.5 w-3.5 text-purple-500" />Contatada
                      </Button>
                    )}

                    {['contatada', 'recebida_pela_celula'].includes(nv.status) && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleStatusWithNotes(nv.id, 'sem_resposta')}>
                        <Clock className="h-3.5 w-3.5" />Sem resposta
                      </Button>
                    )}

                    {['contatada', 'sem_resposta'].includes(nv.status) && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleStatusChange(nv.id, 'agendada')}>
                        <Calendar className="h-3.5 w-3.5 text-cyan-500" />Agendada
                      </Button>
                    )}

                    {nv.status === 'agendada' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleStatusChange(nv.id, 'visitou')}>
                        <UserCheck className="h-3.5 w-3.5 text-teal-500" />Visitou
                      </Button>
                    )}

                    {['visitou', 'contatada', 'agendada'].includes(nv.status) && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px]" onClick={() => handleStatusChange(nv.id, 'integrada')}>
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />Integrada
                      </Button>
                    )}

                    {nv.status === 'integrada' && (
                      <Button size="sm" className="gap-1.5 text-xs h-10 bg-emerald-600 hover:bg-emerald-700 w-full" onClick={() => openPromote(nv)}>
                        <UserPlus className="h-3.5 w-3.5" />Converter em Membro
                      </Button>
                    )}

                    {!['convertida_membro', 'nao_convertida', 'reatribuir'].includes(nv.status) && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px] text-orange-500 border-orange-500/30" onClick={() => handleStatusWithNotes(nv.id, 'reatribuir')}>
                          <RotateCcw className="h-3.5 w-3.5" />Reatribuir
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-10 min-w-[44px] text-red-500 border-red-500/30" onClick={() => handleStatusWithNotes(nv.id, 'nao_convertida')}>
                          Não convertida
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notes dialog for statuses that need explanation */}
      <Dialog open={!!notesDialog} onOpenChange={o => { if (!o) setNotesDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {notesDialog?.targetStatus === 'reatribuir' ? 'Solicitar Reatribuição' :
               notesDialog?.targetStatus === 'nao_convertida' ? 'Encerrar - Não Convertida' :
               notesDialog?.targetStatus === 'sem_resposta' ? 'Marcar Sem Resposta' : 'Observação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Motivo ou observação..."
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setNotesDialog(null)} className="flex-1">Cancelar</Button>
              <Button onClick={confirmStatusWithNotes} className="flex-1" disabled={changeStatus.isPending}>
                {changeStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promote dialog */}
      <Dialog open={!!promoteTarget} onOpenChange={open => { if (!open) setPromoteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Membro da Célula</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPromote)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome Completo *</FormLabel><FormControl><Input className="h-12 text-base" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input placeholder="(DDD) 9xxxx-xxxx" inputMode="tel" className="h-12 text-base" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="birth_date" render={({ field }) => (
                <FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setPromoteTarget(null)} className="flex-1 h-12">Cancelar</Button>
                <Button type="submit" disabled={isPromoting} className="flex-1 h-12 font-semibold">
                  {isPromoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirmar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
