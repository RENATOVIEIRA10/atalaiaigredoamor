import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNovasVidas, STATUS_LABELS, useChangeNovaVidaStatus, PIPELINE_STATUSES } from '@/hooks/useNovasVidas';
import { useEncaminhamentos, useCreateEncaminhamento } from '@/hooks/useEncaminhamentos';
import { useCelulasPublicas } from '@/hooks/useCelulasPublicas';
import { useRedes } from '@/hooks/useRedes';
import { useCampo } from '@/contexts/CampoContext';
import { useRecomecoMessages } from '@/hooks/useRecomecoAgent';
import { useAuditProfiles, useMyProfileName } from '@/hooks/useAuditProfiles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rankCelulas, type VidaPerfil } from '@/lib/matchEngine';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Heart, UserPlus, Search, MapPin, Clock, Users, Network,
  ArrowRight, Loader2, Phone, User, ChevronLeft,
  ClipboardList, Send, RotateCcw, AlertTriangle,
  CheckCircle, MessageCircle, UserCheck, Sparkles, Info,
  BarChart3, TrendingUp, Timer,
} from 'lucide-react';

// ─── Tab 1: Recomeço (Entrada de Vidas) ───
function RecomecoTab() {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const [search, setSearch] = useState('');

  const creatorIds = useMemo(() => (novasVidas || []).map(nv => nv.created_by_user_id), [novasVidas]);
  const { data: auditProfiles } = useAuditProfiles(creatorIds);

  // Get all welcome messages for audit
  const allVidaIds = useMemo(() => (novasVidas || []).map(nv => nv.id), [novasVidas]);

  const filtered = useMemo(() => {
    const all = novasVidas || [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(nv => nv.nome.toLowerCase().includes(q));
  }, [novasVidas, search]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Heart className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" /><p className="text-muted-foreground">Nenhuma nova vida encontrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(nv => (
            <VidaCardAudit key={nv.id} nv={nv} auditProfiles={auditProfiles} />
          ))}
        </div>
      )}
    </div>
  );
}

function VidaCardAudit({ nv, auditProfiles }: { nv: any; auditProfiles: Map<string, any> | undefined }) {
  const { data: messages } = useRecomecoMessages(nv.id);
  const hasBV = messages?.some((m: any) => m.status === 'sent_confirmed');
  const bvMessage = messages?.find((m: any) => m.status === 'sent_confirmed' || m.status === 'opened_whatsapp');
  const bvSenderIds = useMemo(() => bvMessage ? [bvMessage.agent_user_id] : [], [bvMessage]);
  const { data: bvProfiles } = useAuditProfiles(bvSenderIds);

  const statusInfo = STATUS_LABELS[nv.status] || { label: nv.status, color: '' };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-sm truncate text-foreground">{nv.nome}</h3>
              <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
              {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
              {nv.estado_civil && <span>{nv.estado_civil}</span>}
              {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
            </div>
            {/* Audit info */}
            <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
              {nv.created_by_user_id && auditProfiles?.get(nv.created_by_user_id) && (
                <p className="flex items-center gap-1"><User className="h-2.5 w-2.5" />Cadastrado por: <strong className="text-foreground">{auditProfiles.get(nv.created_by_user_id)!.name}</strong> — {format(new Date(nv.created_at), "dd/MM HH:mm")}</p>
              )}
              {hasBV && bvMessage && bvProfiles?.get(bvMessage.agent_user_id) && (
                <p className="flex items-center gap-1"><Send className="h-2.5 w-2.5" />BV por: <strong className="text-foreground">{bvProfiles.get(bvMessage.agent_user_id)!.name}</strong> — {format(new Date(bvMessage.created_at), "dd/MM HH:mm")}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab 2: Central de Células (Encaminhamento) ───
function CentralTab() {
  const { user } = useAuth();
  const { data: novasVidas, isLoading } = useNovasVidas();
  const { data: redes } = useRedes();
  const myName = useMyProfileName();
  const [triagemId, setTriagemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const changeStatus = useChangeNovaVidaStatus();

  const prontas = useMemo(() => {
    const all = novasVidas || [];
    const q = search.toLowerCase();
    return all.filter(nv =>
      ['nova', 'em_triagem', 'reatribuir'].includes(nv.status) &&
      (!q || nv.nome.toLowerCase().includes(q))
    );
  }, [novasVidas, search]);

  const creatorIds = useMemo(() => prontas.map(nv => nv.created_by_user_id), [prontas]);
  const { data: auditProfiles } = useAuditProfiles(creatorIds);

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
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar vida..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {prontas.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Heart className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-500" /><p className="text-muted-foreground">Nenhuma vida aguardando encaminhamento 🎉</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {prontas.map(nv => {
            const isReatribuir = nv.status === 'reatribuir';
            return (
              <Card key={nv.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate text-foreground">{nv.nome}</h3>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_LABELS[nv.status]?.color}`}>{STATUS_LABELS[nv.status]?.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
                        {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                      </div>
                      {nv.created_by_user_id && auditProfiles?.get(nv.created_by_user_id) && (
                        <p className="text-[10px] mt-1 text-muted-foreground flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />Cadastrado por: {auditProfiles.get(nv.created_by_user_id)!.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {isReatribuir && (
                        <Button size="sm" variant="outline" className="text-xs h-9"
                          onClick={() => changeStatus.mutate({ vidaId: nv.id, newStatus: 'nova', actorRole: 'lider_recomeco_central', extraData: { assigned_cell_id: null, assigned_to_user_id: null } })}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />Recolocar
                        </Button>
                      )}
                      <Button size="sm" className="text-xs h-9 gap-1" onClick={() => setTriagemId(nv.id)}>
                        <ArrowRight className="h-3.5 w-3.5" />Encaminhar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {triagemId && <EncaminharDialog vidaId={triagemId} novasVidas={novasVidas || []} onClose={() => setTriagemId(null)} />}
    </div>
  );
}

function EncaminharDialog({ vidaId, novasVidas, onClose }: { vidaId: string; novasVidas: any[]; onClose: () => void }) {
  const nv = novasVidas.find((v: any) => v.id === vidaId);
  const { data: redes } = useRedes();
  const myName = useMyProfileName();
  const [filterBairro, setFilterBairro] = useState(nv?.bairro || '');
  const [filterCidade, setFilterCidade] = useState(nv?.cidade || '');
  const [filterRedeId, setFilterRedeId] = useState('');
  const { activeCampoId } = useCampo();
  const { data: celulas, isLoading } = useCelulasPublicas({
    bairro: filterBairro || undefined,
    cidade: filterCidade || undefined,
    rede_id: filterRedeId || undefined,
    campo_id: activeCampoId,
  });
  const createEnc = useCreateEncaminhamento();

  const vidaPerfil: VidaPerfil = nv ? {
    bairro: nv.bairro, cidade: nv.cidade, rua: nv.rua,
    estado_civil: nv.estado_civil, faixa_etaria: nv.faixa_etaria, idade: nv.idade,
    tem_filhos: nv.tem_filhos, dias_disponiveis: nv.dias_disponiveis,
    horario_preferido: nv.horario_preferido, primeira_vez_igreja: nv.primeira_vez_igreja,
    ja_participou_celula: nv.ja_participou_celula,
  } : {} as VidaPerfil;

  const ranked = useMemo(() => celulas ? rankCelulas(vidaPerfil, celulas) : [], [celulas, vidaPerfil]);

  const handleEncaminhar = (celulaId: string, redeId: string | null) => {
    createEnc.mutate({
      nova_vida_id: vidaId,
      celula_id: celulaId,
      rede_id: redeId,
      encaminhado_por: myName || 'Líder Recomeço',
    }, { onSuccess: onClose });
  };

  if (!nv) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Encaminhar {nv.nome}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">
          {(nv.bairro || nv.cidade) && <>Próximo de {[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</>}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Input placeholder="Bairro" value={filterBairro} onChange={e => setFilterBairro(e.target.value)} className="text-xs h-9" />
          <Input placeholder="Cidade" value={filterCidade} onChange={e => setFilterCidade(e.target.value)} className="text-xs h-9" />
          <Select value={filterRedeId} onValueChange={v => setFilterRedeId(v === 'all' ? '' : v)}>
            <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Todas redes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {redes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : ranked.length === 0 ? (
          <p className="text-center text-sm py-8 text-muted-foreground">Nenhuma célula encontrada.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {ranked.map(r => (
              <div key={r.celula.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate text-foreground">{r.celula.name}</span>
                    {r.celula.rede_name && <Badge variant="outline" className="text-[10px] shrink-0"><Network className="h-2.5 w-2.5 mr-1" />{r.celula.rede_name}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-[11px] mt-0.5 text-muted-foreground">
                    {(r.celula.bairro || r.celula.cidade) && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{[r.celula.bairro, r.celula.cidade].filter(Boolean).join(', ')}</span>}
                    {r.celula.meeting_day && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{r.celula.meeting_day}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className={`h-3.5 w-3.5 ${r.score >= 70 ? 'text-green-500' : r.score >= 40 ? 'text-amber-500' : 'text-red-400'}`} />
                    <span className={`text-sm font-bold ${r.score >= 70 ? 'text-green-500' : r.score >= 40 ? 'text-amber-500' : 'text-red-400'}`}>{r.score}%</span>
                    <Progress value={r.score} className="h-1.5 flex-1" />
                  </div>
                </div>
                <Button size="sm" onClick={() => handleEncaminhar(r.celula.id, r.celula.rede_id)} disabled={createEnc.isPending} className="shrink-0 gap-1">
                  <ArrowRight className="h-3.5 w-3.5" />Encaminhar
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 3: Acompanhamento (Funil Completo) ───
function AcompanhamentoTab() {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const creatorIds = useMemo(() => (novasVidas || []).map(nv => nv.created_by_user_id), [novasVidas]);
  const { data: auditProfiles } = useAuditProfiles(creatorIds);

  const { data: encaminhamentos } = useEncaminhamentos();
  const encByVida = useMemo(() => {
    const map = new Map<string, any>();
    (encaminhamentos || []).forEach(e => map.set(e.nova_vida_id, e));
    return map;
  }, [encaminhamentos]);

  const pipeline = useMemo(() => {
    const all = novasVidas || [];
    return PIPELINE_STATUSES.map(s => ({
      status: s,
      label: STATUS_LABELS[s]?.label || s,
      color: STATUS_LABELS[s]?.color || '',
      count: all.filter(v => v.status === s).length,
      vidas: all.filter(v => v.status === s),
    })).filter(s => s.count > 0);
  }, [novasVidas]);

  const totals = useMemo(() => {
    const all = novasVidas || [];
    return {
      total: all.length,
      convertidos: all.filter(v => v.status === 'convertida_membro').length,
      integrados: all.filter(v => v.status === 'integrada').length,
      pendentes: all.filter(v => !['convertida_membro', 'nao_convertida', 'integrada'].includes(v.status)).length,
    };
  }, [novasVidas]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Total" value={totals.total} icon={Users} />
        <MiniStat label="Em Andamento" value={totals.pendentes} icon={Clock} />
        <MiniStat label="Integradas" value={totals.integrados} icon={CheckCircle} color="text-green-500" />
        <MiniStat label="Membros" value={totals.convertidos} icon={UserPlus} color="text-emerald-500" />
      </div>

      {/* Pipeline */}
      <div className="space-y-2">
        {pipeline.map(p => (
          <div key={p.status}>
            <button onClick={() => setExpandedStatus(expandedStatus === p.status ? null : p.status)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 active:scale-[0.98] transition-all">
              <Badge variant="outline" className={`text-[10px] ${p.color}`}>{p.label}</Badge>
              <span className="text-lg font-bold text-foreground">{p.count}</span>
            </button>
            {expandedStatus === p.status && (
              <div className="ml-4 mt-1 space-y-1">
                {p.vidas.map(nv => {
                  const enc = encByVida.get(nv.id);
                  return (
                    <div key={nv.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50 text-xs">
                      <div className="min-w-0">
                        <span className="text-foreground">{nv.nome}</span>
                        {enc?.celula?.name && <span className="text-muted-foreground ml-2">→ {enc.celula.name}</span>}
                        {enc?.encaminhado_por && <span className="text-[10px] text-muted-foreground ml-2">(por {enc.encaminhado_por})</span>}
                      </div>
                      <span className="text-muted-foreground">{differenceInDays(new Date(), new Date(nv.updated_at))}d</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <Icon className={`h-4 w-4 mx-auto mb-1 ${color || 'text-primary'}`} />
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ─── Tab 4: Auditoria Operacional ───
function AuditoriaTab() {
  const { data: novasVidas } = useNovasVidas();
  const { data: events, isLoading } = useQuery({
    queryKey: ['all_novas_vidas_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novas_vidas_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const actorIds = useMemo(() => [...new Set((events || []).map(e => e.actor_user_id))], [events]);
  const { data: auditProfiles } = useAuditProfiles(actorIds);

  const operatorStats = useMemo(() => {
    const map = new Map<string, { cadastros: number; bv: number; encaminhamentos: number; statusUpdates: number }>();
    (events || []).forEach(e => {
      const id = e.actor_user_id;
      if (!map.has(id)) map.set(id, { cadastros: 0, bv: 0, encaminhamentos: 0, statusUpdates: 0 });
      const s = map.get(id)!;
      if (e.event_type === 'cadastro') s.cadastros++;
      else if (e.event_type === 'boas_vindas_whatsapp') s.bv++;
      else if (e.event_type === 'status_encaminhada' || e.event_type === 'triagem_iniciada') s.encaminhamentos++;
      else s.statusUpdates++;
    });
    return Array.from(map.entries())
      .map(([id, stats]) => ({ id, name: auditProfiles?.get(id)?.name || 'Desconhecido', email: auditProfiles?.get(id)?.email || '', ...stats }))
      .sort((a, b) => (b.cadastros + b.bv + b.encaminhamentos) - (a.cadastros + a.bv + a.encaminhamentos));
  }, [events, auditProfiles]);

  // Tempo médio entre etapas
  const avgTimes = useMemo(() => {
    const all = novasVidas || [];
    const evs = events || [];
    // cadastro → boas_vindas
    const bvTimes: number[] = [];
    const encTimes: number[] = [];
    all.forEach(nv => {
      const vidaEvents = evs.filter(e => e.vida_id === nv.id);
      const cadastro = vidaEvents.find(e => e.event_type === 'cadastro');
      const bv = vidaEvents.find(e => e.event_type === 'boas_vindas_whatsapp');
      const enc = vidaEvents.find(e => e.event_type === 'status_encaminhada');
      if (cadastro && bv) {
        const diff = (new Date(bv.created_at).getTime() - new Date(cadastro.created_at).getTime()) / (1000 * 60 * 60);
        bvTimes.push(diff);
      }
      if (bv && enc) {
        const diff = (new Date(enc.created_at).getTime() - new Date(bv.created_at).getTime()) / (1000 * 60 * 60);
        encTimes.push(diff);
      }
    });
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
    return {
      cadastroBV: avg(bvTimes),
      bvEncaminhamento: avg(encTimes),
    };
  }, [novasVidas, events]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Tempo médio */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Timer className="h-4 w-4 text-primary" />Tempo Médio entre Etapas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cadastro → Boas-vindas</span>
            <span className="font-bold text-foreground">{avgTimes.cadastroBV !== null ? `${avgTimes.cadastroBV}h` : '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Boas-vindas → Encaminhamento</span>
            <span className="font-bold text-foreground">{avgTimes.bvEncaminhamento !== null ? `${avgTimes.bvEncaminhamento}h` : '—'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Ranking por operador */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Ranking por Operador</CardTitle></CardHeader>
        <CardContent>
          {operatorStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento registrado.</p>
          ) : (
            <div className="space-y-3">
              {operatorStats.map((op, i) => (
                <div key={op.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <span className="text-lg font-bold text-primary w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{op.name}</p>
                    {op.email && <p className="text-[10px] text-muted-foreground truncate">{op.email}</p>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="text-center"><span className="block text-sm font-bold text-foreground">{op.cadastros}</span>Cadastros</div>
                    <div className="text-center"><span className="block text-sm font-bold text-foreground">{op.bv}</span>BV</div>
                    <div className="text-center"><span className="block text-sm font-bold text-foreground">{op.encaminhamentos}</span>Encam.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ───
export default function LiderRecomecoCentralDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/trocar-funcao')} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Heart className="h-6 w-6 text-primary" />
            Recomeço + Central
          </h1>
          <p className="text-xs text-muted-foreground">Dashboard consolidado do Líder</p>
        </div>
      </div>

      <Tabs defaultValue="recomeco" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="recomeco" className="text-xs">
            <Heart className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Recomeço
          </TabsTrigger>
          <TabsTrigger value="central" className="text-xs">
            <Network className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Central
          </TabsTrigger>
          <TabsTrigger value="acompanhamento" className="text-xs">
            <TrendingUp className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Funil
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recomeco"><RecomecoTab /></TabsContent>
        <TabsContent value="central"><CentralTab /></TabsContent>
        <TabsContent value="acompanhamento"><AcompanhamentoTab /></TabsContent>
        <TabsContent value="auditoria"><AuditoriaTab /></TabsContent>
      </Tabs>
    </div>
  );
}
