import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useNovasVidas, useCreateNovaVida, useUpdateNovaVida, NovaVidaInsert } from '@/hooks/useNovasVidas';
import { useEncaminhamentos, useCreateEncaminhamento, useUpdateEncaminhamento } from '@/hooks/useEncaminhamentos';
import { useCelulasPublicas } from '@/hooks/useCelulasPublicas';
import { useRedes } from '@/hooks/useRedes';
import { useAuditProfiles, useMyProfileName } from '@/hooks/useAuditProfiles';
import { useRecomecoMessages } from '@/hooks/useRecomecoAgent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, UserPlus, Search, MapPin, Clock, Users, Network, ArrowRight, Loader2, Phone, ChevronLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nova: { label: 'Nova', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  encaminhada: { label: 'Encaminhada', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  contatado: { label: 'Contatado', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  integrado: { label: 'Integrado', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  recusado: { label: 'Recusado', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  pendente: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

export default function Recomeco() {
  const navigate = useNavigate();
  const { scopeType, isRecomecoOperador, isRecomecoLeitura, isPastor, isAdmin } = useRole();
  const canManage = isRecomecoOperador || isPastor || isAdmin;
  const canView = canManage || isRecomecoLeitura;

  if (!canView) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-5 w-5" style={{ color: '#B8B6B3' }} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2" style={{ color: '#F4EDE4', fontFamily: "'Outfit', sans-serif" }}>
              <Heart className="h-6 w-6" style={{ color: '#C5A059' }} />
              Recomeço — Novas Vidas
            </h1>
            <p className="text-xs mt-1" style={{ color: '#B8B6B3' }}>
              Acolhimento e encaminhamento de novas vidas para células de todas as redes
            </p>
          </div>
        </div>

        <Tabs defaultValue="novas-vidas" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="novas-vidas" className="data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              Novas Vidas
            </TabsTrigger>
            <TabsTrigger value="encaminhamentos" className="data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              Encaminhamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="novas-vidas">
            <NovasVidasTab canManage={canManage} />
          </TabsContent>
          <TabsContent value="encaminhamentos">
            <EncaminhamentosTab canManage={canManage} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NovasVidasTab({ canManage }: { canManage: boolean }) {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const [showForm, setShowForm] = useState(false);
  const [showEncaminhar, setShowEncaminhar] = useState<string | null>(null);

  // Resolve audit names
  const creatorIds = useMemo(() => (novasVidas || []).map(nv => nv.created_by_user_id), [novasVidas]);
  const { data: auditProfiles } = useAuditProfiles(creatorIds);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}>
                <UserPlus className="h-4 w-4" />
                Cadastrar Nova Vida
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e22] border-[#C5A059]/20 text-[#F4EDE4] max-w-md">
              <DialogHeader>
                <DialogTitle style={{ color: '#F4EDE4' }}>Cadastrar Nova Vida</DialogTitle>
              </DialogHeader>
              <NovaVidaForm onSuccess={() => setShowForm(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} />
        </div>
      ) : !novasVidas?.length ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#C5A059' }} />
            <p style={{ color: '#B8B6B3' }}>Nenhuma nova vida cadastrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {novasVidas.map(nv => (
            <Card key={nv.id} className="bg-white/5 border-white/10 hover:border-[#C5A059]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate" style={{ color: '#F4EDE4' }}>{nv.nome}</h3>
                      <StatusBadge status={nv.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#B8B6B3' }}>
                      {nv.whatsapp && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>
                      )}
                      {(nv.bairro || nv.cidade) && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>
                      )}
                      {nv.estado_civil && <span>{nv.estado_civil}</span>}
                      {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
                    </div>
                    {nv.created_by_user_id && auditProfiles?.get(nv.created_by_user_id) && (
                      <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#B8B6B3' }}>
                        <User className="h-2.5 w-2.5" />
                        Cadastrado por: {auditProfiles.get(nv.created_by_user_id)!.name}
                      </p>
                    )}
                  </div>
                  {canManage && nv.status === 'nova' && (
                    <Dialog open={showEncaminhar === nv.id} onOpenChange={(o) => setShowEncaminhar(o ? nv.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1 shrink-0 border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10">
                          <ArrowRight className="h-3.5 w-3.5" />
                          Encaminhar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1e1e22] border-[#C5A059]/20 text-[#F4EDE4] max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle style={{ color: '#F4EDE4' }}>Encaminhar {nv.nome}</DialogTitle>
                        </DialogHeader>
                        <EncaminharForm novaVidaId={nv.id} novaVidaNome={nv.nome} bairro={nv.bairro} cidade={nv.cidade} onSuccess={() => setShowEncaminhar(null)} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NovaVidaForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateNovaVida();
  const [form, setForm] = useState<NovaVidaInsert>({ nome: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    createMutation.mutate(form, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label style={{ color: '#C5A059' }}>Nome *</Label>
        <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" placeholder="Nome completo" required />
      </div>
      <div className="space-y-2">
        <Label style={{ color: '#C5A059' }}>WhatsApp</Label>
        <Input value={form.whatsapp || ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" placeholder="(11) 99999-9999" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label style={{ color: '#C5A059' }}>Bairro</Label>
          <Input value={form.bairro || ''} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" />
        </div>
        <div className="space-y-2">
          <Label style={{ color: '#C5A059' }}>Cidade</Label>
          <Input value={form.cidade || ''} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label style={{ color: '#C5A059' }}>Estado Civil</Label>
          <Select value={form.estado_civil || ''} onValueChange={v => setForm(p => ({ ...p, estado_civil: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-[#F4EDE4]"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solteiro(a)">Solteiro(a)</SelectItem>
              <SelectItem value="casado(a)">Casado(a)</SelectItem>
              <SelectItem value="divorciado(a)">Divorciado(a)</SelectItem>
              <SelectItem value="viuvo(a)">Viúvo(a)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label style={{ color: '#C5A059' }}>Faixa Etária</Label>
          <Select value={form.faixa_etaria || ''} onValueChange={v => setForm(p => ({ ...p, faixa_etaria: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-[#F4EDE4]"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="18-25">18-25</SelectItem>
              <SelectItem value="26-35">26-35</SelectItem>
              <SelectItem value="36-45">36-45</SelectItem>
              <SelectItem value="46-55">46-55</SelectItem>
              <SelectItem value="56+">56+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label style={{ color: '#C5A059' }}>Observação</Label>
        <Textarea value={form.observacao || ''} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={createMutation.isPending} style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}>
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Cadastrar
      </Button>
    </form>
  );
}

function EncaminharForm({ novaVidaId, novaVidaNome, bairro, cidade, onSuccess }: { novaVidaId: string; novaVidaNome: string; bairro: string | null; cidade: string | null; onSuccess: () => void }) {
  const { data: redes } = useRedes();
  const myName = useMyProfileName();
  const [filterBairro, setFilterBairro] = useState(bairro || '');
  const [filterCidade, setFilterCidade] = useState(cidade || '');
  const [filterRedeId, setFilterRedeId] = useState('');
  const { data: celulas, isLoading } = useCelulasPublicas({
    bairro: filterBairro || undefined,
    cidade: filterCidade || undefined,
    rede_id: filterRedeId || undefined,
  });
  const createEnc = useCreateEncaminhamento();

  const handleEncaminhar = (celulaId: string, redeId: string | null) => {
    createEnc.mutate({
      nova_vida_id: novaVidaId,
      celula_id: celulaId,
      rede_id: redeId,
      encaminhado_por: myName || 'Operador Recomeço',
    }, { onSuccess });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: '#B8B6B3' }}>
        Sugerindo células para <strong style={{ color: '#F4EDE4' }}>{novaVidaNome}</strong>
        {(bairro || cidade) && <> — próximo de {[bairro, cidade].filter(Boolean).join(', ')}</>}
      </p>

      {/* Filters */}
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

      {/* Cell list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: '#C5A059' }} /></div>
      ) : !celulas?.length ? (
        <p className="text-center text-sm py-8" style={{ color: '#B8B6B3' }}>Nenhuma célula encontrada com os filtros atuais.</p>
      ) : (
        <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-1">
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
                  {(c.bairro || c.cidade) && (
                    <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{[c.bairro, c.cidade].filter(Boolean).join(', ')}</span>
                  )}
                  {c.meeting_day && (
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{c.meeting_day}{c.meeting_time ? ` às ${c.meeting_time}` : ''}</span>
                  )}
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
                <ArrowRight className="h-3.5 w-3.5" />
                Encaminhar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EncaminhamentosTab({ canManage }: { canManage: boolean }) {
  const { data: encaminhamentos, isLoading } = useEncaminhamentos();
  const updateEnc = useUpdateEncaminhamento();

  const handleStatusChange = (id: string, newStatus: string) => {
    updateEnc.mutate({ id, status: newStatus } as any);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} /></div>;
  }

  if (!encaminhamentos?.length) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <ArrowRight className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#C5A059' }} />
          <p style={{ color: '#B8B6B3' }}>Nenhum encaminhamento registrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {encaminhamentos.map(enc => (
        <Card key={enc.id} className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm" style={{ color: '#F4EDE4' }}>{enc.nova_vida?.nome || '—'}</h3>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: '#C5A059' }} />
                  <span className="text-sm truncate" style={{ color: '#F4EDE4' }}>{enc.celula?.name || '—'}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: '#B8B6B3' }}>
                  {enc.rede?.name && <span className="flex items-center gap-1"><Network className="h-2.5 w-2.5" />{enc.rede.name}</span>}
                  <span>{new Date(enc.data_encaminhamento).toLocaleDateString('pt-BR')}</span>
                  {enc.encaminhado_por && <span>por {enc.encaminhado_por}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={enc.status} />
                {canManage && (
                  <Select value={enc.status} onValueChange={v => handleStatusChange(enc.id, v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-[#F4EDE4] text-xs h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                      <SelectItem value="integrado">Integrado</SelectItem>
                      <SelectItem value="recusado">Recusado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || { label: status, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
  return <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.label}</Badge>;
}
