import { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNovasVidas, useUpdateNovaVida, STATUS_LABELS, useChangeNovaVidaStatus } from '@/hooks/useNovasVidas';
import { useCreateEncaminhamento } from '@/hooks/useEncaminhamentos';
import { useCelulasPublicas } from '@/hooks/useCelulasPublicas';
import { useRedes } from '@/hooks/useRedes';
import { useRecomecoMessages } from '@/hooks/useRecomecoAgent';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft, Loader2, Users, MapPin, Clock, Network,
  ArrowRight, Phone, Heart, UserCheck, ClipboardList, Search,
  Send, AlertTriangle, BarChart3, RotateCcw,
  MessageCircle, CheckCircle, ArrowLeft,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function CentralCelulas() {
  const navigate = useNavigate();
  const { isCentralCelulas } = useRole();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  if (!isCentralCelulas) {
    return <Navigate to="/dashboard" replace />;
  }

  const containerClass = isPWAMobile
    ? 'flex flex-col h-full'
    : 'min-h-screen';

  const containerStyle = isPWAMobile
    ? {}
    : { background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' };

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={isPWAMobile ? 'flex-1 overflow-y-auto overscroll-y-contain px-4 py-4' : 'max-w-2xl mx-auto px-4 py-6 sm:py-10'}>
        {!isPWAMobile && (
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/trocar-funcao')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <ChevronLeft className="h-5 w-5" style={{ color: '#B8B6B3' }} />
            </button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#F4EDE4', fontFamily: "'Outfit', sans-serif" }}>
                <Users className="h-5 w-5" style={{ color: '#C5A059' }} />
                Central de Células
              </h1>
              <p className="text-xs mt-1" style={{ color: '#B8B6B3' }}>Triagem, encaminhamento e acompanhamento do funil</p>
            </div>
          </div>
        )}

        <KPICards />

        <Tabs defaultValue="fila" className="w-full">
          <TabsList className={isPWAMobile
            ? 'bg-card border border-border/40 mb-4 w-full'
            : 'bg-white/5 border border-white/10 mb-6 w-full'
          }>
            <TabsTrigger value="fila" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <ClipboardList className="h-4 w-4 mr-1.5" />Fila
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <BarChart3 className="h-4 w-4 mr-1.5" />Pipeline
            </TabsTrigger>
            <TabsTrigger value="gargalos" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <AlertTriangle className="h-4 w-4 mr-1.5" />Gargalos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fila"><FilaNovasVidas isPWAMobile={isPWAMobile} /></TabsContent>
          <TabsContent value="pipeline"><PipelineView /></TabsContent>
          <TabsContent value="gargalos"><GargalosView /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function KPICards() {
  const { data: novasVidas } = useNovasVidas();
  const { data: events } = useQuery({
    queryKey: ['novas_vidas_events_kpi'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('novas_vidas_events')
        .select('*')
        .eq('event_type', 'status_encaminhada')
        .gte('created_at', today + 'T00:00:00Z');
      return data || [];
    },
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    const all = novasVidas || [];
    const fila = all.filter((nv: any) => nv.status === 'nova').length;
    const encaminhadasHoje = (events || []).length;
    const reatribuir = all.filter((nv: any) => nv.status === 'reatribuir').length;
    return { fila, encaminhadasHoje, reatribuir };
  }, [novasVidas, events]);

  const cards = [
    { label: 'Na Fila', value: stats.fila, icon: ClipboardList, color: 'text-amber-500' },
    { label: 'Encam. Hoje', value: stats.encaminhadasHoje, icon: Send, color: 'text-green-500' },
    { label: 'Reatribuir', value: stats.reatribuir, icon: RotateCcw, color: 'text-orange-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="p-3 text-center">
            <c.icon className={`h-4 w-4 mx-auto mb-1 ${c.color}`} />
            <p className="text-lg font-bold text-foreground">{c.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PipelineView() {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const pipeline = useMemo(() => {
    const all = novasVidas || [];
    const statuses = ['nova', 'em_triagem', 'encaminhada', 'recebida_pela_celula', 'contatada', 'sem_resposta', 'agendada', 'visitou', 'integrada', 'convertida_membro', 'nao_convertida', 'reatribuir'];
    return statuses.map(s => ({
      status: s,
      label: STATUS_LABELS[s]?.label || s,
      color: STATUS_LABELS[s]?.color || '',
      count: all.filter(v => v.status === s).length,
      vidas: all.filter(v => v.status === s),
    })).filter(s => s.count > 0);
  }, [novasVidas]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-2">
      {pipeline.map(p => (
        <div key={p.status}>
          <button
            onClick={() => setExpandedStatus(expandedStatus === p.status ? null : p.status)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] ${p.color}`}>{p.label}</Badge>
            </div>
            <span className="text-lg font-bold text-foreground">{p.count}</span>
          </button>
          {expandedStatus === p.status && (
            <div className="ml-4 mt-1 space-y-1">
              {p.vidas.map(nv => (
                <div key={nv.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50 text-xs">
                  <span className="text-foreground">{nv.nome}</span>
                  <span className="text-muted-foreground">{differenceInDays(new Date(), new Date(nv.updated_at))}d</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GargalosView() {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const changeStatus = useChangeNovaVidaStatus();

  const gargalos = useMemo(() => {
    const all = novasVidas || [];
    const SLA_DAYS = 3;
    return [
      {
        label: 'Encaminhadas sem Recebimento',
        description: `> ${SLA_DAYS} dias sem a célula confirmar recebimento`,
        icon: AlertTriangle,
        color: 'text-amber-500',
        vidas: all.filter(v => v.status === 'encaminhada' && differenceInDays(new Date(), new Date(v.updated_at)) > SLA_DAYS),
      },
      {
        label: 'Recebidas sem Contato',
        description: `> ${SLA_DAYS} dias sem contato registrado`,
        icon: Clock,
        color: 'text-red-500',
        vidas: all.filter(v => v.status === 'recebida_pela_celula' && differenceInDays(new Date(), new Date(v.updated_at)) > SLA_DAYS),
      },
      {
        label: 'Sem Resposta',
        description: 'Tentativas feitas sem retorno - considerar reatribuição',
        icon: Phone,
        color: 'text-violet-500',
        vidas: all.filter(v => v.status === 'sem_resposta'),
      },
      {
        label: 'Pedidos de Reatribuição',
        description: 'Líder solicitou reencaminhamento para outra célula',
        icon: RotateCcw,
        color: 'text-orange-500',
        vidas: all.filter(v => v.status === 'reatribuir'),
      },
    ].filter(g => g.vidas.length > 0);
  }, [novasVidas]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!gargalos.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-500" />
          <p className="text-muted-foreground">Nenhum gargalo identificado. Tudo fluindo! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {gargalos.map(g => (
        <Card key={g.label}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <g.icon className={`h-4 w-4 ${g.color}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{g.label} ({g.vidas.length})</p>
                <p className="text-[11px] text-muted-foreground">{g.description}</p>
              </div>
            </div>
            <div className="space-y-1">
              {g.vidas.map(nv => (
                <div key={nv.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-foreground">{nv.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {[nv.bairro, nv.cidade].filter(Boolean).join(', ')} • {differenceInDays(new Date(), new Date(nv.updated_at))}d
                    </p>
                  </div>
                  {nv.status === 'reatribuir' && (
                    <Button
                      size="sm"
                      className="text-[10px] h-8 px-3"
                      onClick={() => changeStatus.mutate({
                        vidaId: nv.id,
                        newStatus: 'nova',
                        actorRole: 'central_celulas',
                        extraData: { assigned_cell_id: null, assigned_to_user_id: null },
                      })}
                    >
                      Recolocar na fila
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FilaNovasVidas({ isPWAMobile }: { isPWAMobile?: boolean }) {
  const { user } = useAuth();
  const { data: novasVidas, isLoading } = useNovasVidas();
  const updateNV = useUpdateNovaVida();
  const [triagemId, setTriagemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fila = (novasVidas || []).filter((nv: any) =>
    nv.status === 'nova' && (!searchTerm || nv.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssumir = async (nv: any) => {
    if (!user) return;
    await supabase.from('novas_vidas').update({
      assigned_to_user_id: user.id,
      status: 'em_triagem',
    } as any).eq('id', nv.id);
    await supabase.from('novas_vidas_events' as any).insert({
      vida_id: nv.id,
      event_type: 'triagem_iniciada',
      actor_user_id: user.id,
    });
    setTriagemId(nv.id);
    updateNV.mutate({ id: nv.id, status: 'em_triagem' } as any);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const emTriagem = (novasVidas || []).filter((nv: any) =>
    nv.status === 'em_triagem' && (nv as any).assigned_to_user_id === user?.id
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12" />
      </div>

      {emTriagem.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Em Triagem (minha)</p>
          {emTriagem.map((nv: any) => (
            <VidaCard key={nv.id} nv={nv} showEncaminhar onEncaminhar={() => setTriagemId(nv.id)} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fila ({fila.length})</p>
        {fila.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" />
              <p className="text-muted-foreground">Nenhuma nova vida na fila.</p>
            </CardContent>
          </Card>
        ) : fila.map((nv: any) => (
          <VidaCard key={nv.id} nv={nv} onAssumir={() => handleAssumir(nv)} />
        ))}
      </div>

      {triagemId && <TriagemDialog vidaId={triagemId} novasVidas={novasVidas || []} onClose={() => setTriagemId(null)} isPWAMobile={isPWAMobile} />}
    </div>
  );
}

function VidaCard({ nv, onAssumir, showEncaminhar, onEncaminhar }: {
  nv: any; onAssumir?: () => void; showEncaminhar?: boolean; onEncaminhar?: () => void;
}) {
  const { data: messages } = useRecomecoMessages(nv.id);
  const hasBV = messages?.some((m: any) => m.status === 'sent_confirmed');

  return (
    <Card className="active:scale-[0.98] transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate text-foreground">{nv.nome}</h3>
              {hasBV ? (
                <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                  <CheckCircle className="h-2.5 w-2.5" />BV
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <MessageCircle className="h-2.5 w-2.5" />S/ BV
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1 text-muted-foreground">
              {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
              {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
              {nv.estado_civil && <span>{nv.estado_civil}</span>}
              {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
            </div>
            {nv.observacao && <p className="text-xs mt-1 text-muted-foreground opacity-60">{nv.observacao}</p>}
          </div>
          {onAssumir && (
            <Button size="sm" onClick={onAssumir} className="shrink-0 gap-1 h-10">
              <UserCheck className="h-3.5 w-3.5" />Assumir
            </Button>
          )}
          {showEncaminhar && onEncaminhar && (
            <Button size="sm" onClick={onEncaminhar} className="shrink-0 gap-1 h-10">
              <ArrowRight className="h-3.5 w-3.5" />Encaminhar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TriagemDialog({ vidaId, novasVidas, onClose, isPWAMobile }: { vidaId: string; novasVidas: any[]; onClose: () => void; isPWAMobile?: boolean }) {
  const { user } = useAuth();
  const nv = novasVidas.find((v: any) => v.id === vidaId);
  const { data: redes } = useRedes();
  const { data: bvMessages } = useRecomecoMessages(vidaId);
  const hasBV = bvMessages?.some((m: any) => m.status === 'sent_confirmed');
  const [filterBairro, setFilterBairro] = useState(nv?.bairro || '');
  const [filterCidade, setFilterCidade] = useState(nv?.cidade || '');
  const [filterRedeId, setFilterRedeId] = useState('');
  const [obs, setObs] = useState('');
  const { data: celulas, isLoading } = useCelulasPublicas({
    bairro: filterBairro || undefined,
    cidade: filterCidade || undefined,
    rede_id: filterRedeId || undefined,
    vidaPerfil: nv ? { estado_civil: nv.estado_civil, faixa_etaria: nv.faixa_etaria } : undefined,
  });
  const createEnc = useCreateEncaminhamento();

  const handleEncaminhar = async (celulaId: string, redeId: string | null) => {
    createEnc.mutate({
      nova_vida_id: vidaId,
      celula_id: celulaId,
      rede_id: redeId,
      encaminhado_por: 'Central de Células',
      notas: obs || null,
    }, {
      onSuccess: async () => {
        await supabase.from('novas_vidas').update({
          status: 'encaminhada',
          assigned_cell_id: celulaId,
        } as any).eq('id', vidaId);

        if (user) {
          await supabase.from('novas_vidas_events' as any).insert({
            vida_id: vidaId,
            event_type: 'status_encaminhada',
            actor_user_id: user.id,
            payload: { celula_id: celulaId, rede_id: redeId, obs, old_status: 'em_triagem', new_status: 'encaminhada', actor_role: 'central_celulas' },
          });
        }
        onClose();
      },
    });
  };

  if (!nv) return null;

  // PWA: fullscreen inline instead of floating dialog
  if (isPWAMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100dvh' }}>
        <header className="flex items-center gap-3 px-4 border-b border-border/30 shrink-0" style={{ minHeight: '48px' }}>
          <button onClick={onClose} className="flex items-center justify-center h-11 w-11 -ml-2 rounded-xl active:bg-accent/60 touch-manipulation">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-sm font-semibold truncate">Triagem: {nv.nome}</h2>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-y-contain p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
                {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                {nv.estado_civil && <span>{nv.estado_civil}</span>}
                {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
              </div>
              {nv.observacao && <p className="text-xs mt-2 text-muted-foreground">{nv.observacao}</p>}
            </CardContent>
          </Card>

          {!hasBV && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">Boas-vindas ainda não enviada. Recomendado enviar antes.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">Observação da triagem</label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Opcional" className="min-h-[48px]" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-primary">Filtrar células</label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Bairro" value={filterBairro} onChange={e => setFilterBairro(e.target.value)} className="h-10 text-xs" />
              <Input placeholder="Cidade" value={filterCidade} onChange={e => setFilterCidade(e.target.value)} className="h-10 text-xs" />
              <Select value={filterRedeId} onValueChange={v => setFilterRedeId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Rede" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {redes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : !celulas?.length ? (
            <p className="text-center text-sm py-8 text-muted-foreground">Nenhuma célula encontrada.</p>
          ) : (
            <div className="grid gap-2">
              {celulas.map(c => (
                <Card key={c.id} className="active:scale-[0.98] transition-all">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate text-foreground">{c.name}</span>
                        {c.rede_name && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            <Network className="h-2.5 w-2.5 mr-1" />{c.rede_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] mt-0.5 text-muted-foreground">
                        {(c.bairro || c.cidade) && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{[c.bairro, c.cidade].filter(Boolean).join(', ')}</span>}
                        {c.meeting_day && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{c.meeting_day}{c.meeting_time ? ` às ${c.meeting_time}` : ''}</span>}
                        <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{c.lideres}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEncaminhar(c.id, c.rede_id)}
                      disabled={createEnc.isPending}
                      className="shrink-0 gap-1 h-10"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />Encaminhar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Desktop: original dialog
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#1e1e22] border-[#C5A059]/20 text-[#F4EDE4] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#F4EDE4' }}>Triagem: {nv.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#B8B6B3' }}>
              {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
              {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
              {nv.estado_civil && <span>{nv.estado_civil}</span>}
              {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
            </div>
            {nv.observacao && <p className="text-xs opacity-60" style={{ color: '#B8B6B3' }}>{nv.observacao}</p>}
          </div>

          {!hasBV && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">Boas-vindas ainda não enviada pelo agente. Recomendado enviar antes de encaminhar.</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#C5A059' }}>Observação da triagem</label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} className="bg-white/5 border-white/10 text-[#F4EDE4]" rows={2} placeholder="Opcional: notas sobre a triagem" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Bairro" value={filterBairro} onChange={e => setFilterBairro(e.target.value)} className="bg-white/5 border-white/10 text-[#F4EDE4] text-xs h-9" />
            <Input placeholder="Cidade" value={filterCidade} onChange={e => setFilterCidade(e.target.value)} className="bg-white/5 border-white/10 text-[#F4EDE4] text-xs h-9" />
            <Select value={filterRedeId} onValueChange={v => setFilterRedeId(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-[#F4EDE4] text-xs h-9"><SelectValue placeholder="Todas redes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as redes</SelectItem>
                {redes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: '#C5A059' }} /></div>
          ) : !celulas?.length ? (
            <p className="text-center text-sm py-8" style={{ color: '#B8B6B3' }}>Nenhuma célula encontrada.</p>
          ) : (
            <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {celulas.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#C5A059]/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate" style={{ color: '#F4EDE4' }}>{c.name}</span>
                      {c.rede_name && (
                        <Badge variant="outline" className="text-[10px] shrink-0 border-[#C5A059]/30 text-[#C5A059]">
                          <Network className="h-2.5 w-2.5 mr-1" />{c.rede_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] mt-0.5" style={{ color: '#B8B6B3' }}>
                      {(c.bairro || c.cidade) && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{[c.bairro, c.cidade].filter(Boolean).join(', ')}</span>}
                      {c.meeting_day && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{c.meeting_day}{c.meeting_time ? ` às ${c.meeting_time}` : ''}</span>}
                      <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{c.lideres}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleEncaminhar(c.id, c.rede_id)}
                    disabled={createEnc.isPending}
                    className="shrink-0 gap-1"
                    style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />Encaminhar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
