import { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNovasVidas, useCreateNovaVida, NovaVidaInsert, STATUS_LABELS } from '@/hooks/useNovasVidas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, UserPlus, MapPin, Phone, ChevronLeft, Loader2, ListChecks, Eye, Filter } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function RecomecoCadastro() {
  const navigate = useNavigate();
  const { isRecomecoCadastro } = useRole();
  const { user } = useAuth();

  if (!isRecomecoCadastro) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/trocar-funcao')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-5 w-5" style={{ color: '#B8B6B3' }} />
          </button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#F4EDE4', fontFamily: "'Outfit', sans-serif" }}>
              <Heart className="h-5 w-5" style={{ color: '#C5A059' }} />
              Recomeço — Cadastro
            </h1>
            <p className="text-xs mt-1" style={{ color: '#B8B6B3' }}>Cadastrar novas vidas e acompanhar status</p>
          </div>
        </div>

        <Tabs defaultValue="cadastrar" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6 w-full">
            <TabsTrigger value="cadastrar" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <UserPlus className="h-4 w-4 mr-1.5" />Cadastrar
            </TabsTrigger>
            <TabsTrigger value="minhas" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <ListChecks className="h-4 w-4 mr-1.5" />Minhas Vidas
            </TabsTrigger>
            <TabsTrigger value="acompanhamento" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <Eye className="h-4 w-4 mr-1.5" />Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastrar"><CadastroForm /></TabsContent>
          <TabsContent value="minhas"><MinhasVidas userId={user?.id} /></TabsContent>
          <TabsContent value="acompanhamento"><AcompanhamentoVidas userId={user?.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CadastroForm() {
  const createMutation = useCreateNovaVida();
  const [form, setForm] = useState<NovaVidaInsert>({ nome: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setForm({ nome: '' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      },
    });
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-5">
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm text-center">
            ✅ Vida cadastrada com sucesso! Já aparece na Central de Células.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" placeholder="Nome completo" required />
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>WhatsApp</Label>
            <Input value={form.whatsapp || ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" placeholder="(81) 99999-9999" />
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
          <Button type="submit" className="w-full h-11" disabled={createMutation.isPending} style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Cadastrar Nova Vida
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MinhasVidas({ userId }: { userId?: string }) {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const minhas = (novasVidas || []).filter((nv: any) => nv.created_by_user_id === userId);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} /></div>;
  }

  if (!minhas.length) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#C5A059' }} />
          <p style={{ color: '#B8B6B3' }}>Você ainda não cadastrou nenhuma nova vida.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {minhas.map((nv: any) => {
        const st = STATUS_LABELS[nv.status] || { label: nv.status, color: 'bg-white/10 text-white/60 border-white/20' };
        return (
          <Card key={nv.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate" style={{ color: '#F4EDE4' }}>{nv.nome}</h3>
                    <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#B8B6B3' }}>
                    {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
                    {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AcompanhamentoVidas({ userId }: { userId?: string }) {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const minhas = useMemo(() => {
    const all = (novasVidas || []).filter((nv: any) => nv.created_by_user_id === userId);
    if (filterStatus === 'all') return all;
    return all.filter((nv: any) => nv.status === filterStatus);
  }, [novasVidas, userId, filterStatus]);

  const encaminhadas = (novasVidas || []).filter((nv: any) => nv.created_by_user_id === userId && !['nova', 'em_triagem'].includes(nv.status));

  const filters = [
    { value: 'all', label: 'Todas' },
    { value: 'sem_resposta', label: 'Sem Resposta' },
    { value: 'encaminhada', label: 'Aguardando' },
    { value: 'integrada', label: 'Integradas' },
    { value: 'reatribuir', label: 'Reatribuir' },
  ];

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} /></div>;
  }

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Encaminhadas', value: encaminhadas.length },
          { label: 'Integradas', value: encaminhadas.filter(v => ['integrada', 'convertida_membro'].includes(v.status)).length },
          { label: 'Reatribuir', value: encaminhadas.filter(v => v.status === 'reatribuir').length },
        ].map(k => (
          <Card key={k.label} className="bg-white/5 border-white/10">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: '#F4EDE4' }}>{k.value}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#B8B6B3' }}>{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filterStatus === f.value ? 'default' : 'outline'}
            className="text-xs h-7"
            onClick={() => setFilterStatus(f.value)}
            style={filterStatus === f.value ? { background: '#C5A059', color: '#1A2F4B' } : {}}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {!minhas.length ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-8 text-center">
            <p style={{ color: '#B8B6B3' }}>Nenhuma vida neste filtro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {minhas.map((nv: any) => {
            const st = STATUS_LABELS[nv.status] || { label: nv.status, color: '' };
            const diasDesdeEnc = differenceInDays(new Date(), new Date(nv.updated_at));
            const diasDesdeCadastro = differenceInDays(new Date(), new Date(nv.created_at));

            return (
              <Card key={nv.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate" style={{ color: '#F4EDE4' }}>{nv.nome}</h3>
                        <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: '#B8B6B3' }}>
                        {(nv.bairro || nv.cidade) && <span><MapPin className="h-2.5 w-2.5 inline mr-0.5" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                        <span>Cadastro: {diasDesdeCadastro}d atrás</span>
                        <span>Último status: {diasDesdeEnc}d atrás</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
