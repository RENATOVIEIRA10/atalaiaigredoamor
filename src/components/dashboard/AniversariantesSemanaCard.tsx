import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { useAniversariantesSemana, AniversarianteSemana } from '@/hooks/useAniversariantesSemana';

interface AniversariantesSemanaCardProps {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
}

function buildBirthdayMessage(name: string): string {
  const firstName = name.split(' ')[0];
  return `Feliz aniversário, ${firstName}! 🎉\n\nQue Jesus te abençoe muito e que esse novo ano seja cheio de graça, paz e propósito. ❤️\n\n— Rede Amor a 2`;
}

function openWhatsAppBirthday(name: string, whatsapp: string | null) {
  const message = buildBirthdayMessage(name);
  const encoded = encodeURIComponent(message.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
  // If we have the phone, open a direct chat; otherwise open share picker
  const url = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!tab || tab.closed || typeof tab.closed === 'undefined') {
    window.location.href = url;
  }
}

function BirthdayRow({ b }: { b: AniversarianteSemana }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={b.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{b.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{b.name}</p>
        <p className="text-xs text-muted-foreground">{b.celula_name} · {b.display_date}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {b.is_today && <Badge className="bg-primary/10 text-primary text-xs">Hoje! 🎂</Badge>}
        {b.whatsapp ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={() => openWhatsAppBirthday(b.name, b.whatsapp)}
            title={`Enviar parabéns no WhatsApp para ${b.name}`}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground/60 hidden sm:block">Sem WhatsApp</span>
        )}
      </div>
    </div>
  );
}

export function AniversariantesSemanaCard({ scopeType, scopeId }: AniversariantesSemanaCardProps) {
  const { data: aniversariantes, isLoading } = useAniversariantesSemana({ scopeType, scopeId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🎂 Aniversariantes da Semana</h2>
      <Card>
        <CardContent className="p-4">
          {aniversariantes && aniversariantes.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {aniversariantes.map((b) => (
                <BirthdayRow key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversário nesta semana</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
