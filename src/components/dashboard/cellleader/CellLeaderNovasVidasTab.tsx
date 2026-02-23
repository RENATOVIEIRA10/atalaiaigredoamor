import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useEncaminhamentos, useUpdateEncaminhamento } from '@/hooks/useEncaminhamentos';
import { useUpdateNovaVida } from '@/hooks/useNovasVidas';
import { useCreateMember } from '@/hooks/useMembers';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle, CheckCircle, Home, Clock, RotateCcw, UserPlus, Heart, MapPin, CalendarDays, AlertTriangle } from 'lucide-react';
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  contatado: { label: 'Contatado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: MessageCircle },
  integrado: { label: 'Integrado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
  sem_resposta: { label: 'Sem resposta', color: 'bg-muted text-muted-foreground border-border', icon: Clock },
};

interface CellLeaderNovasVidasTabProps {
  celulaId: string;
  celulaName: string;
  coupleNames?: string;
}

export function CellLeaderNovasVidasTab({ celulaId, celulaName, coupleNames }: CellLeaderNovasVidasTabProps) {
  const { data: allEnc, isLoading } = useEncaminhamentos();
  const updateEnc = useUpdateEncaminhamento();
  const updateNV = useUpdateNovaVida();
  const createMember = useCreateMember();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [promoteTarget, setPromoteTarget] = useState<any>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  const form = useForm<PromoteFormData>({
    resolver: zodResolver(promoteSchema),
    defaultValues: { name: '', whatsapp: '', birth_date: '' },
  });

  // Filter only encaminhamentos for this celula, exclude 'integrado' that was already promoted
  const encaminhamentos = (allEnc || []).filter(e => e.celula_id === celulaId);
  const activeEnc = encaminhamentos.filter(e => e.status !== 'devolvido');
  const pendingCount = activeEnc.filter(e => e.status === 'pendente').length;

  const pendingAlertDays = 3;
  const hasOldPending = activeEnc.some(e =>
    e.status === 'pendente' && differenceInDays(new Date(), new Date(e.data_encaminhamento)) >= pendingAlertDays
  );

  function handleWhatsApp(enc: any) {
    const phone = enc.nova_vida?.whatsapp?.replace(/\D/g, '');
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

  async function handleStatusChange(encId: string, newStatus: string) {
    updateEnc.mutate({ id: encId, status: newStatus } as any);
  }

  async function handleReturn(enc: any) {
    // Return to Recomeço flow
    updateEnc.mutate({ id: enc.id, status: 'devolvido' } as any);
    if (enc.nova_vida_id) {
      updateNV.mutate({ id: enc.nova_vida_id, status: 'aguardando' });
    }
    toast({ title: 'Vida devolvida ao Recomeço' });
  }

  function openPromote(enc: any) {
    const nv = enc.nova_vida;
    form.reset({
      name: nv?.nome || '',
      whatsapp: nv?.whatsapp || '',
      birth_date: '',
    });
    setPromoteTarget(enc);
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

      // Create profile
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

      // Create member
      await createMember.mutateAsync({
        profile_id: profile.id,
        celula_id: celulaId,
        whatsapp: normalizedWa,
      } as any);

      // Update encaminhamento status
      await supabase
        .from('encaminhamentos_recomeco')
        .update({ status: 'integrado' })
        .eq('id', promoteTarget.id);

      // Update nova_vida status
      if (promoteTarget.nova_vida_id) {
        await supabase
          .from('novas_vidas')
          .update({ status: 'integrada' })
          .eq('id', promoteTarget.nova_vida_id);
      }

      qc.invalidateQueries({ queryKey: ['encaminhamentos'] });
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Vida integrada como membro da célula! 🎉' });
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
      {/* Alert for old pending */}
      {hasOldPending && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Há novas vidas aguardando contato há mais de {pendingAlertDays} dias.
            </p>
          </CardContent>
        </Card>
      )}

      {activeEnc.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhuma nova vida encaminhada"
          description="Quando o Recomeço encaminhar vidas para sua célula, elas aparecerão aqui."
        />
      ) : (
        <div className="grid gap-3">
          {activeEnc.map(enc => {
            const nv = enc.nova_vida;
            const statusCfg = STATUS_CONFIG[enc.status] || STATUS_CONFIG.pendente;
            const StatusIcon = statusCfg.icon;
            const daysSince = differenceInDays(new Date(), new Date(enc.data_encaminhamento));

            return (
              <Card key={enc.id} className="border-l-4 border-l-primary/30">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{nv?.nome || 'Sem nome'}</p>
                      {(nv?.bairro || nv?.cidade) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {[nv?.bairro, nv?.cidade].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(enc.data_encaminhamento), "dd/MM/yyyy", { locale: ptBR })}
                        {daysSince > 0 && <span className="ml-1">({daysSince}d atrás)</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs shrink-0 gap-1', statusCfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {nv?.whatsapp && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleWhatsApp(enc)}>
                        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                        WhatsApp
                      </Button>
                    )}

                    {enc.status === 'pendente' && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleStatusChange(enc.id, 'contatado')}>
                        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                        Contatado
                      </Button>
                    )}

                    {(enc.status === 'pendente' || enc.status === 'contatado') && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleStatusChange(enc.id, 'sem_resposta')}>
                          <Clock className="h-3.5 w-3.5" />
                          Sem resposta
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => handleReturn(enc)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                          Devolver
                        </Button>
                      </>
                    )}

                    {enc.status === 'contatado' && (
                      <Button size="sm" className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => openPromote(enc)}>
                        <UserPlus className="h-3.5 w-3.5" />
                        Integrar
                      </Button>
                    )}

                    {enc.status === 'integrado' && (
                      <Button size="sm" className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => openPromote(enc)}>
                        <Home className="h-3.5 w-3.5" />
                        Adicionar como membro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Promote dialog */}
      <Dialog open={!!promoteTarget} onOpenChange={open => { if (!open) setPromoteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar como Membro da Célula</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPromote)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(DDD) 9xxxx-xxxx" inputMode="tel" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setPromoteTarget(null)} className="flex-1 h-12">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPromoting} className="flex-1 h-12 font-semibold">
                  {isPromoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
