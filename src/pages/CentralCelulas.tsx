import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNovasVidas, useUpdateNovaVida } from '@/hooks/useNovasVidas';
import { useCreateEncaminhamento } from '@/hooks/useEncaminhamentos';
import { useCelulasPublicas } from '@/hooks/useCelulasPublicas';
import { useRedes } from '@/hooks/useRedes';
import { supabase } from '@/integrations/supabase/client';
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
} from 'lucide-react';

export default function CentralCelulas() {
  const navigate = useNavigate();
  const { isCentralCelulas } = useRole();

  if (!isCentralCelulas) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/trocar-funcao')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-5 w-5" style={{ color: '#B8B6B3' }} />
          </button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#F4EDE4', fontFamily: "'Outfit', sans-serif" }}>
              <Users className="h-5 w-5" style={{ color: '#C5A059' }} />
              Central de Células
            </h1>
            <p className="text-xs mt-1" style={{ color: '#B8B6B3' }}>Triagem e encaminhamento de novas vidas para células</p>
          </div>
        </div>

        <Tabs defaultValue="fila" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6 w-full">
            <TabsTrigger value="fila" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <ClipboardList className="h-4 w-4 mr-1.5" />Fila
            </TabsTrigger>
            <TabsTrigger value="encaminhadas" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <ArrowRight className="h-4 w-4 mr-1.5" />Encaminhadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fila">
            <FilaNovasVidas />
          </TabsContent>
          <TabsContent value="encaminhadas">
            <EncaminhadasList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilaNovasVidas() {
  const { user } = useAuth();
  const { data: novasVidas, isLoading } = useNovasVidas();
  const updateNV = useUpdateNovaVida();
  const [triagemId, setTriagemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Show vidas with status 'nova' (not yet triaged/encaminhada)
  const fila = (novasVidas || []).filter((nv: any) =>
    nv.status === 'nova' && (!searchTerm || nv.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssumir = async (nv: any) => {
    if (!user) return;
    // Set assigned_to and change status to em_triagem
    await supabase.from('novas_vidas').update({
      assigned_to_user_id: user.id,
      status: 'em_triagem',
    } as any).eq('id', nv.id);

    // Audit event
    await supabase.from('novas_vidas_events' as any).insert({
      vida_id: nv.id,
      event_type: 'triagem_iniciada',
      actor_user_id: user.id,
    });

    setTriagemId(nv.id);
    // Refresh
    updateNV.mutate({ id: nv.id, status: 'em_triagem' } as any);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} /></div>;
  }

  // Also show vidas in triagem by this user
  const emTriagem = (novasVidas || []).filter((nv: any) =>
    nv.status === 'em_triagem' && (nv as any).assigned_to_user_id === user?.id
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B8B6B3' }} />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-[#F4EDE4]"
        />
      </div>

      {/* Em triagem by me */}
      {emTriagem.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#C5A059' }}>Em Triagem (minha)</p>
          {emTriagem.map((nv: any) => (
            <VidaCard key={nv.id} nv={nv} showEncaminhar onEncaminhar={() => setTriagemId(nv.id)} />
          ))}
        </div>
      )}

      {/* Fila */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#B8B6B3' }}>Fila ({fila.length})</p>
        </div>
        {fila.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#C5A059' }} />
              <p style={{ color: '#B8B6B3' }}>Nenhuma nova vida na fila.</p>
            </CardContent>
          </Card>
        ) : (
          fila.map((nv: any) => (
            <VidaCard key={nv.id} nv={nv} onAssumir={() => handleAssumir(nv)} />
          ))
        )}
      </div>

      {/* Triagem Dialog */}
      {triagemId && (
        <TriagemDialog
          vidaId={triagemId}
          novasVidas={novasVidas || []}
          onClose={() => setTriagemId(null)}
        />
      )}
    </div>
  );
}

function VidaCard({ nv, onAssumir, showEncaminhar, onEncaminhar }: {
  nv: any;
  onAssumir?: () => void;
  showEncaminhar?: boolean;
  onEncaminhar?: () => void;
}) {
  return (
    <Card className="bg-white/5 border-white/10 hover:border-[#C5A059]/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: '#F4EDE4' }}>{nv.nome}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1" style={{ color: '#B8B6B3' }}>
              {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
              {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
              {nv.estado_civil && <span>{nv.estado_civil}</span>}
              {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
            </div>
            {nv.observacao && <p className="text-xs mt-1 opacity-60" style={{ color: '#B8B6B3' }}>{nv.observacao}</p>}
          </div>
          {onAssumir && (
            <Button size="sm" onClick={onAssumir} className="shrink-0 gap-1" style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}>
              <UserCheck className="h-3.5 w-3.5" />Assumir
            </Button>
          )}
          {showEncaminhar && onEncaminhar && (
            <Button size="sm" onClick={onEncaminhar} className="shrink-0 gap-1" style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}>
              <ArrowRight className="h-3.5 w-3.5" />Encaminhar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TriagemDialog({ vidaId, novasVidas, onClose }: {
  vidaId: string;
  novasVidas: any[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const nv = novasVidas.find((v: any) => v.id === vidaId);
  const { data: redes } = useRedes();
  const [filterBairro, setFilterBairro] = useState(nv?.bairro || '');
  const [filterCidade, setFilterCidade] = useState(nv?.cidade || '');
  const [filterRedeId, setFilterRedeId] = useState('');
  const [obs, setObs] = useState('');
  const { data: celulas, isLoading } = useCelulasPublicas({
    bairro: filterBairro || undefined,
    cidade: filterCidade || undefined,
    rede_id: filterRedeId || undefined,
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
        // Update vida status + assigned_cell_id
        await supabase.from('novas_vidas').update({
          status: 'encaminhada',
          assigned_cell_id: celulaId,
        } as any).eq('id', vidaId);

        // Audit event
        if (user) {
          await supabase.from('novas_vidas_events' as any).insert({
            vida_id: vidaId,
            event_type: 'encaminhamento',
            actor_user_id: user.id,
            payload: { celula_id: celulaId, rede_id: redeId, obs },
          });
        }

        onClose();
      },
    });
  };

  if (!nv) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#1e1e22] border-[#C5A059]/20 text-[#F4EDE4] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#F4EDE4' }}>Triagem: {nv.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vida info */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#B8B6B3' }}>
              {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
              {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
              {nv.estado_civil && <span>{nv.estado_civil}</span>}
              {nv.faixa_etaria && <span>{nv.faixa_etaria}</span>}
            </div>
            {nv.observacao && <p className="text-xs opacity-60" style={{ color: '#B8B6B3' }}>{nv.observacao}</p>}
          </div>

          {/* Observação da Central */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#C5A059' }}>Observação da triagem</label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} className="bg-white/5 border-white/10 text-[#F4EDE4]" rows={2} placeholder="Opcional: notas sobre a triagem" />
          </div>

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

          {/* Cell suggestions */}
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
                    <ArrowRight className="h-3.5 w-3.5" />
                    Encaminhar
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

function EncaminhadasList() {
  const { data: novasVidas, isLoading } = useNovasVidas();

  const encaminhadas = (novasVidas || []).filter((nv: any) =>
    ['encaminhada', 'contatado', 'integrado', 'integrada', 'em_triagem'].includes(nv.status)
  );

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} /></div>;
  }

  const STATUS_COLORS: Record<string, string> = {
    em_triagem: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    encaminhada: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    contatado: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    integrado: 'bg-green-500/20 text-green-300 border-green-500/30',
    integrada: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  if (!encaminhadas.length) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <ArrowRight className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#C5A059' }} />
          <p style={{ color: '#B8B6B3' }}>Nenhuma vida encaminhada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {encaminhadas.map((nv: any) => (
        <Card key={nv.id} className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate" style={{ color: '#F4EDE4' }}>{nv.nome}</h3>
                <div className="flex flex-wrap gap-x-3 text-xs mt-0.5" style={{ color: '#B8B6B3' }}>
                  {(nv.bairro || nv.cidade) && <span>{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_COLORS[nv.status] || 'bg-white/10 text-white/60 border-white/20'}`}>
                {nv.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
