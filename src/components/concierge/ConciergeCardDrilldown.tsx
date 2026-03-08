import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, User, MapPin, Phone, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useConciergeNovasVidasAguardando,
  useConciergeCelulasSemRelatorio,
  useConciergeNovasVidasMes,
  type NovaVidaDetail,
  type CelulaSemRelatorioDetail,
} from '@/hooks/useConciergeCardDrilldown';

interface Props {
  cardId: string;
  cardTitle: string;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  nova: 'Nova',
  em_triagem: 'Em triagem',
  encaminhada: 'Encaminhada',
  recebida_pela_celula: 'Recebida pela célula',
  contatada: 'Contatada',
  agendada: 'Agendada',
  integrada: 'Integrada',
  membro: 'Membro',
};

const dayLabels: Record<string, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export function ConciergeCardDrilldown({ cardId, cardTitle, onClose }: Props) {
  const isVidasAguardando = cardId === 'novas-vidas-pendentes' || cardId === 'vidas-aguardando-contato';
  const isCelulasSemRelatorio = cardId === 'celulas-sem-relatorio';
  const isVidasMes = cardId === 'novas-vidas-mes';

  const { data: vidasAguardando, isLoading: loadingVidas } = useConciergeNovasVidasAguardando(isVidasAguardando);
  const { data: celulasSemRelatorio, isLoading: loadingCelulas } = useConciergeCelulasSemRelatorio(isCelulasSemRelatorio);
  const { data: vidasMes, isLoading: loadingVidasMes } = useConciergeNovasVidasMes(isVidasMes);

  const isLoading = loadingVidas || loadingCelulas || loadingVidasMes;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/95 backdrop-blur-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl"
          onClick={onClose}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-foreground truncate">{cardTitle}</h3>
      </div>

      {/* Content */}
      <ScrollArea className="max-h-[400px]">
        <div className="p-4 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          )}

          {/* Novas Vidas Aguardando / Novas Vidas no Mês */}
          {(isVidasAguardando || isVidasMes) && !isLoading && (
            <VidaList vidas={isVidasAguardando ? vidasAguardando : vidasMes} />
          )}

          {/* Células sem relatório */}
          {isCelulasSemRelatorio && !isLoading && (
            <CelulaList celulas={celulasSemRelatorio} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function VidaList({ vidas }: { vidas: NovaVidaDetail[] | undefined }) {
  if (!vidas?.length) {
    return <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro encontrado</p>;
  }

  return (
    <>
      {vidas.map(vida => (
        <div
          key={vida.id}
          className="flex items-start gap-3 rounded-xl border border-border/30 bg-background/40 p-3.5 transition-colors hover:bg-background/60"
        >
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground truncate">{vida.nome}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {statusLabels[vida.status] ?? vida.status}
              </Badge>
              {vida.celula_nome && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {vida.celula_nome}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(vida.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              {vida.whatsapp && (
                <a
                  href={`https://wa.me/${vida.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-success hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function CelulaList({ celulas }: { celulas: CelulaSemRelatorioDetail[] | undefined }) {
  if (!celulas?.length) {
    return <p className="text-sm text-muted-foreground text-center py-6">Todas as células enviaram relatório!</p>;
  }

  return (
    <>
      <p className="text-xs text-muted-foreground mb-1">{celulas.length} célula{celulas.length > 1 ? 's' : ''} pendente{celulas.length > 1 ? 's' : ''}</p>
      {celulas.map(cel => (
        <div
          key={cel.id}
          className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/40 p-3.5 transition-colors hover:bg-background/60"
        >
          <div className="rounded-lg bg-amber-500/10 p-2">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{cel.name}</p>
            {cel.meeting_day && (
              <p className="text-[10px] text-muted-foreground">
                {dayLabels[cel.meeting_day] ?? cel.meeting_day}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-600 shrink-0">
            Pendente
          </Badge>
        </div>
      ))}
    </>
  );
}
