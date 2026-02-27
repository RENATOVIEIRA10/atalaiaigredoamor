import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSpiritualEvents, useEventRegistrations, useCreateSpiritualEvent,
  useUpdateRegistrationStatus, type SpiritualEvent,
} from '@/hooks/useEventsSpiritual';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Loader2, ChevronLeft, Droplets, Star, Plus, Users, CheckCircle,
  Clock, XCircle, FileDown, MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  inscrito: { label: 'Inscrito', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  pendente: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  aprovado: { label: 'Aprovado', color: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30' },
  realizado: { label: 'Realizado', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  recusado: { label: 'Recusado', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
};

interface Props {
  type: 'batismo' | 'aclamacao';
}

export default function EventLeaderDashboard({ type }: Props) {
  const navigate = useNavigate();
  const { data: events, isLoading: eventsLoading } = useSpiritualEvents(type);
  const createEvent = useCreateSpiritualEvent();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Auto-select first event
  const activeEventId = selectedEventId || events?.[0]?.id || '';
  const { data: registrations, isLoading: regsLoading } = useEventRegistrations(activeEventId || undefined);

  const updateStatus = useUpdateRegistrationStatus();
  const [notesDialog, setNotesDialog] = useState<{ regId: string; targetStatus: string } | null>(null);
  const [notesText, setNotesText] = useState('');
  const [search, setSearch] = useState('');

  const icon = type === 'batismo' ? Droplets : Star;
  const Icon = icon;
  const title = type === 'batismo' ? 'Batismo' : 'Aclamação';

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
      aprovados: all.filter(r => r.status === 'aprovado').length,
      realizados: all.filter(r => r.status === 'realizado').length,
      recusados: all.filter(r => r.status === 'recusado').length,
    };
  }, [registrations]);

  const handleCreateEvent = () => {
    if (!newTitle || !newDate) return;
    createEvent.mutate({
      type,
      title: newTitle,
      event_date: newDate,
      start_time: null,
      location: newLocation || null,
      is_active: true,
    }, {
      onSuccess: () => {
        setShowCreateEvent(false);
        setNewTitle('');
        setNewDate('');
        setNewLocation('');
      },
    });
  };

  const handleStatusChange = (regId: string, status: string) => {
    if (['recusado'].includes(status)) {
      setNotesDialog({ regId, targetStatus: status });
      setNotesText('');
    } else {
      updateStatus.mutate({ id: regId, status });
    }
  };

  const confirmStatusWithNotes = () => {
    if (!notesDialog) return;
    updateStatus.mutate({ id: notesDialog.regId, status: notesDialog.targetStatus, notes: notesText || undefined });
    setNotesDialog(null);
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const selectedEvent = events?.find(e => e.id === activeEventId);
    const headers = ['Nome', 'WhatsApp', 'Tipo', 'Célula', 'Status', 'Inscrito por', 'Data Inscrição'];
    const rows = filtered.map(r => [
      r.full_name,
      r.whatsapp || '',
      r.person_type === 'vida' ? 'Nova Vida' : 'Membro',
      (r.celula as any)?.name || '',
      STATUS_MAP[r.status]?.label || r.status,
      r.created_by_name || '',
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvent?.title || title}_inscritos.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <Icon className="h-6 w-6 text-primary" />
            Líder do {title}
          </h1>
          <p className="text-xs text-muted-foreground">Gerenciar inscrições e acompanhamento</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateEvent(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Novo Evento
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
        <EmptyState icon={icon} title="Nenhum evento cadastrado" description={`Crie o primeiro evento de ${title}.`} />
      ) : !activeEventId ? (
        <EmptyState icon={icon} title="Selecione um evento" description="Escolha um evento para ver os inscritos." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total" value={stats.total} />
            <StatCard icon={Clock} label="Inscritos" value={stats.inscritos} color="text-blue-500" />
            <StatCard icon={CheckCircle} label="Realizados" value={stats.realizados} color="text-green-500" />
            <StatCard icon={XCircle} label="Recusados" value={stats.recusados} color="text-red-500" />
          </div>

          {/* Search + Export */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input placeholder="Buscar inscrito..." value={search} onChange={e => setSearch(e.target.value)} className="pl-3" />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1 shrink-0">
              <FileDown className="h-4 w-4" />
              CSV
            </Button>
          </div>

          {/* Registrations list */}
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
                            <Badge variant="outline" className="text-[10px]">
                              {reg.person_type === 'vida' ? 'Nova Vida' : 'Membro'}
                            </Badge>
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

      {/* Create Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Criar Evento de {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={`Ex: ${title} – 30/04/2026`} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <Input placeholder="Local (opcional)" value={newLocation} onChange={e => setNewLocation(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreateEvent(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreateEvent} disabled={!newTitle || !newDate || createEvent.isPending} className="flex-1">
                {createEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes dialog for recusado */}
      <Dialog open={!!notesDialog} onOpenChange={o => { if (!o) setNotesDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Motivo</DialogTitle></DialogHeader>
          <Textarea placeholder="Observação..." value={notesText} onChange={e => setNotesText(e.target.value)} rows={3} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setNotesDialog(null)} className="flex-1">Cancelar</Button>
            <Button onClick={confirmStatusWithNotes} className="flex-1" disabled={updateStatus.isPending}>
              {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
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
