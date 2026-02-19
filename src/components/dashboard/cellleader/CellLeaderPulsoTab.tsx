import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, GraduationCap, BookOpen, Baby, MessageSquare, Cake } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { MissionVerse } from '../MissionVerse';

interface CellLeaderPulsoTabProps {
  celulaId: string;
}

function buildBirthdayMessage(name: string): string {
  const firstName = name.split(' ')[0];
  return `Feliz aniversário, ${firstName}! 🎉\n\nQue Jesus te abençoe muito e que esse novo ano seja cheio de graça, paz e propósito. ❤️\n\n— Rede Amor a 2`;
}

function openWhatsAppBirthday(name: string, whatsapp: string | null) {
  const message = buildBirthdayMessage(name);
  const encoded = encodeURIComponent(message.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
  const url = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!tab || tab.closed || typeof tab.closed === 'undefined') {
    window.location.href = url;
  }
}

export function CellLeaderPulsoTab({ celulaId }: CellLeaderPulsoTabProps) {
  const { data: members, isLoading } = useMembers(celulaId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeMembers = (members || []).filter(m => m.is_active);
  const totalMembers = activeMembers.length;
  const leadersInTraining = activeMembers.filter(m => m.is_lider_em_treinamento).length;
  const discipleships = activeMembers.filter(m => m.is_discipulado).length;

  // Birthday calculation
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday

  const birthdays = activeMembers
    .filter(m => {
      const bd = m.profile?.birth_date;
      if (!bd) return false;
      const d = new Date(bd + 'T00:00:00');
      const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      return thisYear >= startOfWeek && thisYear <= endOfWeek;
    })
    .map(m => {
      const bd = new Date(m.profile!.birth_date! + 'T00:00:00');
      const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      const isToday = thisYear.toDateString() === today.toDateString();
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return {
        id: m.id,
        name: m.profile?.name || 'Membro',
        avatar_url: m.profile?.avatar_url,
        whatsapp: m.whatsapp,
        is_today: isToday,
        display_date: `${dayNames[thisYear.getDay()]} ${thisYear.getDate()}/${thisYear.getMonth() + 1}`,
      };
    })
    .sort((a, b) => (a.is_today ? -1 : 0) - (b.is_today ? -1 : 0));

  return (
    <div className="space-y-4">
      <MissionVerse role="celula_leader" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">{totalMembers}</span>
            <span className="text-xs text-muted-foreground">Membros</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <GraduationCap className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">{leadersInTraining}</span>
            <span className="text-xs text-muted-foreground">Líd. Treinamento</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <BookOpen className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">{discipleships}</span>
            <span className="text-xs text-muted-foreground">Discipulados</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Cake className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">{birthdays.length}</span>
            <span className="text-xs text-muted-foreground">Aniversários</span>
          </CardContent>
        </Card>
      </div>

      {/* Birthdays */}
      {birthdays.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🎂 Aniversariantes da Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {birthdays.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={b.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{b.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.display_date}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {b.is_today && <Badge className="bg-primary/10 text-primary text-xs">Hoje! 🎂</Badge>}
                  {b.whatsapp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => openWhatsAppBirthday(b.name, b.whatsapp)}
                      title={`Enviar parabéns para ${b.name}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
