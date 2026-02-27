import { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNovasVidas, useCreateNovaVida, NovaVidaInsert, STATUS_LABELS } from '@/hooks/useNovasVidas';
import { useRecomecoMessages } from '@/hooks/useRecomecoAgent';
import { AgentProfileGate } from '@/components/recomeco/AgentProfileGate';
import { BoasVindasWhatsApp } from '@/components/recomeco/BoasVindasWhatsApp';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, UserPlus, MapPin, Phone, ChevronLeft, Loader2, ListChecks, Eye, MessageCircle, CheckCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function RecomecoCadastro() {
  const navigate = useNavigate();
  const { isRecomecoCadastro } = useRole();
  const { user } = useAuth();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;

  if (!isRecomecoCadastro) {
    return <Navigate to="/dashboard" replace />;
  }

  const containerClass = isPWAMobile ? 'flex flex-col h-full' : 'min-h-screen';
  const containerStyle = isPWAMobile ? {} : { background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' };

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={isPWAMobile ? 'flex-1 overflow-y-auto overscroll-y-contain px-4 py-4' : 'max-w-lg mx-auto px-4 py-6 sm:py-10'}>
        {!isPWAMobile && (
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
        )}

        <AgentProfileGate>
          <AgentKPICards userId={user?.id} />
          <Tabs defaultValue="cadastrar" className="w-full">
            <TabsList className={isPWAMobile
              ? 'bg-card border border-border/40 mb-4 w-full'
              : 'bg-white/5 border border-white/10 mb-6 w-full'
            }>
              <TabsTrigger value="cadastrar" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <UserPlus className="h-4 w-4 mr-1.5" />Cadastrar
              </TabsTrigger>
              <TabsTrigger value="minhas" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <ListChecks className="h-4 w-4 mr-1.5" />Minhas
              </TabsTrigger>
              <TabsTrigger value="acompanhamento" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Eye className="h-4 w-4 mr-1.5" />Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cadastrar"><CadastroForm isPWAMobile={isPWAMobile} /></TabsContent>
            <TabsContent value="minhas"><MinhasVidas userId={user?.id} isPWAMobile={isPWAMobile} /></TabsContent>
            <TabsContent value="acompanhamento"><AcompanhamentoVidas userId={user?.id} isPWAMobile={isPWAMobile} /></TabsContent>
          </Tabs>
        </AgentProfileGate>
      </div>
    </div>
  );
}

function AgentKPICards({ userId }: { userId?: string }) {
  const { data: novasVidas } = useNovasVidas();
  const { data: messages } = useRecomecoMessages();

  const stats = useMemo(() => {
    const minhas = (novasVidas || []).filter((nv: any) => nv.created_by_user_id === userId);
    const today = new Date().toISOString().split('T')[0];
    const cadastradasHoje = minhas.filter(nv => nv.created_at?.startsWith(today)).length;
    const myMessages = (messages || []).filter((m: any) => m.agent_user_id === userId);
    const confirmedVidaIds = new Set(myMessages.filter((m: any) => m.status === 'sent_confirmed').map((m: any) => m.vida_id));
    const allVidaIds = new Set(minhas.map(v => v.id));
    const pendentes = [...allVidaIds].filter(id => !confirmedVidaIds.has(id)).length;
    const enviadas = confirmedVidaIds.size;
    return { cadastradasHoje, pendentes, enviadas };
  }, [novasVidas, messages, userId]);

  const cards = [
    { label: 'Hoje', value: stats.cadastradasHoje, icon: UserPlus, color: 'text-green-500' },
    { label: 'BV Pendentes', value: stats.pendentes, icon: MessageCircle, color: 'text-amber-500' },
    { label: 'BV Enviadas', value: stats.enviadas, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
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

interface ExtendedFormData extends NovaVidaInsert {
  idade?: number | null;
  tem_filhos?: boolean;
  rua?: string;
  dias_disponiveis?: string[];
  horario_preferido?: string;
  primeira_vez_igreja?: boolean;
  ja_participou_celula?: boolean;
}

function CadastroForm({ isPWAMobile }: { isPWAMobile?: boolean }) {
  const createMutation = useCreateNovaVida();
  const [form, setForm] = useState<ExtendedFormData>({ nome: '', dias_disponiveis: [] });
  const [lastCreated, setLastCreated] = useState<any>(null);

  const toggleDia = (dia: string) => {
    const current = form.dias_disponiveis || [];
    setForm(p => ({
      ...p,
      dias_disponiveis: current.includes(dia) ? current.filter(d => d !== dia) : [...current, dia],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    createMutation.mutate(form as any, {
      onSuccess: (data) => {
        setLastCreated(data);
        setForm({ nome: '', dias_disponiveis: [] });
      },
    });
  };

  return (
    <div className="space-y-4">
      {lastCreated && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-center text-foreground">
            ✅ {lastCreated.nome} cadastrada com sucesso!
          </div>
          <BoasVindasWhatsApp vida={lastCreated} />
          <Button size="sm" variant="outline" className="w-full h-12" onClick={() => setLastCreated(null)}>
            Cadastrar outra vida
          </Button>
        </div>
      )}

      {!lastCreated && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome + WhatsApp */}
              <div className="space-y-2">
                <Label className="text-primary">Nome *</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="h-12 text-base" placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">WhatsApp</Label>
                <Input value={form.whatsapp || ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="h-12 text-base" placeholder="(81) 99999-9999" inputMode="tel" />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-primary">Bairro</Label>
                  <Input value={form.bairro || ''} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} className="h-12 text-base" />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Cidade</Label>
                  <Input value={form.cidade || ''} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} className="h-12 text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Rua (opcional)</Label>
                <Input value={form.rua || ''} onChange={e => setForm(p => ({ ...p, rua: e.target.value }))} className="h-12 text-base" placeholder="Rua / referência" />
              </div>

              {/* Profile */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-primary">Estado Civil</Label>
                  <Select value={form.estado_civil || ''} onValueChange={v => setForm(p => ({ ...p, estado_civil: v }))}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro(a)">Solteiro(a)</SelectItem>
                      <SelectItem value="casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="divorciado(a)">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo(a)">Viúvo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Faixa Etária</Label>
                  <Select value={form.faixa_etaria || ''} onValueChange={v => setForm(p => ({ ...p, faixa_etaria: v }))}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-primary">Idade</Label>
                  <Input
                    type="number"
                    value={form.idade ?? ''}
                    onChange={e => setForm(p => ({ ...p, idade: e.target.value ? parseInt(e.target.value) : null }))}
                    className="h-12 text-base"
                    placeholder="Ex: 32"
                    inputMode="numeric"
                    min={0}
                    max={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Horário Preferido</Label>
                  <Select value={form.horario_preferido || ''} onValueChange={v => setForm(p => ({ ...p, horario_preferido: v }))}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manhã">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dias disponíveis */}
              <div className="space-y-2">
                <Label className="text-primary">Dias Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        (form.dias_disponiveis || []).includes(dia)
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'bg-muted/30 text-muted-foreground border-border/40'
                      }`}
                    >
                      {dia.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boolean toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Tem filhos</Label>
                  <Switch checked={form.tem_filhos || false} onCheckedChange={v => setForm(p => ({ ...p, tem_filhos: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Primeira vez na igreja</Label>
                  <Switch checked={form.primeira_vez_igreja || false} onCheckedChange={v => setForm(p => ({ ...p, primeira_vez_igreja: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Já participou de célula</Label>
                  <Switch checked={form.ja_participou_celula || false} onCheckedChange={v => setForm(p => ({ ...p, ja_participou_celula: v }))} />
                </div>
              </div>

              {/* Observation */}
              <div className="space-y-2">
                <Label className="text-primary">Observação</Label>
                <Textarea value={form.observacao || ''} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} rows={2} className="min-h-[48px]" />
              </div>

              <Button type="submit" className="w-full h-14 text-base font-semibold" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Cadastrar Nova Vida
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MinhasVidas({ userId, isPWAMobile }: { userId?: string; isPWAMobile?: boolean }) {
  const { data: novasVidas, isLoading } = useNovasVidas();
  const minhas = (novasVidas || []).filter((nv: any) => nv.created_by_user_id === userId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!minhas.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" />
          <p className="text-muted-foreground">Você ainda não cadastrou nenhuma nova vida.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {minhas.map((nv: any) => {
        const st = STATUS_LABELS[nv.status] || { label: nv.status, color: '' };
        const isExpanded = expandedId === nv.id;
        return (
          <div key={nv.id} className="space-y-2">
            <Card className="cursor-pointer active:scale-[0.98] transition-all" onClick={() => setExpandedId(isExpanded ? null : nv.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate text-foreground">{nv.nome}</h3>
                      <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      <BoasVindasWhatsApp vida={nv} compact />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
                      {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {isExpanded && (
              <div className="pl-2">
                <BoasVindasWhatsApp vida={nv} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AcompanhamentoVidas({ userId, isPWAMobile }: { userId?: string; isPWAMobile?: boolean }) {
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
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Encaminhadas', value: encaminhadas.length },
          { label: 'Integradas', value: encaminhadas.filter(v => ['integrada', 'convertida_membro'].includes(v.status)).length },
          { label: 'Reatribuir', value: encaminhadas.filter(v => v.status === 'reatribuir').length },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{k.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {filters.map(f => (
          <Button key={f.value} size="sm" variant={filterStatus === f.value ? 'default' : 'outline'} className="text-xs h-9 shrink-0" onClick={() => setFilterStatus(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      {!minhas.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhuma vida neste filtro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {minhas.map((nv: any) => {
            const st = STATUS_LABELS[nv.status] || { label: nv.status, color: '' };
            const diasDesdeEnc = differenceInDays(new Date(), new Date(nv.updated_at));
            const diasDesdeCadastro = differenceInDays(new Date(), new Date(nv.created_at));

            return (
              <Card key={nv.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate text-foreground">{nv.nome}</h3>
                        <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
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
