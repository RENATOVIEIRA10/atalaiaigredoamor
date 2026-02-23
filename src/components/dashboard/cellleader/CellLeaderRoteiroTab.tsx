import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ClipboardList, Send, Copy, Check, ChevronLeft, ChevronRight, Eye, Save } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useProfiles } from '@/hooks/useProfiles';
import {
  ROTEIRO_TIPOS,
  getWeekStart,
  useRoteiroSemana,
  useRoteiros,
  useSaveRoteiro,
  useUpdateRoteiroStatus,
  type RoteiroItem,
} from '@/hooks/useRoteiro';
import { format, parseISO, addDays, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  celulaId: string;
  celulaName: string;
  meetingDay?: string | null;
  redeId?: string | null;
  coupleNames?: string;
}

const DAY_MAP: Record<string, number> = {
  'segunda': 0, 'terça': 1, 'quarta': 2, 'quinta': 3,
  'sexta': 4, 'sábado': 5, 'domingo': 6,
  'segunda-feira': 0, 'terça-feira': 1, 'quarta-feira': 2, 'quinta-feira': 3,
  'sexta-feira': 4,
};

function getMeetingDate(semanaInicio: string, meetingDay?: string | null): string {
  const monday = parseISO(semanaInicio);
  if (!meetingDay) return format(monday, 'yyyy-MM-dd');
  const dayKey = meetingDay.toLowerCase().trim();
  const offset = DAY_MAP[dayKey] ?? 0;
  return format(addDays(monday, offset), 'yyyy-MM-dd');
}

export function CellLeaderRoteiroTab({ celulaId, celulaName, meetingDay, redeId, coupleNames }: Props) {
  const [semanaInicio, setSemanaInicio] = useState(getWeekStart());
  const [view, setView] = useState<'form' | 'preview' | 'history'>('form');

  const { data: roteiro, isLoading } = useRoteiroSemana(celulaId, semanaInicio);
  const { data: roteiros, isLoading: histLoading } = useRoteiros(celulaId);
  const saveMutation = useSaveRoteiro(celulaId);
  const statusMutation = useUpdateRoteiroStatus(celulaId);
  const { data: members } = useMembers(celulaId);
  const { data: profiles } = useProfiles();

  const activeMembers = useMemo(() => {
    if (!members || !profiles) return [];
    return members
      .filter((m) => m.is_active)
      .map((m) => {
        const p = profiles.find((pr) => pr.id === m.profile_id);
        return { id: m.id, name: p?.name || 'Sem nome' };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, profiles]);

  // Form state
  const [formItens, setFormItens] = useState<Record<string, { nome: string; membroId: string | null }>>({});

  // Init form from roteiro
  useEffect(() => {
    const initial: Record<string, { nome: string; membroId: string | null }> = {};
    ROTEIRO_TIPOS.forEach((t) => {
      const existing = roteiro?.itens?.find((i: any) => i.tipo === t.key);
      initial[t.key] = {
        nome: existing?.responsavel_nome || '',
        membroId: existing?.responsavel_membro_id || null,
      };
    });
    setFormItens(initial);
  }, [roteiro]);

  const dataReuniao = getMeetingDate(semanaInicio, meetingDay);

  const handleSetMembro = (tipo: string, membroId: string) => {
    if (membroId === '__manual__') {
      setFormItens((prev) => ({ ...prev, [tipo]: { nome: '', membroId: null } }));
      return;
    }
    const member = activeMembers.find((m) => m.id === membroId);
    setFormItens((prev) => ({
      ...prev,
      [tipo]: { nome: member?.name || '', membroId },
    }));
  };

  const handleSetNome = (tipo: string, nome: string) => {
    setFormItens((prev) => ({ ...prev, [tipo]: { nome, membroId: null } }));
  };

  const buildItens = (): RoteiroItem[] =>
    ROTEIRO_TIPOS.map((t) => ({
      tipo: t.key,
      responsavel_nome: formItens[t.key]?.nome || '',
      responsavel_membro_id: formItens[t.key]?.membroId || null,
    }));

  const handleSave = async (status: string) => {
    try {
      await saveMutation.mutateAsync({
        semanaInicio,
        dataReuniao,
        redeId,
        criadoPor: null,
        status,
        itens: buildItens(),
      });
      toast.success(status === 'pronto' ? 'Roteiro gerado!' : 'Rascunho salvo!');
      if (status === 'pronto') setView('preview');
    } catch {
      toast.error('Erro ao salvar roteiro.');
    }
  };

  const buildText = (itensData?: RoteiroItem[]) => {
    const items = itensData || buildItens();
    const lines = ROTEIRO_TIPOS.map((t) => {
      const item = items.find((i) => i.tipo === t.key);
      const nome = item?.responsavel_nome || '(a definir)';
      return `${t.emoji} ${t.label}: ${nome}`;
    });
    return `*ROTEIRO DA CÉLULA — ${celulaName}* ❤️\n\n(${format(parseISO(dataReuniao), "dd 'de' MMMM", { locale: ptBR })})\n\n${lines.join('\n')}\n\nVamos servir com alegria. Deus abençoe! 🤍`;
  };

  const handleWhatsApp = () => {
    const text = buildText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado!');
  };

  const handleMarkSent = async () => {
    if (!roteiro?.id) return;
    try {
      await statusMutation.mutateAsync({ roteiroId: roteiro.id, status: 'enviado' });
      toast.success('Roteiro marcado como enviado!');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const weekLabel = `${format(parseISO(semanaInicio), "dd/MM", { locale: ptBR })} — ${format(addDays(parseISO(semanaInicio), 6), "dd/MM", { locale: ptBR })}`;

  if (isLoading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  // History view
  if (view === 'history') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('form')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h2 className="font-semibold text-lg">Histórico de Roteiros</h2>
        </div>
        {histLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !roteiros?.length ? (
          <EmptyState icon={ClipboardList} title="Nenhum roteiro" description="Você ainda não criou nenhum roteiro." />
        ) : (
          <div className="space-y-2">
            {roteiros.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      Semana {format(parseISO(r.semana_inicio), "dd/MM", { locale: ptBR })} — Reunião {format(parseISO(r.data_reuniao), "dd/MM", { locale: ptBR })}
                    </p>
                    <Badge variant={r.status === 'enviado' ? 'default' : r.status === 'pronto' ? 'secondary' : 'outline'} className="text-xs mt-1">
                      {r.status === 'enviado' ? '✅ Enviado' : r.status === 'pronto' ? '📋 Pronto' : '✏️ Rascunho'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSemanaInicio(r.semana_inicio);
                      setView('form');
                    }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Preview view
  if (view === 'preview') {
    const text = buildText();
    const hasEmpty = ROTEIRO_TIPOS.some((t) => !formItens[t.key]?.nome);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('form')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Editar
          </Button>
          <h2 className="font-semibold text-lg">Preview do Roteiro</h2>
        </div>
        {hasEmpty && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
            ⚠️ Há campos sem responsável definido.
          </div>
        )}
        <Card>
          <CardContent className="p-4">
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{text}</pre>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Button className="w-full h-12" onClick={handleWhatsApp}>
            <Send className="h-4 w-4 mr-2" /> Enviar roteiro no WhatsApp
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleCopy(text)}>
            <Copy className="h-4 w-4 mr-2" /> Copiar texto
          </Button>
          {roteiro && roteiro.status !== 'enviado' && (
            <Button variant="secondary" className="w-full" onClick={handleMarkSent} disabled={statusMutation.isPending}>
              <Check className="h-4 w-4 mr-2" /> Marcar como enviado
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Form view (default)
  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSemanaInicio(getWeekStart(subWeeks(parseISO(semanaInicio), 1)))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{weekLabel}</p>
          <p className="text-xs text-muted-foreground">Reunião: {format(parseISO(dataReuniao), "EEEE, dd/MM", { locale: ptBR })}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSemanaInicio(getWeekStart(addWeeks(parseISO(semanaInicio), 1)))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {roteiro && (
        <Badge variant={roteiro.status === 'enviado' ? 'default' : roteiro.status === 'pronto' ? 'secondary' : 'outline'}>
          {roteiro.status === 'enviado' ? '✅ Enviado' : roteiro.status === 'pronto' ? '📋 Pronto' : '✏️ Rascunho'}
        </Badge>
      )}

      {/* Form fields */}
      <div className="space-y-3">
        {ROTEIRO_TIPOS.map((tipo) => {
          const val = formItens[tipo.key];
          return (
            <Card key={tipo.key}>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium">{tipo.emoji} {tipo.label}</p>
                <Select
                  value={val?.membroId || '__manual__'}
                  onValueChange={(v) => handleSetMembro(tipo.key, v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecionar membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">✍️ Digitar nome</SelectItem>
                    {activeMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!val?.membroId && (
                  <Input
                    placeholder="Nome do responsável"
                    value={val?.nome || ''}
                    onChange={(e) => handleSetNome(tipo.key, e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleSave('rascunho')}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" /> Salvar rascunho
        </Button>
        <Button
          className="w-full h-12"
          onClick={() => handleSave('pronto')}
          disabled={saveMutation.isPending}
        >
          <ClipboardList className="h-4 w-4 mr-2" /> Gerar roteiro
        </Button>
      </div>

      {/* History link */}
      <Button variant="link" className="w-full text-sm" onClick={() => setView('history')}>
        Ver histórico de roteiros
      </Button>
    </div>
  );
}
