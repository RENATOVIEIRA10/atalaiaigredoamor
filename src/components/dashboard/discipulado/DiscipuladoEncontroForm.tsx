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
import { useMembers, Member } from '@/hooks/useMembers';
import { useCreateDiscipuladoEncontro } from '@/hooks/useDiscipulado';
import { format } from 'date-fns';

interface Props {
  celulaId: string;
  redeId?: string | null;
  onBack: () => void;
  onSuccess?: () => void;
}

export function DiscipuladoEncontroForm({ celulaId, redeId, onBack, onSuccess }: Props) {
  const { data: members, isLoading } = useMembers(celulaId);
  const createEncontro = useCreateDiscipuladoEncontro();

  const [dataEncontro, setDataEncontro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [realizado, setRealizado] = useState(true);
  const [observacao, setObservacao] = useState('');
  const [presentes, setPresentes] = useState<Set<string>>(new Set());

  const activeMembers = (members || []).filter(m => m.is_active);

  const toggleMember = (id: string) => {
    setPresentes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (presentes.size === activeMembers.length) {
      setPresentes(new Set());
    } else {
      setPresentes(new Set(activeMembers.map(m => m.id)));
    }
  };

  const handleSubmit = () => {
    createEncontro.mutate({
      celula_id: celulaId,
      rede_id: redeId,
      data_encontro: dataEncontro,
      realizado,
      observacao: observacao.trim() || undefined,
      presencas: activeMembers.map(m => ({
        member_id: m.id,
        presente: presentes.has(m.id),
      })),
    }, {
      onSuccess: () => {
        onSuccess?.();
        onBack();
      },
    });
  };

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
            <Input
              type="date"
              value={dataEncontro}
              onChange={e => setDataEncontro(e.target.value)}
              className="h-12 mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Encontro realizado?</Label>
            <Switch checked={realizado} onCheckedChange={setRealizado} />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Observação (opcional)</Label>
            <Textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Capítulo 3 discutido..."
              className="mt-1 min-h-[60px]"
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Presença */}
      {realizado && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">
                Participantes ({presentes.size}/{activeMembers.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
                {presentes.size === activeMembers.length ? 'Desmarcar todos' : 'Marcar todos'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {activeMembers.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer active:bg-accent/50 touch-manipulation transition-colors"
                onClick={() => toggleMember(m.id)}
              >
                <Checkbox
                  checked={presentes.has(m.id)}
                  onCheckedChange={() => toggleMember(m.id)}
                  className="h-5 w-5"
                />
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={m.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{m.profile?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <span className="text-sm flex-1 truncate">{m.profile?.name || 'Membro'}</span>
                {presentes.has(m.id) && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button
        className="w-full h-14 text-base font-semibold"
        onClick={handleSubmit}
        disabled={createEncontro.isPending || (!realizado && !observacao.trim())}
      >
        {createEncontro.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <CheckCircle2 className="h-5 w-5 mr-2" />
        )}
        Registrar Encontro
      </Button>

      <p className="text-xs text-center text-muted-foreground italic">
        Discipulado é presença, constância e cuidado.
      </p>
    </div>
  );
}
