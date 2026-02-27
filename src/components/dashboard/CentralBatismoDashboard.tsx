import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useActiveEvents, useEventRegistrations, useCreateEventRegistration,
  useUpdateRegistrationStatus, type SpiritualEvent,
} from '@/hooks/useEventsSpiritual';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Loader2, ChevronLeft, Droplets, Plus, Users, CheckCircle,
  Clock, XCircle, UserPlus, AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  inscrito: { label: 'Inscrito', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  pendente: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  aprovado: { label: 'Aprovado', color: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30' },
  realizado: { label: 'Realizado', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  recusado: { label: 'Recusado', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
};

export default function CentralBatismoDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: events, isLoading: eventsLoading } = useActiveEvents();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const activeEventId = selectedEventId || events?.[0]?.id || '';
  const { data: registrations, isLoading: regsLoading } = useEventRegistrations(activeEventId || undefined);
  const updateStatus = useUpdateRegistrationStatus();
  const createReg = useCreateEventRegistration();

  // New registration form state
  const [regName, setRegName] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regType, setRegType] = useState<'vida' | 'membro'>('vida');

  // Get operator name
  const { data: profile } = useQuery({
    queryKey: ['my-profile-name', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!registrations) return [];
    const q = search.toLowerCase();
    return q ? registrations.filter(r => r.full_name.toLowerCase().includes(q)) : registrations;
  }, [registrations, search]);

  const stats = useMemo(() => {
    const all = registrations || [];
    return {
      total: all.length,
      inscritos: all.filter(r => r.status === 'inscrito').length,
      realizados: all.filter(r => r.status === 'realizado').length,
      semCelula: all.filter(r => !r.celula_id).length,
    };
  }, [registrations]);

  const handleRegister = () => {
    if (!regName.trim() || !activeEventId) return;
    createReg.mutate({
      event_id: activeEventId,
      person_type: regType,
      vida_id: null,
      membro_id: null,
      full_name: regName.trim(),
      whatsapp: regWhatsapp || null,
      celula_id: null,
      rede_id: null,
      created_by_user_id: user?.id || null,
      created_by_name: profile?.name || 'Central Batismo',
    } as any, {
      onSuccess: () => {
        setShowRegister(false);
        setRegName('');
        setRegWhatsapp('');
      },
    });
  };

  const handleStatusChange = (regId: string, status: string) => {
    updateStatus.mutate({ id: regId, status });
  };

  if (eventsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/trocar-funcao')} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Droplets className="h-6 w-6 text-primary" />
            Central do Batismo / Aclamação
          </h1>
          <p className="text-xs text-muted-foreground">Cadastrar e acompanhar inscrições</p>
        </div>
        <Button size="sm" onClick={() => setShowRegister(true)} className="gap-1" disabled={!activeEventId}>
          <UserPlus className="h-4 w-4" />
          Inscrever
        </Button>
      </div>

      {/* Event Selector */}
      {events && events.length > 0 && (
        <Select value={activeEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um evento" />
          </SelectTrigger>
          <SelectContent>
            {events.map(ev => (
              <SelectItem key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.event_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!events?.length ? (
        <EmptyState icon={Droplets} title="Nenhum evento futuro" description="Aguarde a criação de um evento pelo líder." />
      ) : !activeEventId ? (
        <EmptyState icon={Droplets} title="Selecione um evento" description="Escolha um evento para ver os inscritos." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini icon={Users} label="Total" value={stats.total} />
            <StatMini icon={Clock} label="Inscritos" value={stats.inscritos} color="text-blue-500" />
            <StatMini icon={CheckCircle} label="Realizados" value={stats.realizados} color="text-green-500" />
            <StatMini icon={AlertTriangle} label="Sem Célula" value={stats.semCelula} color="text-amber-500" />
          </div>

          {/* Search */}
          <Input placeholder="Buscar inscrito..." value={search} onChange={e => setSearch(e.target.value)} />

          {/* List */}
          {regsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum inscrito" description="Inscrições aparecerão aqui." />
          ) : (
            <div className="space-y-2">
              {filtered.map(reg => {
                const st = STATUS_MAP[reg.status] || { label: reg.status, color: '' };
                return (
                  <Card key={reg.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate">{reg.full_name}</span>
                            <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                            {!reg.celula_id && (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-600 border-amber-500/30">
                                Sem célula
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                            {reg.whatsapp && <span>{reg.whatsapp}</span>}
                            {(reg.celula as any)?.name && <span>Célula: {(reg.celula as any).name}</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Por: {reg.created_by_name} — {format(new Date(reg.created_at), "dd/MM HH:mm")}
                          </p>
                          {reg.notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {reg.notes}</p>}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {reg.status !== 'inscrito' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(reg.id, 'inscrito')}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" />Marcar Inscrito
                              </DropdownMenuItem>
                            )}
                            {reg.status !== 'aprovado' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(reg.id, 'aprovado')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-cyan-500" />Aprovar
                              </DropdownMenuItem>
                            )}
                            {reg.status !== 'realizado' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(reg.id, 'realizado')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />Marcar Realizado
                              </DropdownMenuItem>
                            )}
                            {reg.status !== 'recusado' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(reg.id, 'recusado')}>
                                <XCircle className="h-4 w-4 mr-2 text-red-500" />Recusar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Register Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Inscrever Pessoa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome completo" value={regName} onChange={e => setRegName(e.target.value)} />
            <Input placeholder="WhatsApp (opcional)" value={regWhatsapp} onChange={e => setRegWhatsapp(e.target.value)} />
            <Select value={regType} onValueChange={v => setRegType(v as 'vida' | 'membro')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vida">Nova Vida</SelectItem>
                <SelectItem value="membro">Membro</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRegister(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleRegister} disabled={!regName.trim() || createReg.isPending} className="flex-1">
                {createReg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Inscrever
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatMini({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
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
