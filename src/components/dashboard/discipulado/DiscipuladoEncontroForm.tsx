import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useCreateDiscipuladoEncontro, DiscipuladoNivel } from '@/hooks/useDiscipulado';
import { format } from 'date-fns';

interface Participant {
  id: string;
  name: string;
  avatar_url?: string | null;
  type: 'member' | 'profile';
}

interface Props {
  nivel: DiscipuladoNivel;
  celulaId?: string;
  coordenacaoId?: string;
  redeId?: string | null;
  participants?: Participant[];
  onBack: () => void;
  onSuccess?: () => void;
}

export function DiscipuladoEncontroForm({ nivel, celulaId, coordenacaoId, redeId, participants: externalParticipants, onBack, onSuccess }: Props) {
  // For celula level, load members internally
  const { data: members, isLoading: membersLoading } = useMembers(nivel === 'celula' ? celulaId : undefined);
  const createEncontro = useCreateDiscipuladoEncontro();

  const [dataEncontro, setDataEncontro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [realizado, setRealizado] = useState(true);
  const [observacao, setObservacao] = useState('');
  const [presentes, setPresentes] = useState<Set<string>>(new Set());

  const participants: Participant[] = nivel === 'celula'
    ? (members || []).filter(m => m.is_active).map(m => ({
        id: m.id,
        name: m.profile?.name || 'Membro',
        avatar_url: m.profile?.avatar_url,
        type: 'member' as const,
      }))
    : externalParticipants || [];

  const isLoading = nivel === 'celula' ? membersLoading : false;

  const toggleParticipant = (id: string) => {
    setPresentes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (presentes.size === participants.length) {
      setPresentes(new Set());
    } else {
      setPresentes(new Set(participants.map(p => p.id)));
    }
  };

  const handleSubmit = () => {
    const presencasData = participants.map(p => ({
      ...(p.type === 'member' ? { member_id: p.id } : { profile_id: p.id }),
      presente: presentes.has(p.id),
    }));

    createEncontro.mutate({
      celula_id: celulaId || null,
      coordenacao_id: coordenacaoId || null,
      rede_id: redeId || null,
      nivel,
      data_encontro: dataEncontro,
      realizado,
      observacao: observacao.trim() || undefined,
      presencas: presencasData,
    }, {
      onSuccess: () => {
        onSuccess?.();
        onBack();
      },
    });
  };

  const nivelLabel = nivel === 'celula' ? 'Membros' : nivel === 'coordenacao' ? 'Líderes de Célula' : 'Coordenadores';

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 h-11 touch-manipulation">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Novo Encontro de Discipulado</h2>
      </div>

      {/* Data + Status */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Data do Encontro</Label>
            <Input type="date" value={dataEncontro} onChange={e => setDataEncontro(e.target.value)} className="h-12 mt-1" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Encontro realizado?</Label>
            <Switch checked={realizado} onCheckedChange={setRealizado} />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Observação (opcional)</Label>
            <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: Capítulo 3 discutido..." className="mt-1 min-h-[60px]" maxLength={200} />
          </div>
        </CardContent>
      </Card>

      {/* Presença */}
      {realizado && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">
                {nivelLabel} ({presentes.size}/{participants.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
                {presentes.size === participants.length ? 'Desmarcar todos' : 'Marcar todos'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante encontrado</p>
            ) : (
              participants.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer active:bg-accent/50 touch-manipulation transition-colors"
                  onClick={() => toggleParticipant(p.id)}
                >
                  <Checkbox checked={presentes.has(p.id)} onCheckedChange={() => toggleParticipant(p.id)} className="h-5 w-5" />
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{p.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{p.name}</span>
                  {presentes.has(p.id) && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full h-14 text-base font-semibold"
        onClick={handleSubmit}
        disabled={createEncontro.isPending || (!realizado && !observacao.trim())}
      >
        {createEncontro.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
        Registrar Encontro
      </Button>

      <p className="text-xs text-center text-muted-foreground italic">Discipulado é presença, constância e cuidado.</p>
    </div>
  );
}
